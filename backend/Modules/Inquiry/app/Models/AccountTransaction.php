<?php

declare(strict_types=1);

namespace Modules\Inquiry\Models;

use Illuminate\Database\Eloquent\Model;

class AccountTransaction extends Model
{
    protected $table = 'inquiry_transactions';

    protected $fillable = ['member_code', 'account_type', 'mode', 'amount', 'running_balance', 'transacted_on'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'running_balance' => 'decimal:2',
            'transacted_on' => 'date:Y-m-d',
        ];
    }
}
