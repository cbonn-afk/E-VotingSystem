<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Inquiry\Enums\StatementType;
use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Models\ImportBatch;
use Modules\Inquiry\Models\LoanBalance;

final class SummaryController extends Controller
{
    public function show(): JsonResponse
    {
        $balances = AccountBalance::query()
            ->selectRaw('COUNT(*) AS members, COALESCE(SUM(share_capital),0) AS share_capital, COALESCE(SUM(regular_savings),0) AS regular_savings, COALESCE(SUM(savings_bonus),0) AS savings_bonus, COALESCE(SUM(time_deposit),0) AS time_deposit, MAX(as_of_date) AS as_of_date')
            ->first();

        $loans = LoanBalance::query()
            ->selectRaw('COUNT(*) AS loans, COUNT(DISTINCT member_code) AS borrowers, COALESCE(SUM(principal_balance),0) AS principal_balance, COALESCE(SUM(interest_balance),0) AS interest_balance')
            ->first();

        $transactions = AccountTransaction::query()
            ->selectRaw('COUNT(*) AS transactions, MAX(transacted_on) AS latest_date')
            ->first();

        $lastImports = [];

        foreach (StatementType::cases() as $type) {
            $batch = ImportBatch::query()->with('importer:id,name')->where('type', $type->value)->latest('id')->first();

            $lastImports[$type->value] = $batch === null ? null : [
                'file_name' => $batch->file_name,
                'row_count' => $batch->row_count,
                'as_of_date' => $batch->as_of_date?->format('Y-m-d'),
                'imported_by' => $batch->importer?->name,
                'imported_at' => $batch->created_at?->toISOString(),
            ];
        }

        $money = static fn (mixed $v): string => number_format((float) $v, 2, '.', '');

        return response()->json(['data' => [
            'balances' => [
                'members' => (int) $balances->members,
                'share_capital' => $money($balances->share_capital),
                'savings' => $money((float) $balances->regular_savings + (float) $balances->savings_bonus + (float) $balances->time_deposit),
                'as_of_date' => $balances->as_of_date ? substr((string) $balances->as_of_date, 0, 10) : null,
            ],
            'transactions' => [
                'count' => (int) $transactions->transactions,
                'latest_date' => $transactions->latest_date ? substr((string) $transactions->latest_date, 0, 10) : null,
            ],
            'loans' => [
                'count' => (int) $loans->loans,
                'borrowers' => (int) $loans->borrowers,
                'principal_balance' => $money($loans->principal_balance),
                'interest_balance' => $money($loans->interest_balance),
            ],
            'last_imports' => $lastImports,
        ]]);
    }
}
