<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Loan\Support\ApplicationStatus;
use Modules\Members\Models\Member;

class LoanApplication extends Model
{
    protected $table = 'loan_applications';

    protected $fillable = [
        'reference_no', 'member_id', 'product_id', 'status', 'amount', 'approved_amount', 'term_months', 'purpose',
        'monthly_income', 'employer_business', 'collateral_description', 'collateral_value',
        'signature_path', 'signed_at', 'submitted_at', 'product_snapshot', 'approval_chain', 'reviewed_by', 'status_remarks',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'approved_amount' => 'decimal:2',
            'approval_chain' => 'array',
            'monthly_income' => 'decimal:2',
            'collateral_value' => 'decimal:2',
            'product_snapshot' => 'array',
            'signed_at' => 'datetime',
            'submitted_at' => 'datetime',
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

    public function documents(): HasMany
    {
        return $this->hasMany(LoanApplicationDocument::class, 'application_id')->orderBy('id');
    }

    public function guarantors(): HasMany
    {
        return $this->hasMany(LoanApplicationGuarantor::class, 'application_id')->orderBy('id');
    }

    public function evaluation(): HasOne
    {
        return $this->hasOne(LoanApplicationEvaluation::class, 'application_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(LoanApplicationApproval::class, 'application_id')->orderBy('sequence');
    }

    public function agreement(): HasOne
    {
        return $this->hasOne(LoanAgreement::class, 'application_id');
    }

    public function loan(): HasOne
    {
        return $this->hasOne(Loan::class, 'application_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(LoanApplicationEvent::class, 'application_id')->orderBy('id');
    }

    /** Members may change an application only while it is a draft or has been returned for correction. */
    public function isMemberEditable(): bool
    {
        return in_array($this->status, ApplicationStatus::MEMBER_EDITABLE, true);
    }
}
