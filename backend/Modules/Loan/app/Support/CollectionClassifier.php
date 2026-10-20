<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use DateTimeImmutable;

/**
 * Labels a loan by how late it is. Pure PHP, so the rules are easy to test.
 *
 * Days past due counts from the due date of the OLDEST unpaid installment:
 *   current     nothing is overdue and nothing is due today
 *   due         an installment is due today
 *   overdue     1 day late, up to (delinquent_after - 1)
 *   delinquent  delinquent_after days late or more, below default_after
 *   default     default_after days late or more
 */
final class CollectionClassifier
{
    public const STATUSES = ['current', 'due', 'overdue', 'delinquent', 'default'];

    /** Standard aging buckets, by days past due. */
    public const BUCKETS = ['1-30', '31-60', '61-90', '91+'];

    public static function classify(int $daysPastDue, bool $dueToday, int $delinquentAfter, int $defaultAfter): string
    {
        if ($daysPastDue >= $defaultAfter) {
            return 'default';
        }

        if ($daysPastDue >= $delinquentAfter) {
            return 'delinquent';
        }

        if ($daysPastDue > 0) {
            return 'overdue';
        }

        return $dueToday ? 'due' : 'current';
    }

    public static function bucket(int $daysPastDue): ?string
    {
        return match (true) {
            $daysPastDue <= 0 => null,
            $daysPastDue <= 30 => '1-30',
            $daysPastDue <= 60 => '31-60',
            $daysPastDue <= 90 => '61-90',
            default => '91+',
        };
    }

    /** [min, max] days past due for a bucket; max is null for the open-ended one. */
    public static function bucketRange(string $bucket): array
    {
        return match ($bucket) {
            '1-30' => [1, 30],
            '31-60' => [31, 60],
            '61-90' => [61, 90],
            default => [91, null],
        };
    }

    /**
     * Where a loan stands on a date, from its installments (PaymentEngine item arrays, money in centavos).
     *
     * @param list<array<string,mixed>> $items
     * @return array{status:string, days_past_due:int, overdue_cents:int, oldest_due:?string, due_today:bool}
     */
    public static function fromItems(array $items, DateTimeImmutable $asOf, int $delinquentAfter, int $defaultAfter): array
    {
        usort($items, static fn (array $a, array $b): int => $a['number'] <=> $b['number']);

        $today = $asOf->format('Y-m-d');
        $overdue = 0;
        $oldest = null;
        $dueToday = false;

        foreach ($items as $item) {
            $unpaid = ($item['principal'] - $item['paid_principal']) + ($item['interest'] - $item['paid_interest']);

            if ($unpaid <= 0) {
                continue;
            }

            if ($item['due'] < $today) {
                $overdue += $unpaid;
                $oldest ??= $item['due'];
            } elseif ($item['due'] === $today) {
                $dueToday = true;
            }
        }

        $days = $oldest === null ? 0 : (int) (new DateTimeImmutable($oldest))->diff($asOf)->days;

        return [
            'status' => self::classify($days, $dueToday, $delinquentAfter, $defaultAfter),
            'days_past_due' => $days,
            'overdue_cents' => $overdue,
            'oldest_due' => $oldest,
            'due_today' => $dueToday,
        ];
    }
}
