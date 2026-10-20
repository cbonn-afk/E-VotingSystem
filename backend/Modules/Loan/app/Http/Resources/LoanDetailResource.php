<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Loan\Support\PaymentEngine;
use Modules\Loan\Support\PaymentService;

/**
 * A loan account for the cashier (staff = true) or for the member who owns it.
 * Members never get staff names, remarks or voided payments.
 *
 * @mixin \Modules\Loan\Models\Loan
 */
class LoanDetailResource extends JsonResource
{
    public function __construct($resource, private readonly bool $staff = true, private readonly bool $detail = true)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $service = app(PaymentService::class);
        $today = new \DateTimeImmutable(now()->format('Y-m-d'));
        $snapshot = $service->snapshot($this->resource, $today);
        $money = static fn (int $cents): string => PaymentService::money($cents);

        $summary = [
            'as_of' => $today->format('Y-m-d'),
            'due_now' => $money($snapshot['due_now']),
            'penalty_owed' => $money($snapshot['penalty_owed']),
            'payoff' => $money($snapshot['payoff']),
            'outstanding' => $money($snapshot['outstanding']),
            'overdue_count' => $snapshot['overdue_count'],
            'next_due' => $snapshot['next_due'] === null ? null : [
                'number' => $snapshot['next_due']['number'],
                'due_date' => $snapshot['next_due']['due'],
                'amount' => $money($snapshot['next_due']['amount']),
            ],
        ];

        $data = [
            'id' => $this->id,
            'loan_no' => $this->loan_no,
            'status' => $this->status,
            'principal' => (string) $this->principal,
            'total_interest' => (string) $this->total_interest,
            'outstanding_balance' => (string) $this->outstanding_balance,
            'installments_count' => $this->installments_count,
            'first_due_date' => $this->first_due_date->format('Y-m-d'),
            'maturity_date' => $this->maturity_date->format('Y-m-d'),
            'released_at' => $this->released_at?->toISOString(),
            'fully_paid_at' => $this->fully_paid_at?->toISOString(),
            'penalty_rate_percent' => (string) $this->penalty_rate_percent,
            'grace_period_days' => $this->grace_period_days,
            'penalty_basis' => $this->penalty_basis,
            'penalty_calculation' => $this->penalty_calculation,
            'payment_allocation' => $this->payment_allocation,
            'member' => $this->whenLoaded('member', fn () => [
                'id' => $this->member->id,
                'member_code' => $this->member->member_code,
                'name' => $this->member->name,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'code' => $this->product->code,
                'name' => $this->product->name,
            ]),
            'summary' => $summary,
        ];

        if ($this->staff) {
            $data['can_record'] = $this->status === 'active' && (bool) $request->user()?->can('loan.payments.record');
            $data['can_void'] = (bool) $request->user()?->can('loan.payments.void');
        }

        if (! $this->detail) {
            return $data;
        }

        $data['schedule'] = collect($snapshot['items'])->map(fn (array $item): array => [
            'number' => $item['number'],
            'due_date' => $item['due'],
            'principal' => $money($item['principal']),
            'interest' => $money($item['interest']),
            'total' => $money($item['principal'] + $item['interest']),
            'paid_principal' => $money($item['paid_principal']),
            'paid_interest' => $money($item['paid_interest']),
            'penalty_charged' => $money($item['penalty']),
            'penalty_paid' => $money($item['paid_penalty']),
            'penalty_owed' => $money(PaymentEngine::owedOf($item, 'penalty')),
            'status' => PaymentEngine::status($item, $today),
        ])->values()->all();

        $payments = $this->payments()->with('allocations')->get();

        if (! $this->staff) {
            $payments = $payments->where('status', 'posted')->values();
        }

        $data['payments'] = $payments->map(function ($p) {
            $sum = fn (string $component): string => PaymentService::money((int) $p->allocations->where('component', $component)->sum(fn ($a) => PaymentService::cents($a->amount)));

            $row = [
                'id' => $p->id,
                'receipt_no' => $p->receipt_no,
                'paid_on' => $p->paid_on->format('Y-m-d'),
                'amount' => (string) $p->amount,
                'method' => $p->method,
                'reference_no' => $p->reference_no,
                'status' => $p->status,
                'balance_after' => (string) $p->balance_after,
                'penalty_after' => (string) $p->penalty_after,
                'applied_to' => ['penalty' => $sum('penalty'), 'interest' => $sum('interest'), 'principal' => $sum('principal')],
            ];

            if ($this->staff) {
                $row += [
                    'remarks' => $p->remarks,
                    'received_by_name' => $p->received_by_name,
                    'voided_at' => $p->voided_at?->toISOString(),
                    'voided_by_name' => $p->voided_by_name,
                    'void_reason' => $p->void_reason,
                ];
            }

            return $row;
        })->all();

        return $data;
    }
}
