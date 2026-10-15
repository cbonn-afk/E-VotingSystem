<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanApplicationEvent extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'loan_application_events';

    protected $fillable = ['application_id', 'from_status', 'to_status', 'actor_type', 'actor_name', 'remarks'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
