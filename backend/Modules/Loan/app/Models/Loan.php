<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Loan extends Model
{
    protected $table = 'loans';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'principal' => 'decimal:2', 'total_interest' => 'decimal:2', 'outstanding_balance' => 'decimal:2',
            'first_due_date' => 'date:Y-m-d', 'maturity_date' => 'date:Y-m-d', 'released_at' => 'datetime',
        ];
    }

    public function scheduleItems(): HasMany
    {
        return $this->hasMany(LoanScheduleItem::class)->orderBy('number');
    }

    public function release(): HasOne
    {
        return $this->hasOne(LoanRelease::class);
    }
}
