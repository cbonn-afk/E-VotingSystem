<?php

declare(strict_types=1);

namespace Modules\Inquiry\Models;

use Illuminate\Database\Eloquent\Model;

class LoanBalance extends Model
{
    protected $table = 'inquiry_loans';

    protected $fillable = [
        'member_code', 'loan_code', 'loan_number', 'loan_type',
        'principal', 'interest', 'principal_paid', 'interest_paid',
        'principal_balance', 'interest_balance',
        'released_on', 'start_on', 'maturity_on',
    ];

    protected function casts(): array
    {
        return [
            'principal' => 'decimal:2',
            'interest' => 'decimal:2',
            'principal_paid' => 'decimal:2',
            'interest_paid' => 'decimal:2',
            'principal_balance' => 'decimal:2',
            'interest_balance' => 'decimal:2',
            'released_on' => 'date:Y-m-d',
            'start_on' => 'date:Y-m-d',
            'maturity_on' => 'date:Y-m-d',
        ];
    }
}
