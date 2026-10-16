<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanApplicationApproval extends Model
{
    protected $table = 'loan_application_approvals';

    protected $fillable = [
        'application_id', 'sequence', 'level_name', 'approver_id', 'approver_name',
        'decision', 'approved_amount', 'remarks', 'decided_at',
    ];

    protected function casts(): array
    {
        return ['approved_amount' => 'decimal:2', 'decided_at' => 'datetime'];
    }
}
