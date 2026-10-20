<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use DateTimeImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Modules\IdentityAccess\Models\User;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanProduct;
use Modules\Loan\Models\LoanSetting;
use Modules\Loan\Support\AmortizationCalculator;
use Modules\Loan\Support\CollectionStatusService;
use Modules\Members\Models\Member;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class CollectionStatusTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    private LoanProduct $product;

    private int $sequence = 0;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-06-20 10:00:00');
        LoanSetting::current()->update(['portal_access_mode' => 'online']);

        $this->member = Member::create(['member_code' => 'M-0001', 'name' => 'Juan Dela Cruz', 'mobile_number' => '+639171234567', 'status' => 'active', 'is_delinquent' => false]);
        $this->product = LoanProduct::create([
            'code' => 'REG', 'name' => 'Regular', 'min_amount' => 1000, 'max_amount' => 500000, 'interest_rate' => 12,
            'interest_method' => 'diminishing', 'term_min_months' => 1, 'term_max_months' => 36, 'payment_frequency' => 'monthly', 'status' => 'active',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /** A 12-month loan whose first installment fell due on $firstDue. */
    private function loan(string $firstDue, ?Member $member = null): Loan
    {
        $this->sequence++;
        $member ??= $this->member;
        $schedule = AmortizationCalculator::build('100000.00', '12', 'diminishing', 'equal_installment', 'monthly', 12, new DateTimeImmutable($firstDue));

        $loan = Loan::create([
            'application_id' => LoanApplication::create([
                'reference_no' => 'LN-2026-'.str_pad((string) $this->sequence, 6, '0', STR_PAD_LEFT), 'member_id' => $member->id, 'product_id' => $this->product->id,
                'status' => 'released', 'amount' => 100000, 'term_months' => 12, 'purpose' => 'x', 'submitted_at' => now(),
            ])->id,
            'loan_no' => 'LO-2026-'.str_pad((string) $this->sequence, 6, '0', STR_PAD_LEFT), 'member_id' => $member->id, 'product_id' => $this->product->id,
            'principal' => 100000, 'total_interest' => $schedule['total_interest'], 'outstanding_balance' => $schedule['total_payable'],
            'installments_count' => 12, 'first_due_date' => $firstDue, 'maturity_date' => $schedule['maturity_date'], 'status' => 'active',
            'released_at' => '2026-01-01 09:00:00', 'penalty_rate_percent' => 2, 'grace_period_days' => 0, 'penalty_basis' => 'installment',
            'penalty_calculation' => 'per_month_or_fraction', 'payment_allocation' => 'penalty_interest_principal',
        ]);

        foreach ($schedule['items'] as $item) {
            $loan->scheduleItems()->create(['number' => $item['number'], 'due_date' => $item['due_date'], 'principal' => $item['principal'], 'interest' => $item['interest'], 'total' => $item['total'], 'balance_after' => $item['balance_after']]);
        }

        return $loan;
    }

    private function staff(array $permissions = ['loan.payments.view', 'loan.payments.record']): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $user;
    }

    public function test_refreshing_labels_the_loan_and_keeps_a_history(): void
    {
        $loan = $this->loan('2026-03-15');   // oldest unpaid installment fell due 97 days before 20 Jun

        app(CollectionStatusService::class)->refresh($loan);

        $loan->refresh();
        $this->assertSame('default', $loan->collection_status);
        $this->assertSame(97, $loan->days_past_due);
        $this->assertSame('2026-03-15', $loan->oldest_due_date->format('Y-m-d'));
        $this->assertGreaterThan(0, (float) $loan->overdue_amount);
        $this->assertDatabaseHas('loan_status_history', ['loan_id' => $loan->id, 'from_status' => 'current', 'to_status' => 'default', 'days_past_due' => 97]);

        // checking again with nothing changed adds no history
        app(CollectionStatusService::class)->refresh($loan->refresh());
        $this->assertDatabaseCount('loan_status_history', 1);
    }

    public function test_labels_follow_the_days_past_due_and_the_cooperatives_thresholds(): void
    {
        $service = app(CollectionStatusService::class);

        $this->assertSame('current', $service->evaluate($this->loan('2026-07-15'))['status']);
        $this->assertSame('due', $service->evaluate($this->loan('2026-06-20'))['status']);
        $this->assertSame('overdue', $service->evaluate($this->loan('2026-06-01'))['status']);       // 19 days
        $this->assertSame('delinquent', $service->evaluate($this->loan('2026-05-10'))['status']);    // 41 days
        $this->assertSame('default', $service->evaluate($this->loan('2026-03-01'))['status']);       // 111 days

        LoanSetting::current()->update(['delinquent_after_days' => 60, 'default_after_days' => 120]);

        $this->assertSame('overdue', $service->evaluate($this->loan('2026-05-10'))['status']);
        $this->assertSame('delinquent', $service->evaluate($this->loan('2026-03-01'))['status']);
    }

    public function test_the_nightly_command_updates_every_active_loan(): void
    {
        $late = $this->loan('2026-05-10');
        $fine = $this->loan('2026-07-15', Member::create(['member_code' => 'M-0002', 'name' => 'Maria', 'mobile_number' => '+639171234568', 'status' => 'active', 'is_delinquent' => false]));

        $this->artisan('loans:update-collection-status')->expectsOutputToContain('Checked 2 loan(s)')->assertExitCode(0);

        $this->assertSame('delinquent', $late->refresh()->collection_status);
        $this->assertSame('current', $fine->refresh()->collection_status);

        $this->artisan('loans:update-collection-status', ['--date' => '2026-12-01'])->assertExitCode(0);
        $this->assertSame('default', $fine->refresh()->collection_status);   // looked at as of a later date

        $this->artisan('loans:update-collection-status', ['--date' => 'tomorrow'])->assertExitCode(1);
    }

    public function test_recording_a_payment_updates_the_label_immediately(): void
    {
        $loan = $this->loan('2026-05-10');
        app(CollectionStatusService::class)->refresh($loan);
        $this->assertSame('delinquent', $loan->refresh()->collection_status);

        $this->actingAs($this->staff());
        $dueNow = $this->getJson("/api/loan/loans/{$loan->id}")->assertOk()->json('data.summary.due_now');
        $this->postJson("/api/loan/loans/{$loan->id}/payments", ['amount' => $dueNow, 'paid_on' => '2026-06-20', 'method' => 'cash'])->assertOk();

        $loan->refresh();
        $this->assertSame('current', $loan->collection_status);
        $this->assertSame(0, $loan->days_past_due);
        $this->assertDatabaseHas('loan_status_history', ['loan_id' => $loan->id, 'from_status' => 'delinquent', 'to_status' => 'current']);
    }

    public function test_paying_off_the_loan_marks_it_paid_and_the_label_returns_if_the_payment_is_voided(): void
    {
        $loan = $this->loan('2026-05-10');
        $this->actingAs($this->staff(['loan.payments.view', 'loan.payments.record', 'loan.payments.void']));

        $payoff = $this->getJson("/api/loan/loans/{$loan->id}")->json('data.summary.payoff');
        $id = $this->postJson("/api/loan/loans/{$loan->id}/payments", ['amount' => $payoff, 'paid_on' => '2026-06-20', 'method' => 'cash'])->json('data.payments.0.id');
        $this->assertSame('paid', $loan->refresh()->collection_status);

        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$id}/void", ['reason' => 'Bounced check'])->assertOk();
        $this->assertSame('delinquent', $loan->refresh()->collection_status);
    }

    public function test_the_follow_up_list_shows_only_late_loans_worst_first_with_filters(): void
    {
        $worst = $this->loan('2026-03-01');
        $other = Member::create(['member_code' => 'M-0002', 'name' => 'Maria Santos', 'mobile_number' => '+639171234568', 'status' => 'active', 'is_delinquent' => false]);
        $mild = $this->loan('2026-06-01', $other);
        $this->loan('2026-07-15', Member::create(['member_code' => 'M-0003', 'name' => 'Pedro', 'mobile_number' => '+639171234569', 'status' => 'active', 'is_delinquent' => false]));   // current

        $this->actingAs($this->staff());

        $all = $this->getJson('/api/loan/collections')->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame([$worst->id, $mild->id], array_column($all->json('data'), 'id'));
        $this->assertSame('+639171234567', $all->json('data.0.member.mobile_number'));
        $this->assertSame('91+', $all->json('data.0.bucket'));

        $this->getJson('/api/loan/collections?status=overdue')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mild->id);
        $this->getJson('/api/loan/collections?bucket=91%2B')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $worst->id);
        $this->getJson('/api/loan/collections?bucket=1-30')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mild->id);
        $this->getJson('/api/loan/collections?q=Santos')->assertJsonCount(1, 'data');
    }

    public function test_the_list_fixes_itself_when_the_nightly_job_has_not_run(): void
    {
        $this->loan('2026-03-01');   // saved as "current" and never checked
        $this->actingAs($this->staff());

        $this->getJson('/api/loan/collections')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.collection_status', 'default');
    }

    public function test_the_summary_counts_loans_by_label_and_aging_and_gives_portfolio_at_risk(): void
    {
        $this->loan('2026-03-01');
        $this->loan('2026-06-01', Member::create(['member_code' => 'M-0002', 'name' => 'Maria', 'mobile_number' => '+639171234568', 'status' => 'active', 'is_delinquent' => false]));
        $this->loan('2026-07-15', Member::create(['member_code' => 'M-0003', 'name' => 'Pedro', 'mobile_number' => '+639171234569', 'status' => 'active', 'is_delinquent' => false]));
        $this->actingAs($this->staff());

        $data = $this->getJson('/api/loan/collections/summary')->assertOk()->json('data');

        $this->assertSame(3, $data['active_loans']);
        $this->assertSame(1, $data['statuses']['default']['loans']);
        $this->assertSame(1, $data['statuses']['overdue']['loans']);
        $this->assertSame(1, $data['statuses']['current']['loans']);
        $this->assertSame(1, $data['buckets']['91+']['loans']);
        $this->assertSame(1, $data['buckets']['1-30']['loans']);
        $this->assertEqualsWithDelta(33.33, $data['portfolio_at_risk_percent'], 0.5);   // one of three equal loans is over 30 days late
    }

    public function test_the_follow_up_list_needs_the_view_permission(): void
    {
        $this->actingAs($this->staff([]));

        $this->getJson('/api/loan/collections')->assertForbidden();
        $this->getJson('/api/loan/collections/summary')->assertForbidden();
    }

    public function test_the_loan_screen_shows_the_label_live_and_the_member_sees_it_too(): void
    {
        $loan = $this->loan('2026-05-10');
        $this->actingAs($this->staff());

        $this->getJson("/api/loan/loans/{$loan->id}")->assertOk()
            ->assertJsonPath('data.summary.collection_status', 'delinquent')
            ->assertJsonPath('data.summary.days_past_due', 41);

        $this->app['auth']->forgetGuards();
        $res = $this->postJson('/api/loan-portal/auth/login', ['member_code' => 'M-0001'])->assertOk();
        $this->withUnencryptedCookie('loan_portal_session', $res->getCookie('loan_portal_session', false)->getValue());
        $this->getJson("/api/loan-portal/loans/{$loan->id}")->assertOk()->assertJsonPath('data.summary.collection_status', 'delinquent');
    }

    public function test_the_thresholds_are_validated_in_settings(): void
    {
        $this->actingAs($this->staff(['loan.settings.manage']));
        $current = $this->getJson('/api/loan/settings')->assertOk()->assertJsonPath('data.delinquent_after_days', 30)->assertJsonPath('data.default_after_days', 90)->json('data');

        $this->patchJson('/api/loan/settings', array_merge($current, ['default_after_days' => 20]))->assertStatus(422)->assertJsonValidationErrors('default_after_days');
        $this->patchJson('/api/loan/settings', array_merge($current, ['delinquent_after_days' => 0]))->assertStatus(422)->assertJsonValidationErrors('delinquent_after_days');
        $this->patchJson('/api/loan/settings', array_merge($current, ['delinquent_after_days' => 15, 'default_after_days' => 60]))->assertOk()->assertJsonPath('data.default_after_days', 60);
    }
}
