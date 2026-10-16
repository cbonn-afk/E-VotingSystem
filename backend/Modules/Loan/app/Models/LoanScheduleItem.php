<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanScheduleItem extends Model
{
    protected $table = 'loan_schedule_items';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d', 'principal' => 'decimal:2', 'interest' => 'decimal:2',
            'total' => 'decimal:2', 'balance_after' => 'decimal:2',
        ];
    }
}
