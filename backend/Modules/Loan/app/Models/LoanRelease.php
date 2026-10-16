<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanRelease extends Model
{
    public const METHODS = ['cash', 'check', 'bank_transfer', 'savings_credit'];

    protected $table = 'loan_releases';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['amount_released' => 'decimal:2', 'fees_total' => 'decimal:2', 'released_at' => 'datetime'];
    }
}
