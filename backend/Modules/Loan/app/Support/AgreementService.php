<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\LoanAgreement;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanSetting;

/** Builds the loan agreement from the approved terms and records the member's acceptance. */
final class AgreementService
{
    public function __construct(private readonly ApplicationWorkflow $workflow) {}

    /**
     * The agreement's figures for a first due date. Nothing is saved, so staff can look before they commit.
     *
     * @return array<string,mixed>
     */
    public function terms(LoanApplication $application, DateTimeImmutable $firstDue): array
    {
        if ($firstDue->format('Y-m-d') <= date('Y-m-d')) {
            throw ValidationException::withMessages(['first_due_date' => ['The first due date must be in the future.']]);
        }

        $terms = $application->product_snapshot ?? [];
        $settings = LoanSetting::current();
        $principal = (string) ($application->approved_amount ?? $application->amount);

        try {
            $schedule = AmortizationCalculator::build(
                $principal,
                (string) ($terms['interest_rate'] ?? '0'),
                (string) ($terms['interest_method'] ?? 'diminishing'),
                $settings->diminishing_method,
                (string) ($terms['payment_frequency'] ?? 'monthly'),
                (int) $application->term_months,
                $firstDue,
            );
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['first_due_date' => [$e->getMessage()]]);
        }

        $processing = $this->fee($principal, (string) ($terms['processing_fee_percent'] ?? '0'));
        $service = $this->fee($principal, (string) ($terms['service_fee_percent'] ?? '0'));
        $fees = $processing + $service;
        $principalCents = (int) round(((float) $principal) * 100);
        $net = $settings->fee_handling === 'deduct_from_proceeds' ? $principalCents - $fees : $principalCents;

        if ($net <= 0) {
            throw ValidationException::withMessages(['first_due_date' => ['The fees are as large as the loan, so nothing would be released.']]);
        }

