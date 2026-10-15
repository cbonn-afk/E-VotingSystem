<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\IdentityAccess\Models\User;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanProduct;
use Modules\Loan\Support\ApplicationStatus;
use Modules\Members\Models\Member;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class LoanApplicationStaffTest extends TestCase
{
    use RefreshDatabase;

    private LoanApplication $application;

    protected function setUp(): void
    {
        parent::setUp();

        $member = Member::create(['member_code' => 'M-0001', 'name' => 'Juan', 'mobile_number' => '+639171234567', 'status' => 'active', 'is_delinquent' => false]);
        $product = LoanProduct::create([
            'code' => 'REG', 'name' => 'Regular', 'min_amount' => 1000, 'max_amount' => 50000, 'interest_rate' => 12,
            'interest_method' => 'flat', 'term_min_months' => 1, 'term_max_months' => 12, 'payment_frequency' => 'monthly', 'status' => 'active',
        ]);
        $product->documents()->create(['name' => 'Valid ID', 'is_required' => true]);

        $this->application = LoanApplication::create([
            'reference_no' => 'LN-2026-000001', 'member_id' => $member->id, 'product_id' => $product->id,
            'status' => ApplicationStatus::SUBMITTED, 'amount' => 10000, 'term_months' => 6, 'purpose' => 'Test', 'submitted_at' => now(),
        ]);
        $this->application->documents()->create([
            'requirement' => 'Valid ID', 'path' => 'loan/x.pdf', 'original_name' => 'id.pdf', 'mime' => 'application/pdf', 'size' => 10,
        ]);
    }

    private function staff(array $permissions): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $this->actingAs($user)->app['auth']->user();
    }

    public function test_without_permission_staff_cannot_open_the_queue(): void
    {
        $this->staff([]);

        $this->getJson('/api/loan/applications')->assertForbidden();
    }

    public function test_drafts_are_not_visible_to_staff(): void
    {
        $this->staff(['loan.applications.view']);
        LoanApplication::create([
            'member_id' => $this->application->member_id, 'product_id' => $this->application->product_id,
            'status' => 'draft', 'amount' => 1000, 'term_months' => 1, 'purpose' => 'secret',
        ]);

        $this->getJson('/api/loan/applications')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_review_flow_return_and_accept(): void
    {
        $this->staff(['loan.applications.view', 'loan.applications.manage']);
        $id = $this->application->id;
        $doc = $this->application->documents()->first();

        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'accept_documents'])->assertStatus(422); // not in review yet
        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'start_review'])->assertOk()->assertJsonPath('data.status', 'document_review');

        // cannot accept while the required document is still pending
        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'accept_documents'])->assertStatus(422);

        $this->patchJson("/api/loan/applications/{$id}/documents/{$doc->id}", ['status' => 'rejected'])->assertStatus(422); // reason needed
        $this->patchJson("/api/loan/applications/{$id}/documents/{$doc->id}", ['status' => 'rejected', 'remarks' => 'Blurry'])->assertOk();

        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'return'])->assertStatus(422); // reason needed
        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'return', 'remarks' => 'Upload a clearer ID'])
            ->assertOk()->assertJsonPath('data.status', 'returned')->assertJsonPath('data.editable', true);
    }

    public function test_accepting_all_documents_moves_the_application_to_evaluation(): void
    {
        $this->staff(['loan.applications.view', 'loan.applications.manage']);
        $id = $this->application->id;
        $doc = $this->application->documents()->first();

        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'start_review'])->assertOk();
        $this->patchJson("/api/loan/applications/{$id}/documents/{$doc->id}", ['status' => 'accepted'])->assertOk();
        $this->postJson("/api/loan/applications/{$id}/transition", ['action' => 'accept_documents'])
            ->assertOk()->assertJsonPath('data.status', 'for_evaluation');

        $this->assertDatabaseHas('loan_application_events', ['application_id' => $id, 'to_status' => 'for_evaluation', 'actor_type' => 'staff']);
    }

    public function test_view_only_staff_cannot_change_anything(): void
    {
        $this->staff(['loan.applications.view']);

        $this->postJson("/api/loan/applications/{$this->application->id}/transition", ['action' => 'start_review'])->assertForbidden();
    }
}
