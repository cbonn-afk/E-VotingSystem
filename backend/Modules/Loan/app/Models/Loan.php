<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Members\Models\Member;

class Loan extends Model
{
    protected $table = 'loans';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'principal' => 'decimal:2', 'total_interest' => 'decimal:2', 'outstanding_balance' => 'decimal:2',
            'penalty_rate_percent' => 'decimal:3', 'first_due_date' => 'date:Y-m-d', 'maturity_date' => 'date:Y-m-d',
            'released_at' => 'datetime', 'fully_paid_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(LoanProduct::class, 'product_id');
    }

    public function scheduleItems(): HasMany
    {
        return $this->hasMany(LoanScheduleItem::class)->orderBy('number');
    }

    public function release(): HasOne
    {
        return $this->hasOne(LoanRelease::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(LoanPayment::class)->orderByDesc('id');
    }
}
