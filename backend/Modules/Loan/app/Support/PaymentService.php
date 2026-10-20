<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanPayment;
use Modules\Loan\Models\LoanScheduleItem;

/** Collecting a loan: posting a payment, splitting it, and undoing the latest one. Money rules live in PaymentEngine. */
final class PaymentService
{
    /** The penalty and payment rules this loan was signed under. */
    public function rule(Loan $loan): array
    {
        return [
            'rate' => (float) $loan->penalty_rate_percent,
            'grace' => (int) $loan->grace_period_days,
            'basis' => $loan->penalty_basis,
            'calculation' => $loan->penalty_calculation,
            'order' => $loan->payment_allocation,
        ];
    }

    /** Where the loan stands on a date, without changing anything. */
    public function snapshot(Loan $loan, ?DateTimeImmutable $asOf = null): array
    {
        $loan->loadMissing('scheduleItems');

        return PaymentEngine::snapshot($this->itemsFrom($loan->scheduleItems), $this->rule($loan), $asOf ?? new DateTimeImmutable(now()->format('Y-m-d')));
    }

    /** @param array{amount:string|float|int, paid_on:string, method:string, reference_no?:?string, remarks?:?string} $data */
    public function record(Loan $loan, User $cashier, array $data): LoanPayment
    {
        $payment = DB::transaction(function () use ($loan, $cashier, $data): LoanPayment {
            $locked = Loan::query()->lockForUpdate()->findOrFail($loan->id);

            if ($locked->status !== 'active') {
                throw ValidationException::withMessages(['status' => ['This loan is not open for payments.']]);
            }

            $paidOn = (string) $data['paid_on'];
            $latest = LoanPayment::query()->where('loan_id', $locked->id)->where('status', 'posted')->max('paid_on');
            $earliest = max($locked->released_at->format('Y-m-d'), $latest === null ? '' : substr((string) $latest, 0, 10));

            if ($paidOn > now()->format('Y-m-d')) {
                throw ValidationException::withMessages(['paid_on' => ['The payment date cannot be in the future.']]);
            }

            if ($paidOn < $earliest) {
                throw ValidationException::withMessages(['paid_on' => ["The payment date cannot be before {$earliest}: the day the loan was released or the last payment was made."]]);
            }

            $rows = $locked->scheduleItems()->lockForUpdate()->get();
            $items = $this->itemsFrom($rows);
            $rule = $this->rule($locked);

            $accrualBefore = array_map(static fn (array $i): array => ['id' => $i['id'], 'penalty' => $i['penalty'], 'through' => $i['through']], $items);
            $accrued = PaymentEngine::accrue($items, $rule, new DateTimeImmutable($paidOn));
            $amount = (int) round(((float) $data['amount']) * 100);
            $payoff = PaymentEngine::payoff($accrued);

            if ($amount <= 0) {
                throw ValidationException::withMessages(['amount' => ['Enter an amount greater than zero.']]);
            }

            if ($amount > $payoff) {
                throw ValidationException::withMessages(['amount' => ['The amount is more than the whole balance of '.number_format($payoff / 100, 2).' on that date.']]);
            }

            $result = PaymentEngine::allocate($accrued, $amount, $rule['order']);

            foreach ($result['items'] as $item) {
                $rows->firstWhere('id', $item['id'])->update([
                    'paid_principal' => self::money($item['paid_principal']),
                    'paid_interest' => self::money($item['paid_interest']),
                    'paid_penalty' => self::money($item['paid_penalty']),
                    'penalty_accrued' => self::money($item['penalty']),
                    'penalty_through' => $item['through'],
                ]);
            }

            $outstanding = PaymentEngine::outstanding($result['items']);
            $penaltyAfter = PaymentEngine::payoff($result['items']) - $outstanding;

            $payment = LoanPayment::query()->create([
                'loan_id' => $locked->id,
                'paid_on' => $paidOn,
                'amount' => self::money($amount),
                'method' => $data['method'],
                'reference_no' => $data['reference_no'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'status' => 'posted',
                'balance_after' => self::money($outstanding),
                'penalty_after' => self::money($penaltyAfter),
                'accrual_before' => $accrualBefore,
                'received_by' => $cashier->id,
                'received_by_name' => $cashier->name,
            ]);
            $payment->update(['receipt_no' => sprintf('PR-%s-%06d', now()->format('Y'), $payment->id)]);

            foreach ($result['allocations'] as $allocation) {
                $payment->allocations()->create([
                    'schedule_item_id' => $allocation['item_id'],
                    'component' => $allocation['component'],
                    'amount' => self::money($allocation['amount']),
                ]);
            }

            $paidOff = $outstanding + $penaltyAfter === 0;
            $locked->update([
                'outstanding_balance' => self::money($outstanding),
                'status' => $paidOff ? 'fully_paid' : 'active',
                'fully_paid_at' => $paidOff ? now() : null,
            ]);

            return $payment;
        });

        AuditLogger::record($cashier, AuditAction::LoanPaymentRecorded, $loan, null, [
            'receipt_no' => $payment->receipt_no,
            'amount' => (string) $payment->amount,
            'paid_on' => $payment->paid_on->format('Y-m-d'),
            'method' => $payment->method,
        ]);

        return $payment;
    }

    /** Undoes the most recent payment exactly, including the penalties that were added for it. */
    public function void(Loan $loan, LoanPayment $payment, User $user, string $reason): void
    {
        DB::transaction(function () use ($loan, $payment, $user, $reason): void {
            $locked = Loan::query()->lockForUpdate()->findOrFail($loan->id);
            $fresh = LoanPayment::query()->with('allocations')->lockForUpdate()->findOrFail($payment->id);

            if ($fresh->loan_id !== $locked->id || $fresh->status !== 'posted') {
                throw ValidationException::withMessages(['payment' => ['This payment cannot be voided.']]);
            }

            if (LoanPayment::query()->where('loan_id', $locked->id)->where('status', 'posted')->where('id', '>', $fresh->id)->exists()) {
                throw ValidationException::withMessages(['payment' => ['Only the most recent payment can be voided. Void the later payments first.']]);
            }

            $rows = $locked->scheduleItems()->lockForUpdate()->get()->keyBy('id');

            foreach ($fresh->allocations as $allocation) {
                $row = $rows->get($allocation->schedule_item_id);
                $column = 'paid_'.$allocation->component;
                $row->update([$column => self::money(self::cents($row->{$column}) - self::cents($allocation->amount))]);
            }

            foreach ($fresh->accrual_before as $before) {
                $rows->get($before['id'])->update(['penalty_accrued' => self::money((int) $before['penalty']), 'penalty_through' => $before['through']]);
            }

            $fresh->update([
                'status' => 'voided',
                'voided_at' => now(),
                'voided_by' => $user->id,
                'voided_by_name' => $user->name,
                'void_reason' => $reason,
            ]);

            $outstanding = PaymentEngine::outstanding($this->itemsFrom($locked->scheduleItems()->get()));
            $locked->update(['outstanding_balance' => self::money($outstanding), 'status' => 'active', 'fully_paid_at' => null]);
        });

        AuditLogger::record($user, AuditAction::LoanPaymentVoided, $loan, null, [
            'receipt_no' => $payment->receipt_no,
            'amount' => (string) $payment->amount,
            'reason' => $reason,
        ]);
    }

    /**
     * @param iterable<LoanScheduleItem> $rows
     * @return list<array<string,mixed>>
     */
    public function itemsFrom(iterable $rows): array
    {
        $items = [];

        foreach ($rows as $row) {
            $items[] = [
                'id' => $row->id,
                'number' => $row->number,
                'due' => $row->due_date->format('Y-m-d'),
                'principal' => self::cents($row->principal),
                'interest' => self::cents($row->interest),
                'paid_principal' => self::cents($row->paid_principal),
                'paid_interest' => self::cents($row->paid_interest),
                'penalty' => self::cents($row->penalty_accrued),
                'paid_penalty' => self::cents($row->paid_penalty),
                'through' => $row->penalty_through?->format('Y-m-d'),
            ];
        }

        return $items;
    }

    public static function cents(mixed $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    public static function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
