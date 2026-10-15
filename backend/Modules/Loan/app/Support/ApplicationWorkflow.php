<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\LoanApplication;
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
