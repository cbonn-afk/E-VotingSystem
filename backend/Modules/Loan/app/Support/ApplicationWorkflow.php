<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanApplicationApproval;
use Modules\Loan\Models\LoanApplicationEvaluation;
use Modules\Loan\Models\LoanApplicationEvent;

/** Every status change goes through here so it is validated, recorded in the history, and audited. */
final class ApplicationWorkflow
{
    public function record(LoanApplication $application, ?string $from, string $to, string $actorType, ?string $actorName, ?string $remarks = null): void
    {
        LoanApplicationEvent::query()->create([
            'application_id' => $application->id,
            'from_status' => $from,
            'to_status' => $to,
            'actor_type' => $actorType,
            'actor_name' => $actorName,
            'remarks' => $remarks,
        ]);
    }

    /** Member submits a draft, or resubmits one that was returned. */
    public function submit(LoanApplication $application): void
    {
        $problems = (new LoanEligibility)->problems($application);

        if ($problems !== []) {
            throw ValidationException::withMessages(['submit' => $problems]);
        }

        $from = $application->status;
        $product = $application->product;

        DB::transaction(function () use ($application, $from, $product): void {
            $application->forceFill([
                'status' => ApplicationStatus::SUBMITTED,
                'submitted_at' => now(),
                'status_remarks' => null,
                'product_snapshot' => $product->only([
                    'code', 'name', 'interest_rate', 'interest_method', 'payment_frequency',
                    'processing_fee_percent', 'service_fee_percent', 'penalty_rate_percent', 'grace_period_days',
                ]),
            ])->save();

            $this->record($application, $from, ApplicationStatus::SUBMITTED, 'member', $application->member->name);
        });

        AuditLogger::record(null, AuditAction::LoanApplicationSubmitted, $application, null, [
            'reference_no' => $application->reference_no,
            'member_code' => $application->member->member_code,
            'amount' => (string) $application->amount,
        ]);
    }

    public function cancel(LoanApplication $application): void
    {
        $from = $application->status;

        DB::transaction(function () use ($application, $from): void {
            $application->forceFill(['status' => ApplicationStatus::CANCELLED])->save();
            $this->record($application, $from, ApplicationStatus::CANCELLED, 'member', $application->member->name);
        });
    }

    /** Staff action: start_review, return, accept_documents or reject. */
    public function apply(LoanApplication $application, string $action, User $staff, ?string $remarks): void
    {
        $rule = ApplicationStatus::ACTIONS[$action] ?? null;

        if ($rule === null || ! in_array($application->status, $rule['from'], true)) {
            throw ValidationException::withMessages(['action' => ['This action is not available for the application\'s current status.']]);
        }

        $remarks = $remarks === null ? null : trim($remarks);

        if ($rule['remarks'] && ($remarks === null || $remarks === '')) {
            throw ValidationException::withMessages(['remarks' => ['Give a reason so the member knows what happened.']]);
        }

        if ($action === 'accept_documents') {
            $this->assertRequiredDocumentsAccepted($application);
        }

        $from = $application->status;

        DB::transaction(function () use ($application, $rule, $from, $staff, $remarks): void {
            $application->forceFill([
                'status' => $rule['to'],
                'reviewed_by' => $staff->id,
                'status_remarks' => $remarks,
            ])->save();

            $this->record($application, $from, $rule['to'], 'staff', $staff->name, $remarks);
        });

        AuditLogger::record($staff, AuditAction::LoanApplicationStatusUpdated, $application, ['status' => $from], [
            'status' => $rule['to'],
            'reference_no' => $application->reference_no,
        ]);
    }

    /** Evaluator records a recommendation; the application then waits for the approval chain. */
    public function evaluate(LoanApplication $application, User $staff, array $data): void
    {
        $recommendation = $data['recommendation'];

        DB::transaction(function () use ($application, $staff, $data, $recommendation): void {
            $locked = LoanApplication::query()->with('product')->lockForUpdate()->findOrFail($application->id);

            if ($locked->status !== ApplicationStatus::FOR_EVALUATION) {
                throw ValidationException::withMessages(['status' => ['This application is not waiting for an evaluation.']]);
            }

            $requested = round((float) $locked->amount, 2);
            $recommended = null;

            if ($recommendation === 'approve') {
                $recommended = $requested;
            } elseif ($recommendation === 'approve_lower') {
                $recommended = round((float) ($data['recommended_amount'] ?? 0), 2);

                if ($recommended <= 0 || $recommended >= $requested) {
                    throw ValidationException::withMessages(['recommended_amount' => ['Enter an amount lower than the requested '.number_format($requested, 2).'.']]);
                }

                if ($recommended < (float) $locked->product->min_amount) {
                    throw ValidationException::withMessages(['recommended_amount' => ['The amount cannot be below the product minimum of '.number_format((float) $locked->product->min_amount, 2).'.']]);
                }
            }

            // The chain is fixed now, from the amount being recommended, so later setting changes do not alter it.
            $chain = (new ApprovalPolicy)->chainFor($recommended ?? $requested);

            if ($chain === []) {
                throw ValidationException::withMessages(['status' => ['No approval levels are set up. Ask an administrator to configure them.']]);
            }

            LoanApplicationEvaluation::query()->create([
                'application_id' => $locked->id,
                'evaluator_id' => $staff->id,
                'evaluator_name' => $staff->name,
                'recommendation' => $recommendation,
                'recommended_amount' => $recommended,
                'verified_income' => $data['verified_income'] ?? null,
                'existing_obligations' => $data['existing_obligations'] ?? null,
                'notes' => trim((string) $data['notes']),
            ]);

            $locked->forceFill([
                'status' => ApplicationStatus::FOR_APPROVAL,
                'approval_chain' => $chain,
                'status_remarks' => null,
            ])->save();

            $label = ['approve' => 'recommends approval', 'approve_lower' => 'recommends a lower amount', 'reject' => 'recommends rejection'][$recommendation];

            $this->record($locked, ApplicationStatus::FOR_EVALUATION, ApplicationStatus::FOR_APPROVAL, 'staff', $staff->name, "Evaluation: {$label}.");
        });

        AuditLogger::record($staff, AuditAction::LoanApplicationEvaluated, $application, null, [
            'reference_no' => $application->reference_no,
            'recommendation' => $recommendation,
        ]);
    }

