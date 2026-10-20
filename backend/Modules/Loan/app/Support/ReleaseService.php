<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanRelease;

/** The cashier pays the loan out. This creates the loan account and its repayment schedule. */
final class ReleaseService
{
    public function __construct(private readonly ApplicationWorkflow $workflow) {}

    /** @param array{method:string, reference_no?:?string, remarks?:?string, fees_collected?:bool} $data */
    public function release(LoanApplication $application, User $cashier, array $data): Loan
    {
        $loan = DB::transaction(function () use ($application, $cashier, $data): Loan {
            $locked = LoanApplication::query()->with(['agreement', 'member'])->lockForUpdate()->findOrFail($application->id);
            $agreement = $locked->agreement;
            $previousStatus = $locked->status;

            if (! in_array($locked->status, [ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE], true) || $agreement === null) {
                throw ValidationException::withMessages(['status' => ['Create the loan agreement first, then release the loan.']]);
            }

            if ($agreement->first_due_date->format('Y-m-d') <= now()->format('Y-m-d')) {
                throw ValidationException::withMessages(['status' => ['The first due date has already passed. Regenerate the agreement with a new date before releasing.']]);
            }

            $fees = round((float) $agreement->processing_fee + (float) $agreement->service_fee, 2);

            if ($agreement->fee_handling === 'collect_separately' && $fees > 0 && ! ($data['fees_collected'] ?? false)) {
                throw ValidationException::withMessages(['fees_collected' => ['Confirm that the fees were collected from the member.']]);
            }

            $loan = Loan::query()->create([
                'application_id' => $locked->id,
                'member_id' => $locked->member_id,
                'product_id' => $locked->product_id,
                'principal' => $agreement->principal,
                'total_interest' => $agreement->total_interest,
                'outstanding_balance' => round((float) $agreement->principal + (float) $agreement->total_interest, 2),
                'installments_count' => $agreement->installments_count,
                'first_due_date' => $agreement->first_due_date,
                'maturity_date' => $agreement->maturity_date,
                'penalty_rate_percent' => $agreement->penalty_rate_percent,
                'grace_period_days' => $agreement->grace_period_days,
                'penalty_basis' => $agreement->penalty_basis,
                'penalty_calculation' => $agreement->penalty_calculation,
                'payment_allocation' => $agreement->payment_allocation,
                'status' => 'active',
                'released_at' => now(),
            ]);
            $loan->update(['loan_no' => sprintf('LO-%s-%06d', now()->format('Y'), $loan->id)]);

            foreach ($agreement->schedule as $item) {
                $loan->scheduleItems()->create([
                    'number' => $item['number'],
                    'due_date' => $item['due_date'],
                    'principal' => $item['principal'],
                    'interest' => $item['interest'],
                    'total' => $item['total'],
                    'balance_after' => $item['balance_after'],
                ]);
            }

            $release = LoanRelease::query()->create([
                'loan_id' => $loan->id,
                'method' => $data['method'],
                'reference_no' => $data['reference_no'] ?? null,
                'amount_released' => $agreement->net_proceeds,
                'fees_total' => $fees,
                'fee_handling' => $agreement->fee_handling,
                'remarks' => $data['remarks'] ?? null,
                'released_by' => $cashier->id,
                'released_by_name' => $cashier->name,
                'released_at' => now(),
            ]);
            $release->update(['receipt_no' => sprintf('RC-%s-%06d', now()->format('Y'), $release->id)]);

            $locked->forceFill(['status' => ApplicationStatus::RELEASED])->save();

            $this->workflow->record(
                $locked,
                $previousStatus,
                ApplicationStatus::RELEASED,
                'staff',
                $cashier->name,
                'Loan released: '.number_format((float) $agreement->net_proceeds, 2)." by {$data['method']}.",
            );

            return $loan;
        });

        AuditLogger::record($cashier, AuditAction::LoanReleased, $application, null, [
            'loan_no' => $loan->loan_no,
            'amount_released' => (string) $loan->release->amount_released,
            'method' => $data['method'],
        ]);

        return $loan;
    }
}
