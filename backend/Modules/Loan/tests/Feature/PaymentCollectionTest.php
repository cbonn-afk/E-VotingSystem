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
use Modules\Loan\Models\LoanScheduleItem;
use Modules\Loan\Models\LoanSetting;
use Modules\Loan\Support\AgreementService;
use Modules\Loan\Support\AmortizationCalculator;
use Modules\Loan\Support\PaymentEngine;
use Modules\Loan\Support\PaymentService;
use Modules\Loan\Support\ReleaseService;
use Modules\Members\Models\Member;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class PaymentCollectionTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    private LoanProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-06-20 10:00:00');
        LoanSetting::current()->update(['portal_access_mode' => 'online']);

        $this->member = Member::create(['member_code' => 'M-0001', 'name' => 'Juan', 'mobile_number' => '+639171234567', 'status' => 'active', 'is_delinquent' => false]);
        $this->product = LoanProduct::create([
            'code' => 'REG', 'name' => 'Regular', 'min_amount' => 1000, 'max_amount' => 500000, 'interest_rate' => 12,
            'interest_method' => 'diminishing', 'term_min_months' => 1, 'term_max_months' => 36, 'payment_frequency' => 'monthly', 'penalty_rate_percent' => 3, 'status' => 'active',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /** A loan released on 1 Mar 2026 with 12 monthly installments from 15 Mar, so four (15 Mar to 15 Jun) are overdue on 20 Jun. */
    private function loan(array $overrides = []): Loan
    {
        $schedule = AmortizationCalculator::build('100000.00', '12', 'diminishing', 'equal_installment', 'monthly', 12, new DateTimeImmutable('2026-03-15'));

        $loan = Loan::create($overrides + [
            'application_id' => LoanApplication::create([
                'reference_no' => 'LN-2026-000001', 'member_id' => $this->member->id, 'product_id' => $this->product->id, 'status' => 'released',
                'amount' => 100000, 'term_months' => 12, 'purpose' => 'x', 'submitted_at' => now(),
            ])->id,
            'loan_no' => 'LO-2026-000001', 'member_id' => $this->member->id, 'product_id' => $this->product->id,
            'principal' => 100000, 'total_interest' => $schedule['total_interest'], 'outstanding_balance' => $schedule['total_payable'],
            'installments_count' => 12, 'first_due_date' => '2026-03-15', 'maturity_date' => $schedule['maturity_date'], 'status' => 'active',
            'released_at' => '2026-03-01 09:00:00', 'penalty_rate_percent' => 2, 'grace_period_days' => 0, 'penalty_basis' => 'installment',
            'penalty_calculation' => 'per_month_or_fraction', 'payment_allocation' => 'penalty_interest_principal',
        ]);

        foreach ($schedule['items'] as $item) {
            $loan->scheduleItems()->create(['number' => $item['number'], 'due_date' => $item['due_date'], 'principal' => $item['principal'], 'interest' => $item['interest'], 'total' => $item['total'], 'balance_after' => $item['balance_after']]);
        }

        return $loan;
    }

    private function cashier(array $permissions = ['loan.payments.view', 'loan.payments.record']): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $user;
    }

    private function pay(Loan $loan, array $body = [], ?User $by = null)
    {
        $this->actingAs($by ?? $this->cashier());

        return $this->postJson("/api/loan/loans/{$loan->id}/payments", $body + ['amount' => '1000', 'paid_on' => '2026-06-20', 'method' => 'cash']);
    }

    private function expectedPenalty(Loan $loan, string $asOf): int
    {
        $service = app(PaymentService::class);

        return PaymentEngine::snapshot($service->itemsFrom($loan->scheduleItems()->get()), $service->rule($loan), new DateTimeImmutable($asOf))['penalty_owed'];
    }

    public function test_viewing_and_recording_need_their_own_permissions(): void
    {
        $loan = $this->loan();

        $this->actingAs($this->cashier([]));
        $this->getJson('/api/loan/loans')->assertForbidden();
        $this->pay($loan, [], $this->cashier(['loan.payments.view']))->assertForbidden();
        $this->pay($loan)->assertOk();
    }

    public function test_the_loan_shows_what_is_due_now_including_penalties(): void
    {
        $loan = $this->loan();
        $this->actingAs($this->cashier());

        $summary = $this->getJson("/api/loan/loans/{$loan->id}")->assertOk()->json('data.summary');

        $this->assertSame(4, $summary['overdue_count']);
        $this->assertSame(number_format($this->expectedPenalty($loan, '2026-06-20') / 100, 2, '.', ''), $summary['penalty_owed']);
        $this->assertGreaterThan(0, (float) $summary['penalty_owed']);
        $this->assertSame('2026-07-15', $summary['next_due']['due_date']);
    }

    public function test_a_payment_goes_to_penalty_first_and_updates_the_balance(): void
    {
        $loan = $this->loan();
        $penalty = $this->expectedPenalty($loan, '2026-06-20');

        $res = $this->pay($loan, ['amount' => '1000'])->assertOk();

        $payment = $res->json('data.payments.0');
        $this->assertMatchesRegularExpression('/^PR-\d{4}-\d{6}$/', $payment['receipt_no']);
        $this->assertSame('1000.00', $payment['applied_to']['penalty']);   // the penalty owed is larger than 1,000, so all of it goes there
        $this->assertSame('0.00', $payment['applied_to']['principal']);
        $this->assertGreaterThan(1000.0 * 100, $penalty);
        $this->assertSame('106618.53', $res->json('data.outstanding_balance'));    // principal and interest are untouched
    }

    public function test_a_bigger_payment_also_reduces_interest_and_principal(): void
    {
        $loan = $this->loan();
        $penalty = $this->expectedPenalty($loan, '2026-06-20');
        $amount = number_format(($penalty + 888488 + 100) / 100, 2, '.', '');

        $payment = $this->pay($loan, ['amount' => $amount])->assertOk()->json('data.payments.0');

        $this->assertSame(number_format($penalty / 100, 2, '.', ''), $payment['applied_to']['penalty']);
        $this->assertGreaterThan(0, (float) $payment['applied_to']['interest']);
        $this->assertGreaterThan(0, (float) $payment['applied_to']['principal']);
        $this->assertSame($amount, number_format((float) $payment['applied_to']['penalty'] + (float) $payment['applied_to']['interest'] + (float) $payment['applied_to']['principal'], 2, '.', ''));
    }

    public function test_the_payment_order_follows_the_rule_the_loan_was_signed_under(): void
    {
        $loan = $this->loan(['payment_allocation' => 'interest_penalty_principal']);

        $payment = $this->pay($loan, ['amount' => '500'])->assertOk()->json('data.payments.0');

        $this->assertSame('500.00', $payment['applied_to']['interest']);
        $this->assertSame('0.00', $payment['applied_to']['penalty']);
    }

    public function test_a_loan_with_no_penalty_rate_never_charges_one(): void
    {
        $loan = $this->loan(['penalty_rate_percent' => 0]);
        $this->actingAs($this->cashier());

        $this->getJson("/api/loan/loans/{$loan->id}")->assertOk()->assertJsonPath('data.summary.penalty_owed', '0.00');
    }

    public function test_payment_dates_are_checked(): void
    {
        $loan = $this->loan();

        $this->pay($loan, ['paid_on' => '2026-06-21'])->assertStatus(422)->assertJsonValidationErrors('paid_on');   // future
        $this->pay($loan, ['paid_on' => '2026-02-01'])->assertStatus(422)->assertJsonValidationErrors('paid_on');   // before release
        $this->pay($loan, ['paid_on' => '2026-06-10'])->assertOk();
        $this->pay($loan, ['paid_on' => '2026-06-05'])->assertStatus(422)->assertJsonValidationErrors('paid_on');   // before the last payment
    }

    public function test_a_check_or_transfer_needs_a_reference_and_the_amount_cannot_exceed_the_balance(): void
    {
        $loan = $this->loan();

        $this->pay($loan, ['method' => 'check'])->assertStatus(422)->assertJsonValidationErrors('reference_no');
        $this->pay($loan, ['method' => 'check', 'reference_no' => 'CHK-1'])->assertOk();
        $this->pay($loan, ['amount' => '999999'])->assertStatus(422)->assertJsonValidationErrors('amount');
        $this->pay($loan, ['amount' => '0'])->assertStatus(422);
    }

    public function test_paying_the_whole_balance_closes_the_loan_to_further_payments(): void
    {
        $loan = $this->loan();
        $this->actingAs($this->cashier());
        $payoff = $this->getJson("/api/loan/loans/{$loan->id}")->json('data.summary.payoff');

        $this->pay($loan, ['amount' => $payoff])->assertOk()->assertJsonPath('data.status', 'fully_paid')->assertJsonPath('data.outstanding_balance', '0.00');
        $this->pay($loan)->assertStatus(422)->assertJsonValidationErrors('status');
        $this->assertNotNull($loan->refresh()->fully_paid_at);
    }

    public function test_voiding_restores_the_loan_exactly_and_needs_a_reason_and_permission(): void
    {
        $loan = $this->loan();
        $before = $loan->scheduleItems()->get()->map->only(['paid_principal', 'paid_interest', 'paid_penalty', 'penalty_accrued', 'penalty_through'])->toArray();

        $first = $this->pay($loan, ['amount' => '5000', 'paid_on' => '2026-06-10'])->json('data.payments.0.id');
        $second = $this->pay($loan, ['amount' => '3000'])->json('data.payments.0.id');

        $admin = $this->cashier(['loan.payments.view', 'loan.payments.void']);

        $this->actingAs($this->cashier());
        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$second}/void", ['reason' => 'x'])->assertForbidden();

        $this->actingAs($admin);
        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$second}/void", [])->assertStatus(422)->assertJsonValidationErrors('reason');
        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$first}/void", ['reason' => 'Wrong loan'])->assertStatus(422)->assertJsonValidationErrors('payment'); // not the latest

        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$second}/void", ['reason' => 'Entered twice'])->assertOk();
        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$first}/void", ['reason' => 'Wrong loan'])->assertOk();

        $after = $loan->refresh()->scheduleItems()->get()->map->only(['paid_principal', 'paid_interest', 'paid_penalty', 'penalty_accrued', 'penalty_through'])->toArray();
        $this->assertEquals($before, $after);
        $this->assertSame('106618.53', (string) $loan->outstanding_balance);
        $this->assertDatabaseHas('loan_payments', ['id' => $first, 'status' => 'voided', 'void_reason' => 'Wrong loan']);
    }

    public function test_voiding_the_payment_that_paid_off_a_loan_reopens_it(): void
    {
        $loan = $this->loan();
        $this->actingAs($this->cashier());
        $payoff = $this->getJson("/api/loan/loans/{$loan->id}")->json('data.summary.payoff');
        $id = $this->pay($loan, ['amount' => $payoff])->json('data.payments.0.id');

        $this->actingAs($this->cashier(['loan.payments.view', 'loan.payments.void']));
        $this->postJson("/api/loan/loans/{$loan->id}/payments/{$id}/void", ['reason' => 'Bounced check'])->assertOk()->assertJsonPath('data.status', 'active');
    }

    public function test_the_loan_list_can_be_searched(): void
    {
        $this->loan();
        $this->actingAs($this->cashier());

        $this->getJson('/api/loan/loans?q=Juan')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.member.member_code', 'M-0001');
        $this->getJson('/api/loan/loans?q=nobody')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/loan/loans?status=fully_paid')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_the_member_sees_only_their_own_loan_without_staff_details(): void
    {
        $loan = $this->loan();
        $this->pay($loan, ['amount' => '2000', 'remarks' => 'internal note'])->assertOk();

        $this->app['auth']->forgetGuards();
        $res = $this->postJson('/api/loan-portal/auth/login', ['member_code' => 'M-0001'])->assertOk();
        $this->withUnencryptedCookie('loan_portal_session', $res->getCookie('loan_portal_session', false)->getValue());

        $body = $this->getJson("/api/loan-portal/loans/{$loan->id}")->assertOk()->json('data');

        $this->assertCount(12, $body['schedule']);
        $this->assertSame('2000.00', $body['payments'][0]['amount']);
        $this->assertArrayNotHasKey('remarks', $body['payments'][0]);
        $this->assertArrayNotHasKey('received_by_name', $body['payments'][0]);
        $this->assertArrayNotHasKey('can_void', $body);
        $this->getJson('/api/loan-portal/loans')->assertOk()->assertJsonCount(1, 'data');

        $other = Member::create(['member_code' => 'M-0002', 'name' => 'Maria', 'mobile_number' => '+639171234568', 'status' => 'active', 'is_delinquent' => false]);
        $this->app['auth']->forgetGuards();
        $res = $this->postJson('/api/loan-portal/auth/login', ['member_code' => $other->member_code])->assertOk();
        $this->withUnencryptedCookie('loan_portal_session', $res->getCookie('loan_portal_session', false)->getValue());
        $this->getJson("/api/loan-portal/loans/{$loan->id}")->assertNotFound();
    }

    public function test_the_agreement_freezes_the_cooperatives_penalty_rule_and_the_loan_inherits_it(): void
    {
        $application = LoanApplication::create([
            'reference_no' => 'LN-2026-000009', 'member_id' => $this->member->id, 'product_id' => $this->product->id, 'status' => 'approved',
            'amount' => 50000, 'approved_amount' => 50000, 'term_months' => 6, 'purpose' => 'x', 'submitted_at' => now(),
            'product_snapshot' => ['interest_rate' => '12.000', 'interest_method' => 'diminishing', 'payment_frequency' => 'monthly', 'processing_fee_percent' => '0', 'service_fee_percent' => '0', 'penalty_rate_percent' => '3.000', 'grace_period_days' => 5],
        ]);
        $staff = User::factory()->create();

        // default policy: the cooperative's own rate (2%) applies to every product
        $agreement = app(AgreementService::class)->generate($application, $staff, new DateTimeImmutable('2026-07-15'));
        $this->assertSame('2.000', (string) $agreement->penalty_rate_percent);
        $this->assertSame('per_month_or_fraction', $agreement->penalty_calculation);

        // switch to each product's own rate, regenerate
        LoanSetting::current()->update(['penalty_rate_source' => 'product', 'penalty_calculation' => 'daily_prorated']);
        $agreement = app(AgreementService::class)->generate($application->refresh(), $staff, new DateTimeImmutable('2026-07-15'));
        $this->assertSame('3.000', (string) $agreement->penalty_rate_percent);
        $this->assertSame('daily_prorated', $agreement->penalty_calculation);

        $application->refresh();
        $loan = app(ReleaseService::class)->release($application, $staff, ['method' => 'cash']);

        $this->assertSame('3.000', (string) $loan->penalty_rate_percent);
        $this->assertSame(5, $loan->grace_period_days);
        $this->assertSame('daily_prorated', $loan->penalty_calculation);
    }

    public function test_the_penalty_settings_are_validated(): void
    {
        $this->actingAs($this->cashier(['loan.settings.manage']));
        $current = $this->getJson('/api/loan/settings')->assertOk()->assertJsonPath('data.penalty_rate_source', 'coop_default')->assertJsonPath('data.default_penalty_rate_percent', '2.000')->json('data');

        $this->patchJson('/api/loan/settings', array_merge($current, ['default_penalty_rate_percent' => '150']))->assertStatus(422)->assertJsonValidationErrors('default_penalty_rate_percent');
        $this->patchJson('/api/loan/settings', array_merge($current, ['penalty_calculation' => 'nonsense']))->assertStatus(422)->assertJsonValidationErrors('penalty_calculation');
        $this->patchJson('/api/loan/settings', array_merge($current, ['default_penalty_rate_percent' => '2.5']))->assertOk()->assertJsonPath('data.default_penalty_rate_percent', '2.500');
    }
}
