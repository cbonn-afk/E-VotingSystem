<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanProduct;
use Modules\Loan\Models\LoanSetting;
use Modules\Members\Models\Member;
use Tests\TestCase;

final class PortalApplicationTest extends TestCase
{
    use RefreshDatabase;

    private Member $member;

    private LoanProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        LoanSetting::current()->update(['portal_access_mode' => 'online']);

        $this->member = Member::create([
            'member_code' => 'M-0001', 'name' => 'Juan Dela Cruz', 'mobile_number' => '+639171234567',
            'membership_date' => now()->subYears(3)->toDateString(), 'status' => 'active', 'is_delinquent' => false,
        ]);

        Member::create(['member_code' => 'M-0002', 'name' => 'Maria Santos', 'mobile_number' => '+639171234568', 'status' => 'active', 'is_delinquent' => false]);

        $this->product = LoanProduct::create([
            'code' => 'REG', 'name' => 'Regular Loan', 'min_amount' => 5000, 'max_amount' => 100000, 'interest_rate' => 12,
            'interest_method' => 'diminishing', 'term_min_months' => 6, 'term_max_months' => 36, 'payment_frequency' => 'monthly',
            'requires_guarantor' => true, 'guarantor_count' => 1, 'min_membership_months' => 6, 'status' => 'active',
        ]);
        $this->product->documents()->create(['name' => 'Valid ID', 'is_required' => true]);
    }

    private function signIn(string $code = 'M-0001'): void
    {
        $res = $this->postJson('/api/loan-portal/auth/login', ['member_code' => $code])->assertOk();
        $this->withUnencryptedCookie('loan_portal_session', $res->getCookie('loan_portal_session', false)->getValue());
    }

    /** @return array<string,mixed> */
    private function details(array $overrides = []): array
    {
        return ['product_id' => $this->product->id, 'amount' => '20000', 'term_months' => 12, 'purpose' => 'School fees', ...$overrides];
    }

    private function draft(): array
    {
        return $this->postJson('/api/loan-portal/applications', $this->details(), ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertCreated()->json('data');
    }

    private function headers(): array
    {
        return ['X-Requested-With' => 'XMLHttpRequest'];
    }

    public function test_a_member_creates_a_draft_with_a_reference_number(): void
    {
        $this->signIn();

        $draft = $this->draft();

        $this->assertMatchesRegularExpression('/^LN-\d{4}-\d{6}$/', $draft['reference_no']);
        $this->assertSame('draft', $draft['status']);
        $this->assertTrue($draft['editable']);
    }

    public function test_submitting_an_incomplete_draft_lists_what_is_missing(): void
    {
        $this->signIn();
        $draft = $this->draft();

        $res = $this->postJson("/api/loan-portal/applications/{$draft['id']}/submit", ['confirmed' => true], $this->headers())
            ->assertStatus(422);

        $messages = implode(' ', $res->json('errors.submit'));
        $this->assertStringContainsString('guarantor', $messages);
        $this->assertStringContainsString('Valid ID', $messages);
    }

    public function test_a_complete_application_is_submitted_and_then_locked(): void
    {
        $this->signIn();
        $draft = $this->draft();
        $id = $draft['id'];

        $this->postJson("/api/loan-portal/applications/{$id}/documents", [
            'requirement' => 'Valid ID', 'file' => UploadedFile::fake()->create('id.pdf', 100, 'application/pdf'),
        ], $this->headers())->assertOk()->assertJsonPath('data.documents.0.requirement', 'Valid ID');

        $this->putJson("/api/loan-portal/applications/{$id}/guarantors", ['member_codes' => ['M-0002']], $this->headers())
            ->assertOk()->assertJsonPath('data.guarantors.0.member_code', 'M-0002');

        $this->postJson("/api/loan-portal/applications/{$id}/submit", ['confirmed' => true], $this->headers())
            ->assertOk()->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.editable', false);

        $this->patchJson("/api/loan-portal/applications/{$id}", ['amount' => '30000', 'term_months' => 12, 'purpose' => 'x'], $this->headers())
            ->assertStatus(409);
    }

    public function test_the_amount_must_be_within_the_product_limits_at_submit(): void
    {
        $this->signIn();
        $res = $this->postJson('/api/loan-portal/applications', $this->details(['amount' => '999999']), $this->headers())->assertCreated();

        $this->postJson('/api/loan-portal/applications/'.$res->json('data.id').'/submit', ['confirmed' => true], $this->headers())
            ->assertStatus(422);
    }

    public function test_a_member_cannot_see_or_touch_another_members_application(): void
    {
        $this->signIn();
        $draft = $this->draft();

        $this->signIn('M-0002'); // replaces the session cookie of the first member

        $this->getJson("/api/loan-portal/applications/{$draft['id']}")->assertNotFound();
        $this->postJson("/api/loan-portal/applications/{$draft['id']}/submit", ['confirmed' => true], $this->headers())->assertNotFound();
        $this->getJson('/api/loan-portal/applications')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_a_member_cannot_guarantee_their_own_loan_and_unknown_codes_fail_generically(): void
    {
        $this->signIn();
        $draft = $this->draft();

        $this->putJson("/api/loan-portal/applications/{$draft['id']}/guarantors", ['member_codes' => ['M-0001']], $this->headers())
            ->assertStatus(422);
        $this->putJson("/api/loan-portal/applications/{$draft['id']}/guarantors", ['member_codes' => ['NOPE']], $this->headers())
            ->assertStatus(422);
    }

    public function test_uploads_must_match_a_product_requirement_and_an_allowed_type(): void
    {
        $this->signIn();
        $draft = $this->draft();

        $this->postJson("/api/loan-portal/applications/{$draft['id']}/documents", [
            'requirement' => 'Something else', 'file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'),
        ], $this->headers())->assertStatus(422);

        $this->postJson("/api/loan-portal/applications/{$draft['id']}/documents", [
            'requirement' => 'Valid ID', 'file' => UploadedFile::fake()->create('a.exe', 10, 'application/octet-stream'),
        ], $this->headers())->assertStatus(422);

        $this->assertSame(1, LoanApplication::query()->count());
    }

    public function test_a_delinquent_member_cannot_submit(): void
    {
        $this->member->update(['is_delinquent' => true]);
        $this->signIn();
        $draft = $this->draft();

        $res = $this->postJson("/api/loan-portal/applications/{$draft['id']}/submit", ['confirmed' => true], $this->headers())->assertStatus(422);

        $this->assertStringContainsString('overdue', implode(' ', $res->json('errors.submit')));
    }
}
