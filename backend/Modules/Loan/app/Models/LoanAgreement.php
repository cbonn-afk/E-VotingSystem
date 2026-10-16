<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanAgreement extends Model
{
    protected $table = 'loan_agreements';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'principal' => 'decimal:2', 'interest_rate' => 'decimal:3', 'installment_amount' => 'decimal:2',
            'total_interest' => 'decimal:2', 'processing_fee' => 'decimal:2', 'service_fee' => 'decimal:2',
            'net_proceeds' => 'decimal:2', 'penalty_rate_percent' => 'decimal:3',
            'first_due_date' => 'date:Y-m-d', 'maturity_date' => 'date:Y-m-d',
            'schedule' => 'array', 'generated_at' => 'datetime', 'signed_at' => 'datetime',
        ];
    }

    public function isSigned(): bool
    {
        return $this->signed_at !== null;
    }
}
