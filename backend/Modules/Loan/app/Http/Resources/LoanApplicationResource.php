<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \Modules\Loan\Models\LoanApplication */
final class LoanApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_no' => $this->reference_no,
            'status' => $this->status,
            'editable' => $this->isMemberEditable(),
            'amount' => (string) $this->amount,
            'term_months' => $this->term_months,
            'purpose' => $this->purpose,
            'monthly_income' => $this->monthly_income === null ? null : (string) $this->monthly_income,
            'employer_business' => $this->employer_business,
            'collateral_description' => $this->collateral_description,
            'collateral_value' => $this->collateral_value === null ? null : (string) $this->collateral_value,
            'has_signature' => $this->signature_path !== null,
            'signed_at' => $this->signed_at?->toISOString(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'status_remarks' => $this->status_remarks,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'member' => $this->whenLoaded('member', fn () => [
                'id' => $this->member->id,
                'member_code' => $this->member->member_code,
                'name' => $this->member->name,
            ]),
            'product' => $this->whenLoaded('product', fn () => (new LoanProductResource($this->product))->resolve()),
            'product_snapshot' => $this->when($this->product_snapshot !== null, $this->product_snapshot),

            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(static fn ($d): array => [
                'id' => $d->id,
                'requirement' => $d->requirement,
                'original_name' => $d->original_name,
                'size' => $d->size,
                'status' => $d->status,
                'remarks' => $d->remarks,
            ])->values()->all()),

            'guarantors' => $this->whenLoaded('guarantors', fn () => $this->guarantors->map(static fn ($g): array => [
                'member_code' => $g->member->member_code,
                'name' => $g->member->name,
            ])->values()->all()),

            'events' => $this->whenLoaded('events', fn () => $this->events->map(static fn ($e): array => [
                'from_status' => $e->from_status,
                'to_status' => $e->to_status,
                'actor_type' => $e->actor_type,
                'actor_name' => $e->actor_name,
                'remarks' => $e->remarks,
                'created_at' => $e->created_at?->toISOString(),
            ])->values()->all()),
        ];
    }
}
