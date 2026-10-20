<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;

/**
 * Late-payment penalty rule. A penalty rate is "percent per month".
 *
 *  - per_month_or_fraction: every calendar month or part of a month late counts as one month.
 *    Due 15 Jan: paid 15 Feb = 1 month; paid 16 Feb = 2 months.
 *  - daily_prorated: each day late counts as 1/30 of a month.
 *
 * Nothing is charged until the grace period has passed; once it has, the penalty counts from the due date.
 */
final class PenaltyCalculator
{
    public const CALCULATIONS = ['per_month_or_fraction', 'daily_prorated'];

    /** Penalty "units" (months) owed on an installment that fell due on $due, as of $asOf. */
    public static function units(string $calculation, DateTimeImmutable $due, DateTimeImmutable $asOf, int $graceDays): float
    {
        $daysLate = (int) $due->diff($asOf)->format('%r%a');

        if ($daysLate <= 0 || $daysLate <= $graceDays) {
            return 0.0;
        }

        if ($calculation === 'daily_prorated') {
            return $daysLate / 30;
        }

        $months = 0;

        while (self::addMonths($due, $months + 1) <= $asOf) {
            $months++;
        }

        return (float) ($asOf > self::addMonths($due, $months) ? $months + 1 : $months);
    }

    /** Adds months without overflowing into the next one (31 Jan + 1 month = 28 Feb). */
    public static function addMonths(DateTimeImmutable $date, int $months): DateTimeImmutable
    {
        $year = (int) $date->format('Y');
        $month = (int) $date->format('n') - 1 + $months;
        $year += intdiv($month, 12);
        $month = $month % 12 + 1;

        $first = $date->setDate($year, $month, 1);

        return $first->setDate($year, $month, min((int) $date->format('j'), (int) $first->format('t')));
    }
}
