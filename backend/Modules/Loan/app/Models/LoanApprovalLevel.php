<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Role;

class LoanApprovalLevel extends Model
{
    protected $table = 'loan_approval_levels';

    protected $fillable = ['sequence', 'name', 'role_id', 'min_amount'];

    protected function casts(): array
    {
        return ['min_amount' => 'decimal:2'];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
