<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;

/**
 * The money rules for collecting a loan. Pure PHP and whole centavos, so it is easy to test.
 *
 * An installment is an array: id, number, due (Y-m-d), principal, interest, paid_principal, paid_interest,
 * penalty (accrued so far), paid_penalty, through (date penalties were last accrued to, or null). All money in centavos.
 *
 * A rule is an array: rate (percent per month), grace (days), basis (installment | principal_balance),
 * calculation (see PenaltyCalculator), order (penalty_interest_principal | interest_penalty_principal).
 */
final class PaymentEngine
{
    /**
     * Adds the penalty that has built up on late installments, up to $asOf.
     * Penalties are accrued before every payment, so the unpaid amount is constant between accruals.
     *
     * @param list<array<string,mixed>> $items
     * @param array<string,mixed> $rule
     * @return list<array<string,mixed>>
     */
    public static function accrue(array $items, array $rule, DateTimeImmutable $asOf): array
    {
        foreach ($items as $i => $item) {
            $due = new DateTimeImmutable($item['due']);
            $unpaidPrincipal = $item['principal'] - $item['paid_principal'];
            $unpaidTotal = $unpaidPrincipal + $item['interest'] - $item['paid_interest'];

            if ($unpaidTotal <= 0 || $asOf <= $due || $rule['rate'] <= 0) {
                continue;
            }

            $base = $rule['basis'] === 'principal_balance' ? $unpaidPrincipal : $unpaidTotal;
            $now = PenaltyCalculator::units($rule['calculation'], $due, $asOf, $rule['grace']);
            $then = $item['through'] === null
                ? 0.0
                : PenaltyCalculator::units($rule['calculation'], $due, new DateTimeImmutable($item['through']), $rule['grace']);

            $items[$i]['penalty'] += max(0, (int) round($base * $rule['rate'] / 100 * ($now - $then)));
            $items[$i]['through'] = $asOf->format('Y-m-d');
        }

        return $items;
    }

    /**
     * Applies a payment to the oldest installments first. Within an installment the rule's order decides
     * what is paid first. Returns the updated installments and what each centavo went to.
     *
     * @param list<array<string,mixed>> $items
     * @return array{items:list<array<string,mixed>>, allocations:list<array{item_id:int,component:string,amount:int}>, remaining:int}
     */
    public static function allocate(array $items, int $amount, string $order): array
    {
        $components = $order === 'interest_penalty_principal'
            ? ['interest', 'penalty', 'principal']
            : ['penalty', 'interest', 'principal'];

        usort($items, static fn (array $a, array $b): int => $a['number'] <=> $b['number']);

        $allocations = [];
        $remaining = $amount;

        foreach ($items as $i => $item) {
            foreach ($components as $component) {
                if ($remaining <= 0) {
                    break 2;
                }

                $owed = self::owedOf($item, $component);
                $pay = min($remaining, $owed);

                if ($pay <= 0) {
                    continue;
                }

                $items[$i]['paid_'.$component] += $pay;
                $item = $items[$i];
                $remaining -= $pay;
                $allocations[] = ['item_id' => $item['id'], 'component' => $component, 'amount' => $pay];
            }
        }

        return ['items' => $items, 'allocations' => $allocations, 'remaining' => $remaining];
    }

    /** Everything still owed: unpaid principal and interest plus accrued penalties. */
    public static function payoff(array $items): int
    {
        return array_sum(array_map(static fn (array $i): int => self::owedOf($i, 'principal') + self::owedOf($i, 'interest') + self::owedOf($i, 'penalty'), $items));
    }

    /** Unpaid principal and interest only. */
    public static function outstanding(array $items): int
    {
        return array_sum(array_map(static fn (array $i): int => self::owedOf($i, 'principal') + self::owedOf($i, 'interest'), $items));
    }

    /**
     * What the borrower owes as of a date: amount due now, the next installment, and the payoff.
     * Does not change the installments passed in.
     *
     * @param list<array<string,mixed>> $items
     * @param array<string,mixed> $rule
     * @return array{items:list<array<string,mixed>>, due_now:int, penalty_owed:int, payoff:int, outstanding:int, overdue_count:int, next_due:?array{number:int,due:string,amount:int}}
     */
    public static function snapshot(array $items, array $rule, DateTimeImmutable $asOf): array
    {
        usort($items, static fn (array $a, array $b): int => $a['number'] <=> $b['number']);
        $accrued = self::accrue($items, $rule, $asOf);
        $today = $asOf->format('Y-m-d');

        $dueNow = 0;
        $penalty = 0;
        $overdue = 0;
        $next = null;

        foreach ($accrued as $item) {
            $unpaid = self::owedOf($item, 'principal') + self::owedOf($item, 'interest');
            $penalty += self::owedOf($item, 'penalty');

            if ($unpaid > 0 && $item['due'] <= $today) {
                $dueNow += $unpaid;
                $overdue += $item['due'] < $today ? 1 : 0;
            } elseif ($unpaid > 0 && $next === null) {
                $next = ['number' => $item['number'], 'due' => $item['due'], 'amount' => $unpaid];
            }
        }

        return [
            'items' => $accrued,
            'due_now' => $dueNow + $penalty,
            'penalty_owed' => $penalty,
            'payoff' => self::payoff($accrued),
            'outstanding' => self::outstanding($accrued),
            'overdue_count' => $overdue,
            'next_due' => $next,
        ];
    }

    /** paid | partial | overdue | due | upcoming, for display. */
    public static function status(array $item, DateTimeImmutable $asOf): string
    {
        $unpaid = self::owedOf($item, 'principal') + self::owedOf($item, 'interest') + self::owedOf($item, 'penalty');

        if ($unpaid <= 0) {
            return 'paid';
        }

        $today = $asOf->format('Y-m-d');

        if ($item['due'] < $today) {
            return 'overdue';
        }

        if ($item['due'] === $today) {
            return 'due';
        }

        return $item['paid_principal'] + $item['paid_interest'] > 0 ? 'partial' : 'upcoming';
    }

    public static function owedOf(array $item, string $component): int
    {
        return max(0, $item[$component] - $item['paid_'.$component]);
    }
}
