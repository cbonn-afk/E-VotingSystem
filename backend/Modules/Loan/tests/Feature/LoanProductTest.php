<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\IdentityAccess\Models\User;
use Modules\Loan\Models\LoanProduct;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

final class LoanProductTest extends TestCase
{
    use RefreshDatabase;

    private function staff(array $permissions): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $user;
    }

    /** @return array<string,mixed> */
    private function payload(array $overrides = []): array
    {
        return [
            'code' => 'reg-01', 'name' => 'Regular Loan', 'description' => null,
            'min_amount' => '5000', 'max_amount' => '100000', 'interest_rate' => '12',
            'interest_method' => 'diminishing', 'term_min_months' => 6, 'term_max_months' => 36,
            'payment_frequency' => 'monthly', 'processing_fee_percent' => '1', 'service_fee_percent' => '0.5',
            'penalty_rate_percent' => '2', 'grace_period_days' => 3, 'requires_guarantor' => true,
            'guarantor_count' => 2, 'requires_collateral' => false, 'min_membership_months' => 6,
            'status' => 'active', 'documents' => [['name' => 'Valid ID', 'is_required' => true]],
            ...$overrides,
        ];
    }

    public function test_staff_with_permission_can_create_a_product(): void
    {
        $this->actingAs($this->staff(['loan.products.manage']));

        $this->postJson('/api/loan/products', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.code', 'REG-01')
            ->assertJsonPath('data.documents.0.name', 'Valid ID');

        $this->assertDatabaseCount('loan_products', 1);
    }

    public function test_without_permission_is_forbidden(): void
    {
        $this->actingAs($this->staff([]));

        $this->postJson('/api/loan/products', $this->payload())->assertForbidden();
        $this->getJson('/api/loan/products')->assertForbidden();
    }

    public function test_max_amount_must_not_be_below_min_amount(): void
    {
        $this->actingAs($this->staff(['loan.products.manage']));

        $this->postJson('/api/loan/products', $this->payload(['min_amount' => '9000', 'max_amount' => '1000']))
            ->assertStatus(422)->assertJsonValidationErrors('max_amount');
    }

    public function test_guarantor_count_is_required_when_a_guarantor_is_required(): void
    {
        $this->actingAs($this->staff(['loan.products.manage']));

        $this->postJson('/api/loan/products', $this->payload(['guarantor_count' => 0]))
            ->assertStatus(422)->assertJsonValidationErrors('guarantor_count');
    }

    public function test_update_replaces_documents_and_code_must_stay_unique(): void
    {
        $this->actingAs($this->staff(['loan.products.manage']));

        $first = $this->postJson('/api/loan/products', $this->payload())->json('data');
        $this->postJson('/api/loan/products', $this->payload(['code' => 'EMG-01', 'name' => 'Emergency']))->assertCreated();

        $this->patchJson("/api/loan/products/{$first['id']}", $this->payload([
            'documents' => [['name' => 'Payslip', 'is_required' => false]],
        ]))->assertOk()->assertJsonCount(1, 'data.documents')->assertJsonPath('data.documents.0.name', 'Payslip');

        $this->patchJson("/api/loan/products/{$first['id']}", $this->payload(['code' => 'EMG-01']))
            ->assertStatus(422)->assertJsonValidationErrors('code');

        $this->assertSame(2, LoanProduct::query()->count());
    }
}
