<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanApplicationDocument extends Model
{
    protected $table = 'loan_application_documents';

    protected $fillable = [
        'application_id', 'requirement', 'path', 'original_name', 'mime', 'size',
        'status', 'remarks', 'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }
}
