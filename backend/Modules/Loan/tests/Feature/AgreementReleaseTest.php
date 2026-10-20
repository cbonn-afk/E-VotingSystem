<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\IdentityAccess\Models\User;
use Modules\Loan\Models\LoanAgreement;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanProduct;
use Modules\Loan\Models\LoanSetting;
use Modules\Members\Models\Member;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class AgreementReleaseTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    private LoanApplication $application;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        LoanSetting::current()->update(['portal_access_mode' => 'online']);

        $this->member = Member::create(['member_code' => 'M-0001', 'name' => 'Juan', 'mobile_number' => '+639171234567', 'status' => 'active', 'is_delinquent' => false]);
        $product = LoanProduct::create([
            'code' => 'REG', 'name' => 'Regular', 'min_amount' => 1000, 'max_amount' => 500000, 'interest_rate' => 12,
            'interest_method' => 'diminishing', 'term_min_months' => 1, 'term_max_months' => 36, 'payment_frequency' => 'monthly', 'status' => 'active',
        ]);

        $this->application = LoanApplication::create([
            'reference_no' => 'LN-2026-000001', 'member_id' => $this->member->id, 'product_id' => $product->id,
            'status' => 'approved', 'amount' => 100000, 'approved_amount' => 100000, 'term_months' => 12, 'purpose' => 'Test',
            'submitted_at' => now(),
            // the product's terms as frozen at submission
            'product_snapshot' => [
                'code' => 'REG', 'name' => 'Regular', 'interest_rate' => '12.000', 'interest_method' => 'diminishing',
                'payment_frequency' => 'monthly', 'processing_fee_percent' => '1.000', 'service_fee_percent' => '0.500',
                'penalty_rate_percent' => '2.000', 'grace_period_days' => 3,
            ],
        ]);
    }

    /** @param list<string> $permissions */
    private function staff(array $permissions): User
    {
        $user = User::factory()->create();

        foreach (array_merge($permissions, ['loan.applications.view']) as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $user;
    }

    private function firstDue(): string
    {
        return now()->addMonth()->format('Y-m-d');
    }

    private function generate(?string $date = null, ?User $by = null)
    {
        $this->actingAs($by ?? $this->staff(['loan.applications.manage']));

        return $this->postJson("/api/loan/applications/{$this->application->id}/agreement", ['first_due_date' => $date ?? $this->firstDue()]);
    }

    private function memberSignsIn(): void
    {
        $this->app['auth']->forgetGuards();
        $res = $this->postJson('/api/loan-portal/auth/login', ['member_code' => 'M-0001'])->assertOk();
        $this->withUnencryptedCookie('loan_portal_session', $res->getCookie('loan_portal_session', false)->getValue());
    }

    private function release(array $body = [], ?User $by = null)
    {
        $this->actingAs($by ?? $this->staff(['loan.release']));

        return $this->postJson("/api/loan/applications/{$this->application->id}/release", $body + ['method' => 'cash']);
    }

    public function test_generating_an_agreement_uses_the_approved_amount_and_the_frozen_terms(): void
    {
        $res = $this->generate()->assertOk()->assertJsonPath('data.status', 'for_release');

        $agreement = $res->json('data.agreement');
        $this->assertMatchesRegularExpression('/^AG-\d{4}-\d{6}$/', $agreement['agreement_no']);
        $this->assertSame('100000.00', $agreement['principal']);
        $this->assertSame('8884.88', $agreement['installment_amount']);
        $this->assertSame('1000.00', $agreement['processing_fee']);
        $this->assertSame('500.00', $agreement['service_fee']);
        $this->assertSame('98500.00', $agreement['net_proceeds']);   // fees deducted by default
        $this->assertCount(12, $agreement['schedule']);
        $this->assertStringContainsString('promises to repay', $agreement['terms_text']);
    }

    public function test_the_agreement_follows_the_approved_amount_not_the_requested_one(): void
    {
        $this->application->update(['approved_amount' => 60000]);

        $this->generate()->assertOk()->assertJsonPath('data.agreement.principal', '60000.00');
    }

    public function test_settings_change_the_money_rules(): void
    {
        LoanSetting::current()->update(['diminishing_method' => 'fixed_principal', 'fee_handling' => 'collect_separately']);

        $agreement = $this->generate()->assertOk()->json('data.agreement');

        $this->assertSame('9333.33', $agreement['installment_amount']);
        $this->assertSame('100000.00', $agreement['net_proceeds']);   // fees collected separately, so the full amount is released
    }

    public function test_the_first_due_date_must_be_in_the_future_and_valid_for_the_frequency(): void
    {
        $this->generate(now()->format('Y-m-d'))->assertStatus(422)->assertJsonValidationErrors('first_due_date');

        LoanProduct::query()->update(['payment_frequency' => 'semi_monthly']);
        $this->application->update(['product_snapshot' => array_merge($this->application->product_snapshot, ['payment_frequency' => 'semi_monthly'])]);
        $this->generate(now()->addMonth()->setDay(10)->format('Y-m-d'))->assertStatus(422)->assertJsonValidationErrors('first_due_date');
    }

    public function test_preview_shows_the_figures_without_saving(): void
    {
        $this->actingAs($this->staff(['loan.applications.manage']));

        $this->postJson("/api/loan/applications/{$this->application->id}/agreement/preview", ['first_due_date' => $this->firstDue()])
            ->assertOk()->assertJsonPath('data.installments_count', 12);

        $this->assertSame(0, LoanAgreement::query()->count());
        $this->assertSame('approved', $this->application->refresh()->status);
    }

    public function test_only_approved_loans_get_an_agreement_and_only_managers_can_make_one(): void
    {
        $this->application->update(['status' => 'for_approval']);
        $this->generate()->assertStatus(422);

        $this->application->update(['status' => 'approved']);
        $this->generate(null, $this->staff([]))->assertForbidden();
    }

    public function test_release_needs_the_release_permission_and_an_agreement(): void
    {
        $this->release()->assertStatus(422);                              // no agreement yet

        $this->generate()->assertOk();
        $this->release([], $this->staff([]))->assertForbidden();         // no loan.release
        $this->release()->assertOk();
    }

    public function test_the_member_is_not_asked_to_accept_the_agreement(): void
    {
        $this->generate()->assertOk()->assertJsonPath('data.status', 'for_release');
        $this->memberSignsIn();

        // the member sign-off route no longer exists
        $this->postJson("/api/loan-portal/applications/{$this->application->id}/agreement/sign", ['agreed' => true], ['X-Requested-With' => 'XMLHttpRequest'])->assertStatus(404);
    }

    public function test_an_agreement_that_was_waiting_for_a_signature_can_still_be_released(): void
    {
        $this->generate()->assertOk();
        $this->application->refresh()->update(['status' => 'for_agreement']);   // how loans waiting for a signature looked before

        $this->release()->assertOk()->assertJsonPath('data.status', 'released');
    }

    public function test_release_creates_the_loan_its_schedule_and_a_receipt(): void
    {
        $this->generate()->assertOk();

        $res = $this->release(['remarks' => 'Over the counter'])->assertOk()->assertJsonPath('data.status', 'released');

        $loan = $res->json('data.loan');
        $this->assertMatchesRegularExpression('/^LO-\d{4}-\d{6}$/', $loan['loan_no']);
        $this->assertSame('active', $loan['status']);
        $this->assertSame('106618.53', $loan['outstanding_balance']);
        $this->assertCount(12, $loan['schedule']);
        $this->assertSame('98500.00', $loan['release']['amount_released']);
        $this->assertMatchesRegularExpression('/^RC-\d{4}-\d{6}$/', $loan['release']['receipt_no']);
        $this->assertDatabaseCount('loan_schedule_items', 12);

        $this->release()->assertStatus(422);                              // cannot be released twice
    }

    public function test_a_check_or_transfer_needs_a_reference(): void
    {
        $this->generate()->assertOk();

        $this->release(['method' => 'check'])->assertStatus(422)->assertJsonValidationErrors('reference_no');
        $this->release(['method' => 'check', 'reference_no' => 'CHK-0042'])->assertOk()->assertJsonPath('data.loan.release.reference_no', 'CHK-0042');
    }

    public function test_when_fees_are_collected_separately_the_cashier_must_confirm_it(): void
    {
        LoanSetting::current()->update(['fee_handling' => 'collect_separately']);
        $this->generate()->assertOk();

        $this->release()->assertStatus(422)->assertJsonValidationErrors('fees_collected');
        $this->release(['fees_collected' => true])->assertOk()->assertJsonPath('data.loan.release.amount_released', '100000.00');
    }

    public function test_release_is_blocked_once_the_first_due_date_has_passed(): void
    {
        $this->generate()->assertOk();
        LoanAgreement::query()->update(['first_due_date' => now()->subDay()->format('Y-m-d')]);

        $this->release()->assertStatus(422);
    }

    public function test_regenerating_replaces_the_agreement_and_keeps_the_loan_ready_for_release(): void
    {
        $this->generate()->assertOk();

        $this->generate(now()->addMonths(2)->format('Y-m-d'))->assertOk()->assertJsonPath('data.status', 'for_release');
        $this->assertSame(1, LoanAgreement::query()->count());
    }

    public function test_the_member_does_not_receive_the_agreement_or_staff_only_fields(): void
    {
        $this->generate()->assertOk();
        $this->memberSignsIn();

        $body = $this->getJson("/api/loan-portal/applications/{$this->application->id}")->assertOk()->json('data');

        $this->assertSame('for_release', $body['status']);
        $this->assertArrayNotHasKey('agreement', $body);
        $this->assertArrayNotHasKey('can_release', $body);
        $this->assertArrayNotHasKey('can_generate_agreement', $body);
    }

    public function test_the_new_settings_are_validated_and_the_default_terms_are_returned(): void
    {
        $this->actingAs($this->staff(['loan.settings.manage']));

        $current = $this->getJson('/api/loan/settings')->assertOk()->assertJsonPath('data.fee_handling', 'deduct_from_proceeds')->json('data');
        $this->assertStringContainsString('promises to repay', $current['agreement_terms']);

        $this->patchJson('/api/loan/settings', array_merge($current, ['diminishing_method' => 'nonsense']))->assertStatus(422)->assertJsonValidationErrors('diminishing_method');
        $this->patchJson('/api/loan/settings', array_merge($current, ['fee_handling' => 'collect_separately']))->assertOk()->assertJsonPath('data.fee_handling', 'collect_separately');
        $this->assertNull(LoanSetting::current()->agreement_terms);   // unchanged default text is not stored as a copy
    }
}
