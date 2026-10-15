<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support;

use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Models\LoanBalance;
use Modules\Inquiry\Support\Import\Cells;
use Modules\Members\Models\Member;

/**
 * One member's statement: balances, loans and recent savings activity. Used by the station and the portal.
 *
 * The Members list decides WHO the member is. Imported Excel files only supply the figures, so a member
 * who is in Members but has no imported balance yet still gets a statement (empty, flagged has_statement=false).
 */
final class MemberStatement
{
    /**
     * Station lookup: a member code, or the number read from an RFID card.
     *
     * @return array{0: ?Member, 1: ?AccountBalance}|null null when nobody matches
     */
    public static function resolveScan(string $scanned): ?array
    {
        $raw = trim($scanned);
        $code = Cells::code($raw);

        if ($code === '') {
            return null;
        }

        $member = MemberDirectory::find([$code])[$code] ?? null;
        $balance = AccountBalance::query()->where('member_code', $code)->first();

        if ($member === null && $balance === null) {
            // Last resort: the number on an RFID card (stored with the balance file).
            $balance = AccountBalance::query()->whereIn('rf_id', array_unique([$raw, $code]))->first();
            $member = $balance === null ? null : (MemberDirectory::find([$balance->member_code])[strtoupper($balance->member_code)] ?? null);
        }

        return $member === null && $balance === null ? null : [$member, $balance];
    }

    /** Portal: the member comes from the signed-in session, never from the request. */
    public static function forMember(Member $member): array
    {
        $code = Cells::code($member->member_code);

        return self::build($member, AccountBalance::query()->where('member_code', $code)->first());
    }

    /** @return array<string,mixed> */
    public static function build(?Member $member, ?AccountBalance $balance): array
    {
        $code = Cells::code($member?->member_code ?? $balance?->member_code);
        $limit = max(1, (int) config('inquiry.statement_transactions', 50));
        $zero = '0.00';

        $loans = LoanBalance::query()
            ->where('member_code', $code)
            ->orderBy('loan_number')
            ->get()
            ->map(static fn (LoanBalance $loan): array => $loan->makeHidden(['id', 'member_code', 'created_at', 'updated_at'])->toArray())
            ->all();

        $transactions = AccountTransaction::query()
            ->where('member_code', $code)
            ->orderByDesc('transacted_on')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(static fn (AccountTransaction $tx): array => $tx->makeHidden(['member_code', 'created_at', 'updated_at'])->toArray())
            ->all();

        return [
            // The RFID card number is deliberately not part of the statement.
            'member' => [
                'member_code' => $member?->member_code ?? $balance?->member_code,
                'member_name' => $member?->name ?? $balance?->member_name,
                'share_capital' => $balance?->share_capital ?? $zero,
                'savings_bonus' => $balance?->savings_bonus ?? $zero,
                'regular_savings' => $balance?->regular_savings ?? $zero,
                'time_deposit' => $balance?->time_deposit ?? $zero,
                'dividend_to_share_capital' => $balance?->dividend_to_share_capital ?? $zero,
                'dividend_to_savings' => $balance?->dividend_to_savings ?? $zero,
                'as_of_date' => $balance?->as_of_date?->format('Y-m-d'),
            ],
            'has_statement' => $balance !== null,
            'loans' => $loans,
            'transactions' => $transactions,
            'idle_seconds' => (int) config('inquiry.station.idle_seconds', 30),
            'contact_note' => (string) config('inquiry.contact_note', ''),
        ];
    }
}
