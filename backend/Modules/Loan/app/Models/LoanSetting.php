<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanSetting extends Model
{
    public const MODE_NETWORK_ONLY = 'network_only';
    public const MODE_ONLINE = 'online';

    protected $table = 'loan_settings';

    public const DIMINISHING_METHODS = ['equal_installment', 'fixed_principal'];
    public const FEE_HANDLING = ['deduct_from_proceeds', 'collect_separately'];
    public const PAYMENT_ALLOCATIONS = ['penalty_interest_principal', 'interest_penalty_principal'];
    public const PENALTY_BASES = ['installment', 'principal_balance'];
    public const PENALTY_RATE_SOURCES = ['coop_default', 'product'];
    public const PENALTY_CALCULATIONS = ['per_month_or_fraction', 'daily_prorated'];

    /** Starting text only. The cooperative's own counsel should review and replace it under Loan > Settings. */
    public const DEFAULT_TERMS = <<<'TEXT'
1. The Borrower acknowledges receiving the loan on the terms stated in this agreement and promises to repay it in full, with interest, on the due dates in the payment schedule.
2. Interest, fees and penalties are those stated in this agreement. Fees are either deducted from the loan proceeds or collected separately, as stated.
3. If an installment is not paid on its due date and the grace period has passed, a penalty is charged on the overdue amount at the rate stated.
4. Payments are applied in the order set by the Cooperative's policy at the time of payment.
5. The Borrower may pay ahead of schedule. The Cooperative will tell the Borrower the remaining balance on request.
6. If the Borrower fails to pay, the Cooperative may declare the remaining balance due and may collect it from the guarantors, the Borrower's savings and share capital, and any collateral, as allowed by its by-laws and the law.
7. The Borrower confirms that all information and documents given in the application are true and correct.
8. Any change to these terms must be in writing and agreed by both parties.
TEXT;

    protected $fillable = [
        'portal_access_mode', 'allowed_networks', 'session_idle_minutes', 'signature_required',
        'diminishing_method', 'fee_handling', 'payment_allocation', 'penalty_basis', 'agreement_terms',
        'penalty_rate_source', 'default_penalty_rate_percent', 'penalty_calculation',
    ];

    protected function casts(): array
    {
        return [
            'allowed_networks' => 'array',
            'session_idle_minutes' => 'integer',
            'signature_required' => 'boolean',
            'default_penalty_rate_percent' => 'decimal:3',
        ];
    }

    public function termsText(): string
    {
        return filled($this->agreement_terms) ? (string) $this->agreement_terms : self::DEFAULT_TERMS;
    }

    /** The single settings row (created on first use, closed to the internet by default). */
    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'portal_access_mode' => self::MODE_NETWORK_ONLY,
            'allowed_networks' => [],
            'session_idle_minutes' => 20,
            'signature_required' => false,
        ]);
    }
}
