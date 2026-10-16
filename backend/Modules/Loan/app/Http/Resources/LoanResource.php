<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \Modules\Loan\Models\Loan */
final class LoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'loan_no' => $this->loan_no,
            'status' => $this->status,
            'principal' => (string) $this->principal,
            'total_interest' => (string) $this->total_interest,
            'outstanding_balance' => (string) $this->outstanding_balance,
            'installments_count' => $this->installments_count,
            'first_due_date' => $this->first_due_date->format('Y-m-d'),
            'maturity_date' => $this->maturity_date->format('Y-m-d'),
            'released_at' => $this->released_at?->toISOString(),
            'release' => $this->whenLoaded('release', fn () => $this->release === null ? null : [
                'receipt_no' => $this->release->receipt_no,
                'method' => $this->release->method,
                'reference_no' => $this->release->reference_no,
                'amount_released' => (string) $this->release->amount_released,
                'fees_total' => (string) $this->release->fees_total,
                'fee_handling' => $this->release->fee_handling,
                'remarks' => $this->release->remarks,
                'released_by_name' => $this->release->released_by_name,
                'released_at' => $this->release->released_at?->toISOString(),
            ]),
            'schedule' => $this->whenLoaded('scheduleItems', fn () => $this->scheduleItems->map(static fn ($i): array => [
                'number' => $i->number,
                'due_date' => $i->due_date->format('Y-m-d'),
                'principal' => (string) $i->principal,
                'interest' => (string) $i->interest,
                'total' => (string) $i->total,
                'balance_after' => (string) $i->balance_after,
            ])->values()->all()),
        ];
    }
}