        return [
            'principal' => $principal,
            'interest_rate' => (string) ($terms['interest_rate'] ?? '0'),
            'interest_method' => (string) ($terms['interest_method'] ?? 'diminishing'),
            'diminishing_method' => $settings->diminishing_method,
            'payment_frequency' => (string) ($terms['payment_frequency'] ?? 'monthly'),
            'term_months' => (int) $application->term_months,
            'installments_count' => $schedule['installments_count'],
            'installment_amount' => $schedule['installment_amount'],
            'total_interest' => $schedule['total_interest'],
            'processing_fee' => number_format($processing / 100, 2, '.', ''),
            'service_fee' => number_format($service / 100, 2, '.', ''),
            'net_proceeds' => number_format($net / 100, 2, '.', ''),
            'fee_handling' => $settings->fee_handling,
            'penalty_rate_percent' => (string) ($terms['penalty_rate_percent'] ?? '0'),
            'grace_period_days' => (int) ($terms['grace_period_days'] ?? 0),
            'first_due_date' => $firstDue->format('Y-m-d'),
            'maturity_date' => $schedule['maturity_date'],
            'schedule' => $schedule['items'],
            'terms_text' => $settings->termsText(),
        ];
    }

    /** Creates the agreement (or replaces an unreleased one, which voids any signature). */
    public function generate(LoanApplication $application, User $staff, DateTimeImmutable $firstDue): LoanAgreement
    {
        $replaced = false;

        $agreement = DB::transaction(function () use ($application, $staff, $firstDue, &$replaced): LoanAgreement {
            $locked = LoanApplication::query()->with('product')->lockForUpdate()->findOrFail($application->id);

            if (! in_array($locked->status, [ApplicationStatus::APPROVED, ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE], true)) {
                throw ValidationException::withMessages(['status' => ['An agreement can only be made for an approved loan that has not been released.']]);
            }

            $terms = $this->terms($locked, $firstDue);
            $existing = LoanAgreement::query()->where('application_id', $locked->id)->first();

            if ($existing !== null) {
                $replaced = true;
                $this->deleteFiles($existing);
                $existing->delete();
            }

            $agreement = LoanAgreement::query()->create($terms + [
                'application_id' => $locked->id,
                'generated_by' => $staff->id,
                'generated_at' => now(),
            ]);
            $agreement->update(['agreement_no' => sprintf('AG-%s-%06d', now()->format('Y'), $agreement->id)]);

            $from = $locked->status;
            $locked->forceFill(['status' => ApplicationStatus::FOR_AGREEMENT])->save();

            $this->workflow->record(
                $locked,
                $from,
                ApplicationStatus::FOR_AGREEMENT,
                'staff',
                $staff->name,
                ($replaced ? 'Agreement regenerated' : 'Agreement generated')." for {$terms['principal']}. First payment due {$terms['first_due_date']}.",
            );

            return $agreement;
        });

        AuditLogger::record($staff, AuditAction::LoanAgreementGenerated, $application, null, [
            'agreement_no' => $agreement->agreement_no,
            'principal' => (string) $agreement->principal,
            'first_due_date' => $agreement->first_due_date->format('Y-m-d'),
            'replaced' => $replaced,
        ]);

        return $agreement;
    }

    /** The member accepts the agreement in the portal, with a drawn signature when Loan settings require one. */
    public function signByMember(LoanApplication $application, ?string $signatureDataUrl): void
    {
        DB::transaction(function () use ($application, $signatureDataUrl): void {
            $locked = LoanApplication::query()->with(['agreement', 'member'])->lockForUpdate()->findOrFail($application->id);

            if ($locked->status !== ApplicationStatus::FOR_AGREEMENT || $locked->agreement === null) {
                throw ValidationException::withMessages(['status' => ['There is no agreement waiting for your signature.']]);
            }

            if (LoanSetting::current()->signature_required && blank($signatureDataUrl)) {
                throw ValidationException::withMessages(['signature' => ['Sign the agreement.']]);
            }

            $path = null;

            if (filled($signatureDataUrl)) {
                $path = "loan/applications/{$locked->id}/agreement-signature.png";
                Storage::disk('local')->put($path, SignatureImage::decode((string) $signatureDataUrl));
            }

            $locked->agreement->update(['signed_at' => now(), 'signed_method' => 'portal', 'signature_path' => $path]);
            $locked->forceFill(['status' => ApplicationStatus::FOR_RELEASE])->save();

            $this->workflow->record($locked, ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE, 'member', $locked->member->name, 'The member accepted the agreement.');
        });

        AuditLogger::record(null, AuditAction::LoanAgreementSigned, $application, null, ['method' => 'portal']);
    }

    /** Staff attach the scanned, hand-signed agreement for a member who did not sign online. */
    public function recordPaper(LoanApplication $application, User $staff, UploadedFile $file): void
    {
        DB::transaction(function () use ($application, $staff, $file): void {
            $locked = LoanApplication::query()->with('agreement')->lockForUpdate()->findOrFail($application->id);

            if ($locked->status !== ApplicationStatus::FOR_AGREEMENT || $locked->agreement === null) {
                throw ValidationException::withMessages(['status' => ['There is no agreement waiting for a signature.']]);
            }

            $path = $file->store("loan/applications/{$locked->id}", 'local');

            $locked->agreement->update(['signed_at' => now(), 'signed_method' => 'paper', 'paper_path' => $path, 'recorded_by' => $staff->id]);
            $locked->forceFill(['status' => ApplicationStatus::FOR_RELEASE])->save();

            $this->workflow->record($locked, ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE, 'staff', $staff->name, 'Signed paper agreement recorded.');
        });

        AuditLogger::record($staff, AuditAction::LoanAgreementSigned, $application, null, ['method' => 'paper']);
    }

    private function fee(string $principal, string $percent): int
    {
        return (int) round(((float) $principal) * 100 * ((float) $percent) / 100);
    }

    private function deleteFiles(LoanAgreement $agreement): void
    {
        foreach ([$agreement->signature_path, $agreement->paper_path] as $path) {
            if ($path !== null) {
                Storage::disk('local')->delete($path);
            }
        }
    }
}
