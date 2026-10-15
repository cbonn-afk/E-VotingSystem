<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Members\Models\Member;

class LoanApplicationGuarantor extends Model
{
    protected $table = 'loan_application_guarantors';

    protected $fillable = ['application_id', 'member_id'];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
