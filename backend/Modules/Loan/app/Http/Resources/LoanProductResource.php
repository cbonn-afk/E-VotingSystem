<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \Modules\Loan\Models\LoanProduct */
final class LoanProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'min_amount' => (string) $this->min_amount,
            'max_amount' => (string) $this->max_amount,
            'interest_rate' => (string) $this->interest_rate,
            'interest_method' => $this->interest_method,
            'term_min_months' => $this->term_min_months,
            'term_max_months' => $this->term_max_months,
            'payment_frequency' => $this->payment_frequency,
            'processing_fee_percent' => (string) $this->processing_fee_percent,
            'service_fee_percent' => (string) $this->service_fee_percent,
            'penalty_rate_percent' => (string) $this->penalty_rate_percent,
            'grace_period_days' => $this->grace_period_days,
            'requires_guarantor' => $this->requires_guarantor,
            'guarantor_count' => $this->guarantor_count,
            'requires_collateral' => $this->requires_collateral,
            'min_membership_months' => $this->min_membership_months,
            'status' => $this->status,
            'documents' => $this->documents->map(static fn ($d): array => [
                'name' => $d->name,
                'is_required' => $d->is_required,
            ])->values()->all(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
