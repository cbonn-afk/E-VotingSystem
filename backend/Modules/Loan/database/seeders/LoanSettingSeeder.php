<?php

declare(strict_types=1);

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Loan\Models\LoanSetting;

/** The single row of Loan settings. Created only when none exists, so edits are never overwritten. */
final class LoanSettingSeeder extends Seeder
{
    public function run(): void
    {
        if (LoanSetting::query()->exists()) {
            return;
        }

        LoanSetting::query()->create([
            'portal_access_mode' => LoanSetting::MODE_NETWORK_ONLY,
            'allowed_networks' => ['127.0.0.1', '::1', '192.168.1.0/24'],
            'session_idle_minutes' => 20,
            'signature_required' => false,
            'diminishing_method' => 'equal_installment',
            'fee_handling' => 'deduct_from_proceeds',
            'payment_allocation' => 'penalty_interest_principal',
            'penalty_basis' => 'installment',
            'agreement_terms' => null, // null = the built-in default text
        ]);
    }
}