    /** One approver decides the current step. The last required approval makes the loan Approved. */
    public function decide(LoanApplication $application, User $user, string $decision, ?string $amount, ?string $remarks): void
    {
        $remarks = $remarks === null ? null : trim($remarks);
        $outcome = [];

        DB::transaction(function () use ($application, $user, $decision, $amount, $remarks, &$outcome): void {
            $locked = LoanApplication::query()->with(['product', 'approvals', 'evaluation'])->lockForUpdate()->findOrFail($application->id);
            $policy = new ApprovalPolicy;

            if (($reason = $policy->denialReason($user, $locked)) !== null) {
                throw ValidationException::withMessages(['decision' => [$reason]]);
            }

            $step = $policy->nextStep($locked);
            $effective = $this->effectiveAmount($locked);
            $final = null;

            if ($decision === 'rejected') {
                if ($remarks === null || $remarks === '') {
                    throw ValidationException::withMessages(['remarks' => ['Give a reason so the member and the next reviewer know why.']]);
                }
            } else {
                $final = $amount === null || $amount === '' ? $effective : round((float) $amount, 2);

                if ($final <= 0 || $final > $effective) {
                    throw ValidationException::withMessages(['approved_amount' => ['The amount cannot be higher than '.number_format($effective, 2).'.']]);
                }

                if ($final < (float) $locked->product->min_amount) {
                    throw ValidationException::withMessages(['approved_amount' => ['The amount cannot be below the product minimum of '.number_format((float) $locked->product->min_amount, 2).'.']]);
                }
            }

            LoanApplicationApproval::query()->create([
                'application_id' => $locked->id,
                'sequence' => $step['sequence'],
                'level_name' => $step['name'],
                'approver_id' => $user->id,
                'approver_name' => $user->name,
                'decision' => $decision,
                'approved_amount' => $final,
                'remarks' => $remarks === '' ? null : $remarks,
                'decided_at' => now(),
            ]);

            $isLast = $locked->approvals->count() + 1 >= count($locked->approval_chain ?? []);
            $to = ApplicationStatus::FOR_APPROVAL;

            if ($decision === 'rejected') {
                $to = ApplicationStatus::REJECTED;
                $locked->forceFill(['status' => $to, 'status_remarks' => $remarks])->save();
                $note = "{$step['name']} rejected: {$remarks}";
            } elseif ($isLast) {
                $to = ApplicationStatus::APPROVED;
                $locked->forceFill(['status' => $to, 'approved_amount' => $final, 'status_remarks' => null])->save();
                $note = "{$step['name']} approved. Final approved amount: ".number_format($final, 2).'.';
            } else {
                $note = "{$step['name']} approved".($final < $effective ? ' for '.number_format($final, 2) : '').'.';
            }

            if ($decision === 'approved' && $remarks !== null && $remarks !== '') {
                $note .= " {$remarks}";
            }

            $this->record($locked, ApplicationStatus::FOR_APPROVAL, $to, 'staff', $user->name, $note);
            $outcome = ['step' => $step['name'], 'to' => $to, 'amount' => $final];
        });

        AuditLogger::record($user, AuditAction::LoanApprovalDecided, $application, null, [
            'reference_no' => $application->reference_no,
            'level' => $outcome['step'],
            'decision' => $decision,
            'status' => $outcome['to'],
            'approved_amount' => $outcome['amount'],
        ]);
    }

    /** What is currently on the table: the last approved amount, else the evaluator's figure, else the request. */
    private function effectiveAmount(LoanApplication $application): float
    {
        $lastApproved = $application->approvals->where('decision', 'approved')->last();

        return round((float) ($lastApproved?->approved_amount ?? $application->evaluation?->recommended_amount ?? $application->amount), 2);
    }

    private function assertRequiredDocumentsAccepted(LoanApplication $application): void
    {
        $application->loadMissing(['product.documents', 'documents']);
        $accepted = $application->documents->where('status', 'accepted')->pluck('requirement')->all();

        $missing = $application->product->documents
            ->where('is_required', true)
            ->pluck('name')
            ->reject(fn (string $name): bool => in_array($name, $accepted, true))
            ->values()
            ->all();

        if ($missing !== []) {
            throw ValidationException::withMessages([
                'action' => ['Accept every required document first. Still open: '.implode(', ', $missing).'.'],
            ]);
        }
    }
}
