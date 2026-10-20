<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Loan\Models\LoanSetting;

/** @mixin \Modules\Loan\Models\LoanAgreement */
final class LoanAgreementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'agreement_no' => $this->agreement_no,
            'principal' => (string) $this->principal,
            'interest_rate' => (string) $this->interest_rate,
            'interest_method' => $this->interest_method,
            'diminishing_method' => $this->diminishing_method,
            'payment_frequency' => $this->payment_frequency,
            'term_months' => $this->term_months,
            'installments_count' => $this->installments_count,
            'installment_amount' => (string) $this->installment_amount,
            'total_interest' => (string) $this->total_interest,
            'processing_fee' => (string) $this->processing_fee,
            'service_fee' => (string) $this->service_fee,
            'net_proceeds' => (string) $this->net_proceeds,
            'fee_handling' => $this->fee_handling,
            'penalty_rate_percent' => (string) $this->penalty_rate_percent,
            'penalty_basis' => $this->penalty_basis,
            'penalty_calculation' => $this->penalty_calculation,
            'payment_allocation' => $this->payment_allocation,
            'grace_period_days' => $this->grace_period_days,
            'first_due_date' => $this->first_due_date->format('Y-m-d'),
            'maturity_date' => $this->maturity_date->format('Y-m-d'),
            'schedule' => $this->schedule,
            'terms_text' => $this->terms_text,
            'generated_at' => $this->generated_at?->toISOString(),
            'signature_required' => LoanSetting::current()->signature_required,
        ];
    }
}
