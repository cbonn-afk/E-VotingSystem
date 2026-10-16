<?php

declare(strict_types=1);

namespace Modules\Inquiry\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\IdentityAccess\Models\User;
use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Models\ImportBatch;
use Modules\Inquiry\Models\LoanBalance;
use Modules\Members\Models\Member;

/**
 * Sample statements for every active member: balances, savings/share-capital/time-deposit movements
 * and a few loans, plus the import history staff would normally build from the Excel files.
 *
 * Balances are computed from the transactions, so a member's statement always adds up.
 * Skipped when balances already exist, so real imported data is never mixed with samples.
 */
final class InquiryStatementSeeder extends Seeder
{
    /** Members that get a loan row, with the loan product name shown on the statement. */
    private const LOANS = [
        'M-0002' => ['EML', 'Emergency Loan', 8000, 12, 5],
        'M-0005' => ['SAL', 'Salary Loan', 30000, 12, 3],
        'M-0006' => ['BUS', 'Business Loan', 100000, 24, 4],
        'M-0011' => ['AGR', 'Agricultural Production Loan', 60000, 12, 1],
        'M-0014' => ['SAL', 'Salary Loan', 20000, 10, 6],
        'M-0016' => ['EDU', 'Educational Loan', 35000, 10, 2],
        'M-0020' => ['BUS', 'Business Loan', 150000, 36, 8],
    ];

    public function run(): void
    {
        if (AccountBalance::query()->exists()) {
            return;
        }

        $members = Member::query()->where('status', 'active')->orderBy('member_code')->get();

        if ($members->isEmpty()) {
            $this->command?->warn('Inquiry statements skipped: run MembersDatabaseSeeder first.');

            return;
        }

        mt_srand(20261016);

        $asOf = Carbon::today()->startOfMonth()->subDay(); // last day of the previous month
        $importer = User::query()->role('Inquiry Officer')->orderBy('id')->first() ?? User::query()->orderBy('id')->first();

        $balances = [];
        $transactions = [];
        $loans = [];

        foreach ($members as $i => $member) {
            $code = strtoupper($member->member_code);
            $balance = ['RS' => 0.0, 'TD' => 0.0, 'SC' => 0.0];

            // Share capital builds up in regular installments; savings move up and down; a time deposit is placed once for some.
            $plan = [['SC', 'D', mt_rand(8, 20) * 250.0]];

            for ($n = 0; $n < mt_rand(3, 5); $n++) {
                $plan[] = ['SC', 'D', mt_rand(2, 8) * 250.0];
            }
            for ($n = 0; $n < mt_rand(4, 8); $n++) {
                $plan[] = ['RS', 'D', mt_rand(4, 40) * 250.0];
                if (mt_rand(1, 100) <= 30) {
                    $plan[] = ['RS', 'W', mt_rand(1, 10) * 250.0];
                }
            }
            if ($i % 3 === 0) {
                $plan[] = ['TD', 'D', mt_rand(20, 100) * 1000.0];
            }

            // Spread the movements over the last 12 months, oldest first.
            $dates = [];
            foreach ($plan as $_) {
                $dates[] = $asOf->copy()->subDays(mt_rand(0, 360));
            }
            sort($dates);

            foreach ($plan as $k => [$type, $mode, $amount]) {
                if ($mode === 'W' && $amount > $balance[$type]) {
                    $mode = 'D'; // never overdraw
                }

                $balance[$type] += $mode === 'D' ? $amount : -$amount;

                $transactions[] = [
                    'member_code' => $code,
                    'account_type' => $type,
                    'mode' => $mode,
                    'amount' => number_format($amount, 2, '.', ''),
                    'running_balance' => number_format($balance[$type], 2, '.', ''),
                    'transacted_on' => $dates[$k]->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $balances[] = [
                'member_code' => $code,
                'rf_id' => $i < 12 ? sprintf('04A2%08d', 100000 + $i * 37) : null, // the first dozen members have a card
                'member_name' => $member->name,
                'share_capital' => number_format($balance['SC'], 2, '.', ''),
                'savings_bonus' => number_format(mt_rand(0, 8) * 125.0, 2, '.', ''),
                'regular_savings' => number_format($balance['RS'], 2, '.', ''),
                'time_deposit' => number_format($balance['TD'], 2, '.', ''),
                'dividend_to_share_capital' => number_format($balance['SC'] * 0.06, 2, '.', ''),
                'dividend_to_savings' => number_format($balance['RS'] * 0.02, 2, '.', ''),
                'as_of_date' => $asOf->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (isset(self::LOANS[$member->member_code])) {
                $loans[] = $this->loan($code, self::LOANS[$member->member_code], $asOf);
            }
        }

        DB::transaction(function () use ($balances, $transactions, $loans, $asOf, $importer): void {
            foreach (array_chunk($balances, 200) as $chunk) {
                AccountBalance::query()->insert($chunk);
            }
            foreach (array_chunk($transactions, 200) as $chunk) {
                AccountTransaction::query()->insert($chunk);
            }
            foreach (array_chunk($loans, 200) as $chunk) {
                LoanBalance::query()->insert($chunk);
            }

            foreach ([
                ['balances', 'balances-' . $asOf->format('Y-m') . '.xlsx', count($balances)],
                ['transactions', 'savings-transactions-' . $asOf->format('Y-m') . '.xlsx', count($transactions)],
                ['loans', 'loan-balances-' . $asOf->format('Y-m') . '.xlsx', count($loans)],
            ] as [$type, $file, $rows]) {
                ImportBatch::query()->create([
                    'type' => $type,
                    'file_name' => $file,
                    'row_count' => $rows,
                    'as_of_date' => $asOf->toDateString(),
                    'imported_by' => $importer?->id,
                ]);
            }
        });
    }

    /**
     * One loan row: principal paid grows with the months elapsed, interest is a simple annual rate on the principal.
     *
     * @param  array{0:string,1:string,2:int,3:int,4:int}  $spec  code, type, principal, term months, months already paid
     * @return array<string, mixed>
     */
    private function loan(string $memberCode, array $spec, Carbon $asOf): array
    {
        [$code, $type, $principal, $term, $paidMonths] = $spec;

        $interest = round($principal * 0.12 * $term / 12, 2);
        $principalPaid = round($principal * $paidMonths / $term, 2);
        $interestPaid = round($interest * $paidMonths / $term, 2);
        $released = $asOf->copy()->subMonths($paidMonths)->startOfMonth()->addDays(14);

        return [
            'member_code' => $memberCode,
            'loan_code' => $code,
            'loan_number' => sprintf('%s-%s-%04d', $code, $released->format('y'), abs(crc32($memberCode . $code)) % 10000),
            'loan_type' => $type,
            'principal' => number_format($principal, 2, '.', ''),
            'interest' => number_format($interest, 2, '.', ''),
            'principal_paid' => number_format($principalPaid, 2, '.', ''),
            'interest_paid' => number_format($interestPaid, 2, '.', ''),
            'principal_balance' => number_format($principal - $principalPaid, 2, '.', ''),
            'interest_balance' => number_format($interest - $interestPaid, 2, '.', ''),
            'released_on' => $released->toDateString(),
            'start_on' => $released->copy()->addMonth()->toDateString(),
            'maturity_on' => $released->copy()->addMonths($term)->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
