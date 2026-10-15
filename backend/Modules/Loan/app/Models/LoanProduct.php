<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoanProduct extends Model
{
    public const STATUSES = ['active', 'inactive'];
    public const INTEREST_METHODS = ['diminishing', 'flat'];
    public const FREQUENCIES = ['weekly', 'semi_monthly', 'monthly'];

    protected $table = 'loan_products';

    protected $fillable = [
        'code', 'name', 'description', 'min_amount', 'max_amount', 'interest_rate', 'interest_method',
        'term_min_months', 'term_max_months', 'payment_frequency', 'processing_fee_percent',
        'service_fee_percent', 'penalty_rate_percent', 'grace_period_days', 'requires_guarantor',
        'guarantor_count', 'requires_collateral', 'min_membership_months', 'status',
    ];

    protected function casts(): array
    {
        return [
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'interest_rate' => 'decimal:3',
            'processing_fee_percent' => 'decimal:3',
            'service_fee_percent' => 'decimal:3',
            'penalty_rate_percent' => 'decimal:3',
            'requires_guarantor' => 'boolean',
            'requires_collateral' => 'boolean',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(LoanProductDocument::class, 'product_id')->orderBy('id');
    }
}
