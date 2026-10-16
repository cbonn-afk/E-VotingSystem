<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use Modules\IdentityAccess\Models\User;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanApprovalLevel;

/** Who must approve a loan, in what order, and who may act on the current step. */
final class ApprovalPolicy
{
    /**
     * The levels a loan of this amount must pass: every level whose "from" amount it reaches, in order.
     *
     * @return list<array{sequence:int,name:string,role_id:?int,role_name:?string}>
     */
    public function chainFor(string|float $amount): array
    {
        $levels = LoanApprovalLevel::query()->with('role')->orderBy('sequence')->get();
        $chain = $levels->filter(static fn (LoanApprovalLevel $l): bool => (float) $l->min_amount <= (float) $amount)->values();

        if ($chain->isEmpty() && $levels->isNotEmpty()) {
            $chain = collect([$levels->first()]);
        }

        return $chain->map(static fn (LoanApprovalLevel $l): array => [
            'sequence' => $l->sequence,
            'name' => $l->name,
            'role_id' => $l->role_id,
            'role_name' => $l->role?->name,
        ])->values()->all();
    }

    /** The step waiting for a decision, or null when nothing is waiting. */
    public function nextStep(LoanApplication $application): ?array
    {
        if ($application->status !== ApplicationStatus::FOR_APPROVAL) {
            return null;
        }

        $application->loadMissing('approvals');

        return ($application->approval_chain ?? [])[$application->approvals->count()] ?? null;
    }

    /**
     * Why this user may not decide the current step (plain language), or null when they may.
     * Full-access users (Super Admin, Admin) skip the role requirement only; the separation rules apply to everyone.
     */
    public function denialReason(User $user, LoanApplication $application): ?string
    {
        $application->loadMissing(['approvals', 'evaluation']);
        $step = $this->nextStep($application);

        if ($step === null) {
            return 'This application is not waiting for an approval.';
        }

        if (! $user->can('loan.approve')) {
            return 'You do not have permission to approve loans.';
        }

        if ($step['role_id'] !== null && ! $user->hasFullAccess() && ! $user->roles->contains('id', $step['role_id'])) {
            return 'This step needs the '.($step['role_name'] ?? $step['name']).' role.';
        }

        if ($application->evaluation?->evaluator_id === $user->id) {
            return 'You evaluated this application, so someone else must approve it.';
        }

        if ($application->approvals->contains('approver_id', $user->id)) {
            return 'You already approved an earlier step. A different person must approve this one.';
        }

        return null;
    }
}
