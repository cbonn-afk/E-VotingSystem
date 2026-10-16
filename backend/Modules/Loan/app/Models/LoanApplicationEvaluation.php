<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanApplicationEvaluation extends Model
{
    public const RECOMMENDATIONS = ['approve', 'approve_lower', 'reject'];

    protected $table = 'loan_application_evaluations';

    protected $fillable = [
        'application_id', 'evaluator_id', 'evaluator_name', 'recommendation',
        'recommended_amount', 'verified_income', 'existing_obligations', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'recommended_amount' => 'decimal:2',
            'verified_income' => 'decimal:2',
            'existing_obligations' => 'decimal:2',
        ];
    }
}
