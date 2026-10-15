<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanProductDocument extends Model
{
    protected $table = 'loan_product_documents';

    protected $fillable = ['product_id', 'name', 'is_required'];

    protected function casts(): array
    {
        return ['is_required' => 'boolean'];
    }
}
