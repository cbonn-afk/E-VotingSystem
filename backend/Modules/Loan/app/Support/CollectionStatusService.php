<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanSetting;

/** Keeps each loan's current / due / overdue / delinquent / default label up to date. */
final class CollectionStatusService
{
    public function __construct(private readonly PaymentService $payments) {}

    /**
     * Where a loan stands on a date. Changes nothing.
     *
     * @return array{status:string, days_past_due:int, overdue_cents:int, oldest_due:?string, due_today:bool}
     */
    public function evaluate(Loan $loan, ?DateTimeImmutable $asOf = null): array
    {
        $loan->loadMissing('scheduleItems');
        $settings = LoanSetting::current();

        $result = CollectionClassifier::fromItems(
            $this->payments->itemsFrom($loan->scheduleItems),
            $asOf ?? new DateTimeImmutable(now()->format('Y-m-d')),
            (int) $settings->delinquent_after_days,
            (int) $settings->default_after_days,
        );

        if ($loan->status === 'fully_paid') {
            $result['status'] = 'paid';
        }

        return $result;
    }

    /** Saves the label on the loan and keeps a history row whenever it changes. */
    public function refresh(Loan $loan, ?DateTimeImmutable $asOf = null): void
    {
        $asOf ??= new DateTimeImmutable(now()->format('Y-m-d'));
        $result = $this->evaluate($loan->unsetRelation('scheduleItems'), $asOf);
        $from = $loan->collection_status ?? 'current';   // a freshly created loan has not loaded the database default yet
        $changed = $from !== $result['status'];

        $loan->forceFill([
            'collection_status' => $result['status'],
            'days_past_due' => $result['days_past_due'],
            'overdue_amount' => PaymentService::money($result['overdue_cents']),
            'oldest_due_date' => $result['oldest_due'],
            'status_checked_on' => $asOf->format('Y-m-d'),
        ])->save();

        if ($changed) {
            DB::table('loan_status_history')->insert([
                'loan_id' => $loan->id,
                'from_status' => $from,
                'to_status' => $result['status'],
                'days_past_due' => $result['days_past_due'],
                'changed_on' => $asOf->format('Y-m-d'),
                'created_at' => now(),
            ]);
        }
    }

    /** The daily job. Returns how many loans were checked and how many changed label. */
    public function refreshAll(?DateTimeImmutable $asOf = null): array
    {
        $checked = 0;
        $changed = 0;

        Loan::query()->where('status', 'active')->orderBy('id')->chunkById(200, function ($loans) use ($asOf, &$checked, &$changed): void {
            foreach ($loans as $loan) {
                $before = $loan->collection_status;
                $this->refresh($loan, $asOf);
                $checked++;
                $changed += $before !== $loan->collection_status ? 1 : 0;
            }
        });

        return ['checked' => $checked, 'changed' => $changed];
    }

    /** True when any active loan has not been checked today, e.g. the scheduler is not running yet. */
    public function isStale(): bool
    {
        return Loan::query()->where('status', 'active')
            ->where(fn ($q) => $q->whereNull('status_checked_on')->orWhere('status_checked_on', '<', now()->format('Y-m-d')))
            ->exists();
    }
}
