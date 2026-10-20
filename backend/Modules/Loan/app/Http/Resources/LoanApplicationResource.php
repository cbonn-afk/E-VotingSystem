<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Loan\Support\ApplicationStatus;
use Modules\Loan\Support\ApprovalPolicy;

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
            'approved_amount' => $this->approved_amount === null ? null : (string) $this->approved_amount,
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

            // Staff-only: never loaded or computed for member portal requests.
            'can_evaluate' => $this->when($request->user() !== null, fn () => $this->status === ApplicationStatus::FOR_EVALUATION && $request->user()->can('loan.evaluate')),
            'approval_chain' => $this->when($request->user() !== null && $this->approval_chain !== null, fn () => $this->approval_chain),
            'approval' => $this->when($request->user() !== null && $this->status === ApplicationStatus::FOR_APPROVAL, function () use ($request): array {
                $policy = new ApprovalPolicy;
                $step = $policy->nextStep($this->resource);
                $reason = $policy->denialReason($request->user(), $this->resource);

                return ['next_step' => $step, 'can_decide' => $reason === null, 'denial_reason' => $reason];
            }),
            'can_generate_agreement' => $this->when($request->user() !== null, fn () => in_array($this->status, [ApplicationStatus::APPROVED, ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE], true) && $request->user()->can('loan.applications.manage')),
            'can_release' => $this->when($request->user() !== null, fn () => in_array($this->status, [ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE], true) && $request->user()->can('loan.release')),
            'agreement' => $this->whenLoaded('agreement', fn () => $this->agreement === null ? null : (new LoanAgreementResource($this->agreement))->resolve()),
            'loan' => $this->whenLoaded('loan', fn () => $this->loan === null ? null : (new LoanResource($this->loan))->resolve()),
            'evaluation' => $this->whenLoaded('evaluation', fn () => $this->evaluation === null ? null : [
                'evaluator_name' => $this->evaluation->evaluator_name,
                'recommendation' => $this->evaluation->recommendation,
                'recommended_amount' => $this->evaluation->recommended_amount === null ? null : (string) $this->evaluation->recommended_amount,
                'verified_income' => $this->evaluation->verified_income === null ? null : (string) $this->evaluation->verified_income,
                'existing_obligations' => $this->evaluation->existing_obligations === null ? null : (string) $this->evaluation->existing_obligations,
                'notes' => $this->evaluation->notes,
                'created_at' => $this->evaluation->created_at?->toISOString(),
            ]),
            'approvals' => $this->whenLoaded('approvals', fn () => $this->approvals->map(static fn ($a): array => [
                'sequence' => $a->sequence,
                'level_name' => $a->level_name,
                'approver_name' => $a->approver_name,
                'decision' => $a->decision,
                'approved_amount' => $a->approved_amount === null ? null : (string) $a->approved_amount,
                'remarks' => $a->remarks,
                'decided_at' => $a->decided_at?->toISOString(),
            ])->values()->all()),

            'member' => $this->whenLoaded('member', fn () => [
                'id' => $this->member->id,
                'member_code' => $this->member->member_code,
                'name' => $this->member->name,
            ]),
            'product' => $this->whenLoaded('product', fn () => (new LoanProductResource($this->product))->resolve()),
            'product_snapshot' => $this->when($this->product_snapshot !== null, $this->product_snapshot),


            'guarantors' => $this->whenLoaded('guarantors', fn () => $this->guarantors->map(static fn ($g): array => [
                'member_code' => $g->member->member_code,
                'name' => $g->member->name,
            ])->values()->all()),

            // Members see the milestones only: the evaluation and the individual approval steps (with their
            // notes) are internal. A rejection reason stays visible; the final approval note does not.
            'events' => $this->whenLoaded('events', fn () => $this->events
                ->when($request->user() === null, fn ($events) => $events->reject(static fn ($e): bool => $e->to_status === ApplicationStatus::FOR_APPROVAL))
                ->map(static fn ($e): array => [
                    'from_status' => $e->from_status,
                    'to_status' => $e->to_status,
                    'actor_type' => $e->actor_type,
                    'actor_name' => $e->actor_name,
                    'remarks' => $request->user() === null && $e->to_status === ApplicationStatus::APPROVED ? null : $e->remarks,
                    'created_at' => $e->created_at?->toISOString(),
                ])->values()->all()),
        ];
    }
}
