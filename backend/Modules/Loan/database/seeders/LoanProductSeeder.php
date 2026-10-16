<?php

declare(strict_types=1);

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Loan\Models\LoanProduct;

/** Typical cooperative loan products and their document requirements. Matched by code, so re-running updates them. */
final class LoanProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'code' => 'SAL', 'name' => 'Salary Loan', 'description' => 'Short-term loan for regular employees, payable monthly.',
                'min_amount' => 5000, 'max_amount' => 50000, 'interest_rate' => 12, 'interest_method' => 'diminishing',
                'term_min_months' => 1, 'term_max_months' => 12, 'payment_frequency' => 'monthly',
                'processing_fee_percent' => 1, 'service_fee_percent' => 0.5, 'penalty_rate_percent' => 2, 'grace_period_days' => 3,
                'requires_guarantor' => false, 'guarantor_count' => 0, 'requires_collateral' => false, 'min_membership_months' => 6,
                'status' => 'active',
                'documents' => [['Valid ID', true], ['Latest payslip', true], ['Certificate of employment', false]],
            ],
            [
                'code' => 'EML', 'name' => 'Emergency Loan', 'description' => 'Small, fast loan for urgent needs, payable twice a month.',
                'min_amount' => 2000, 'max_amount' => 20000, 'interest_rate' => 10, 'interest_method' => 'flat',
                'term_min_months' => 1, 'term_max_months' => 6, 'payment_frequency' => 'semi_monthly',
                'processing_fee_percent' => 0.5, 'service_fee_percent' => 0, 'penalty_rate_percent' => 2, 'grace_period_days' => 0,
                'requires_guarantor' => false, 'guarantor_count' => 0, 'requires_collateral' => false, 'min_membership_months' => 3,
                'status' => 'active',
                'documents' => [['Valid ID', true], ['Supporting document for the emergency', false]],
            ],
            [
                'code' => 'BUS', 'name' => 'Business Loan', 'description' => 'Capital for a member-owned small business.',
                'min_amount' => 20000, 'max_amount' => 300000, 'interest_rate' => 14, 'interest_method' => 'diminishing',
                'term_min_months' => 6, 'term_max_months' => 36, 'payment_frequency' => 'monthly',
                'processing_fee_percent' => 1.5, 'service_fee_percent' => 1, 'penalty_rate_percent' => 3, 'grace_period_days' => 5,
                'requires_guarantor' => true, 'guarantor_count' => 2, 'requires_collateral' => false, 'min_membership_months' => 12,
                'status' => 'active',
                'documents' => [['Valid ID', true], ['Business permit', true], ['Proof of income', true], ['Business plan', false]],
            ],
            [
                'code' => 'AGR', 'name' => 'Agricultural Production Loan', 'description' => 'Seeds, fertilizer and farm inputs for the planting season.',
                'min_amount' => 10000, 'max_amount' => 150000, 'interest_rate' => 12, 'interest_method' => 'diminishing',
                'term_min_months' => 3, 'term_max_months' => 12, 'payment_frequency' => 'monthly',
                'processing_fee_percent' => 1, 'service_fee_percent' => 0.5, 'penalty_rate_percent' => 2, 'grace_period_days' => 7,
                'requires_guarantor' => true, 'guarantor_count' => 1, 'requires_collateral' => false, 'min_membership_months' => 6,
                'status' => 'active',
                'documents' => [['Valid ID', true], ['Barangay certification of farm ownership or tenancy', true], ['Farm plan and budget', false]],
            ],
            [
                'code' => 'EDU', 'name' => 'Educational Loan', 'description' => 'Tuition and school expenses for the member or dependents.',
                'min_amount' => 5000, 'max_amount' => 60000, 'interest_rate' => 9, 'interest_method' => 'diminishing',
                'term_min_months' => 4, 'term_max_months' => 10, 'payment_frequency' => 'monthly',
                'processing_fee_percent' => 0.5, 'service_fee_percent' => 0, 'penalty_rate_percent' => 1.5, 'grace_period_days' => 5,
                'requires_guarantor' => false, 'guarantor_count' => 0, 'requires_collateral' => false, 'min_membership_months' => 6,
                'status' => 'active',
                'documents' => [['Valid ID', true], ['Enrollment assessment or billing statement', true]],
            ],
            [
                'code' => 'HOU', 'name' => 'Housing Improvement Loan', 'description' => 'Repair, renovation or extension of the member\'s home.',
                'min_amount' => 50000, 'max_amount' => 500000, 'interest_rate' => 13, 'interest_method' => 'diminishing',
                'term_min_months' => 12, 'term_max_months' => 60, 'payment_frequency' => 'monthly',
                'processing_fee_percent' => 1.5, 'service_fee_percent' => 1, 'penalty_rate_percent' => 3, 'grace_period_days' => 5,
                'requires_guarantor' => true, 'guarantor_count' => 2, 'requires_collateral' => true, 'min_membership_months' => 24,
                'status' => 'active',
                'documents' => [['Valid ID', true], ['Land title or tax declaration', true], ['Bill of materials', true], ['Proof of income', true]],
            ],
            [
                'code' => 'APL', 'name' => 'Appliance Loan', 'description' => 'Retired product, kept to show an inactive product in the list.',
                'min_amount' => 3000, 'max_amount' => 30000, 'interest_rate' => 15, 'interest_method' => 'flat',
                'term_min_months' => 3, 'term_max_months' => 12, 'payment_frequency' => 'monthly',
                'processing_fee_percent' => 1, 'service_fee_percent' => 0, 'penalty_rate_percent' => 2, 'grace_period_days' => 3,
                'requires_guarantor' => false, 'guarantor_count' => 0, 'requires_collateral' => false, 'min_membership_months' => 6,
                'status' => 'inactive',
                'documents' => [['Valid ID', true]],
            ],
        ];

        foreach ($products as $data) {
            $documents = $data['documents'];
            unset($data['documents']);

            $product = LoanProduct::query()->updateOrCreate(['code' => $data['code']], $data);

            foreach ($documents as [$name, $required]) {
                $product->documents()->updateOrCreate(['name' => $name], ['is_required' => $required]);
            }
        }
    }
}
