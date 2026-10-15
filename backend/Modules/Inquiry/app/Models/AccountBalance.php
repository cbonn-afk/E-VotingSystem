<?php

declare(strict_types=1);

namespace Modules\Inquiry\Models;

use Illuminate\Database\Eloquent\Model;

class AccountBalance extends Model
{
    protected $table = 'inquiry_balances';

    protected $fillable = [
        'member_code', 'rf_id', 'member_name',
        'share_capital', 'savings_bonus', 'regular_savings', 'time_deposit',
        'dividend_to_share_capital', 'dividend_to_savings', 'as_of_date',
    ];

    protected function casts(): array
    {
        return [
            'share_capital' => 'decimal:2',
            'savings_bonus' => 'decimal:2',
            'regular_savings' => 'decimal:2',
            'time_deposit' => 'decimal:2',
            'dividend_to_share_capital' => 'decimal:2',
            'dividend_to_savings' => 'decimal:2',
            'as_of_date' => 'date:Y-m-d',
        ];
    }
}
