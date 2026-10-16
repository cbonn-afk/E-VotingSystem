<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Builds a repayment schedule. Pure PHP, whole centavos only, so no rounding drift:
 * the last installment absorbs any leftover centavos and the balance always ends at exactly zero.
 *
 * Interest methods
 *  - flat: interest is charged on the original amount for the whole term, split evenly.
 *  - diminishing + equal_installment: every payment is the same; interest shrinks as the balance falls.
 *  - diminishing + fixed_principal: principal is split evenly; payments shrink as interest falls.
 */
final class AmortizationCalculator
{
    public const FREQUENCIES = ['weekly' => 52, 'semi_monthly' => 24, 'monthly' => 12];

    /**
     * @return array{installments_count:int, installment_amount:string, total_interest:string, total_payable:string, maturity_date:string, items:list<array{number:int,due_date:string,principal:string,interest:string,total:string,balance_after:string}>}
     */
    public static function build(
        string $principal,
        string $annualRatePercent,
        string $interestMethod,
        string $diminishingMethod,
        string $frequency,
        int $termMonths,
        DateTimeImmutable $firstDue,
    ): array {
        if (! isset(self::FREQUENCIES[$frequency])) {
            throw new InvalidArgumentException("Unknown payment frequency: {$frequency}.");
        }
        if ($termMonths < 1) {
            throw new InvalidArgumentException('The term must be at least one month.');
        }

        $periodsPerYear = self::FREQUENCIES[$frequency];
        $count = self::installmentCount($frequency, $termMonths);
        $principalCents = self::toCents($principal);
        $dates = self::dueDates($frequency, $count, $firstDue);

        $rows = $interestMethod === 'flat'
            ? self::flat($principalCents, (float) $annualRatePercent, $termMonths, $count)
            : self::diminishing($principalCents, (float) $annualRatePercent / 100 / $periodsPerYear, $count, $diminishingMethod);

        $items = [];
        $balance = $principalCents;
        $totalInterest = 0;

        foreach ($rows as $i => [$principalPart, $interestPart]) {
            $balance -= $principalPart;
            $totalInterest += $interestPart;
            $items[] = [
                'number' => $i + 1,
                'due_date' => $dates[$i]->format('Y-m-d'),
                'principal' => self::fromCents($principalPart),
                'interest' => self::fromCents($interestPart),
                'total' => self::fromCents($principalPart + $interestPart),
                'balance_after' => self::fromCents($balance),
            ];
        }

        return [
            'installments_count' => $count,
            'installment_amount' => $items[0]['total'],
            'total_interest' => self::fromCents($totalInterest),
            'total_payable' => self::fromCents($principalCents + $totalInterest),
            'maturity_date' => $items[$count - 1]['due_date'],
            'items' => $items,
        ];
    }

    public static function installmentCount(string $frequency, int $termMonths): int
    {
        return match ($frequency) {
            'weekly' => (int) round($termMonths * 52 / 12),
            'semi_monthly' => $termMonths * 2,
            default => $termMonths,
        };
    }

    /** A sensible first due date for a loan released on $from: one period later. */
    public static function suggestFirstDue(string $frequency, DateTimeImmutable $from): DateTimeImmutable
    {
        return match ($frequency) {
            'weekly' => $from->modify('+7 days'),
            'semi_monthly' => self::nextSemiMonthly($from->modify('+7 days')),
            default => self::addMonths($from, 1),
        };
    }

    /** The first 15th or last day of the month that falls on or after $date. */
    public static function nextSemiMonthly(DateTimeImmutable $date): DateTimeImmutable
    {
        $day = (int) $date->format('j');
        $last = (int) $date->format('t');

        if ($day <= 15) {
            return $date->setDate((int) $date->format('Y'), (int) $date->format('n'), 15);
        }

        return $date->setDate((int) $date->format('Y'), (int) $date->format('n'), $last);
    }

    public static function isSemiMonthlyDate(DateTimeImmutable $date): bool
    {
        $day = (int) $date->format('j');

        return $day === 15 || $day === (int) $date->format('t');
    }

    /** @return list<array{0:int,1:int}> [principal, interest] per installment, in centavos */
    private static function flat(int $principal, float $annualRate, int $termMonths, int $count): array
    {
        $interest = (int) round($principal * $annualRate / 100 * $termMonths / 12);

        return self::evenSplit($principal, $interest, $count);
    }

    /** @return list<array{0:int,1:int}> */
    private static function diminishing(int $principal, float $periodRate, int $count, string $method): array
    {
        $rows = [];
        $balance = $principal;
        $even = intdiv($principal, $count);

        $payment = $periodRate > 0
            ? (int) round($principal * $periodRate / (1 - (1 + $periodRate) ** -$count))
            : $even;

        for ($i = 0; $i < $count; $i++) {
            $interest = (int) round($balance * $periodRate);
            $isLast = $i === $count - 1;

            if ($isLast) {
                $part = $balance;
            } elseif ($method === 'fixed_principal') {
                $part = $even;
            } else {
                $part = min($payment - $interest, $balance);
            }

            $rows[] = [$part, $interest];
            $balance -= $part;
        }

        return $rows;
    }

    /** @return list<array{0:int,1:int}> */
    private static function evenSplit(int $principal, int $interest, int $count): array
    {
        $rows = [];
        $principalEach = intdiv($principal, $count);
        $interestEach = intdiv($interest, $count);

        for ($i = 0; $i < $count; $i++) {
            $isLast = $i === $count - 1;
            $rows[] = [
                $isLast ? $principal - $principalEach * ($count - 1) : $principalEach,
                $isLast ? $interest - $interestEach * ($count - 1) : $interestEach,
            ];
        }

        return $rows;
    }

    /** @return list<DateTimeImmutable> */
    private static function dueDates(string $frequency, int $count, DateTimeImmutable $first): array
    {
        $dates = [$first];

        if ($frequency === 'semi_monthly' && ! self::isSemiMonthlyDate($first)) {
            throw new InvalidArgumentException('Twice-a-month loans must start on the 15th or the last day of a month.');
        }

        for ($i = 1; $i < $count; $i++) {
            $previous = $dates[$i - 1];

            $dates[] = match ($frequency) {
                'weekly' => $first->modify('+'.(7 * $i).' days'),
                'semi_monthly' => (int) $previous->format('j') === 15
                    ? $previous->setDate((int) $previous->format('Y'), (int) $previous->format('n'), (int) $previous->format('t'))
                    : self::addMonths($previous->setDate((int) $previous->format('Y'), (int) $previous->format('n'), 1), 1)->setDate(
                        (int) self::addMonths($previous->setDate((int) $previous->format('Y'), (int) $previous->format('n'), 1), 1)->format('Y'),
                        (int) self::addMonths($previous->setDate((int) $previous->format('Y'), (int) $previous->format('n'), 1), 1)->format('n'),
                        15,
                    ),
                default => self::addMonths($first, $i), // anchored on the first date, so Jan 31 gives Feb 28, then Mar 31
            };
        }

        return $dates;
    }

    /** Adds months without overflowing into the next one (31 Jan + 1 month = 28/29 Feb). */
    private static function addMonths(DateTimeImmutable $date, int $months): DateTimeImmutable
    {
        $year = (int) $date->format('Y');
        $month = (int) $date->format('n') - 1 + $months;
        $year += intdiv($month, 12);
        $month = $month % 12 + 1;

        $first = $date->setDate($year, $month, 1);
        $day = min((int) $date->format('j'), (int) $first->format('t'));

        return $first->setDate($year, $month, $day);
    }

    private static function toCents(string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    private static function fromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
