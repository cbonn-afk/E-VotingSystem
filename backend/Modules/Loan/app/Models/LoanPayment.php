<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoanPayment extends Model
{
    public const METHODS = ['cash', 'check', 'bank_transfer', 'savings_deduction'];

    protected $table = 'loan_payments';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'paid_on' => 'date:Y-m-d', 'amount' => 'decimal:2', 'balance_after' => 'decimal:2', 'penalty_after' => 'decimal:2',
            'accrual_before' => 'array', 'voided_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(LoanPaymentAllocation::class, 'payment_id');
    }
}
