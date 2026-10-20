<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Unit;

use DateTimeImmutable;
use Modules\Loan\Support\CollectionClassifier as C;
use PHPUnit\Framework\TestCase;

final class CollectionClassifierTest extends TestCase
{
    private function item(int $n, string $due, int $total, int $paid = 0): array
    {
        return ['id' => $n, 'number' => $n, 'due' => $due, 'principal' => $total - 1000, 'interest' => 1000, 'paid_principal' => max(0, $paid - 1000), 'paid_interest' => min($paid, 1000), 'penalty' => 0, 'paid_penalty' => 0, 'through' => null];
    }

    public function test_the_status_follows_the_days_past_due_thresholds(): void
    {
        $this->assertSame('current', C::classify(0, false, 30, 90));
        $this->assertSame('due', C::classify(0, true, 30, 90));
        $this->assertSame('overdue', C::classify(1, false, 30, 90));
        $this->assertSame('overdue', C::classify(29, false, 30, 90));
        $this->assertSame('delinquent', C::classify(30, false, 30, 90));
        $this->assertSame('delinquent', C::classify(89, false, 30, 90));
        $this->assertSame('default', C::classify(90, false, 30, 90));
        $this->assertSame('default', C::classify(400, false, 30, 90));
    }

    public function test_the_thresholds_are_settings(): void
    {
        $this->assertSame('delinquent', C::classify(15, false, 15, 45));
        $this->assertSame('default', C::classify(45, false, 15, 45));
        $this->assertSame('overdue', C::classify(14, false, 15, 45));
    }

    public function test_aging_buckets(): void
    {
        $this->assertSame(null, C::bucket(0));
        $this->assertSame('1-30', C::bucket(1));
        $this->assertSame('1-30', C::bucket(30));
        $this->assertSame('31-60', C::bucket(31));
        $this->assertSame('61-90', C::bucket(90));
        $this->assertSame('91+', C::bucket(91));
        $this->assertSame([31, 60], C::bucketRange('31-60'));
        $this->assertSame([91, null], C::bucketRange('91+'));
    }

    public function test_a_loan_with_nothing_due_yet_is_current(): void
    {
        $r = C::fromItems([$this->item(1, '2026-07-15', 100000)], new DateTimeImmutable('2026-06-20'), 30, 90);

        $this->assertSame('current', $r['status']);
        $this->assertSame(0, $r['days_past_due']);
        $this->assertSame(0, $r['overdue_cents']);
    }

    public function test_an_installment_due_today_makes_the_loan_due(): void
    {
        $r = C::fromItems([$this->item(1, '2026-06-20', 100000)], new DateTimeImmutable('2026-06-20'), 30, 90);

        $this->assertSame('due', $r['status']);
        $this->assertTrue($r['due_today']);
    }

    public function test_days_count_from_the_oldest_unpaid_installment(): void
    {
        $items = [$this->item(1, '2026-04-15', 100000), $this->item(2, '2026-05-15', 100000), $this->item(3, '2026-06-15', 100000), $this->item(4, '2026-07-15', 100000)];
        $r = C::fromItems($items, new DateTimeImmutable('2026-06-20'), 30, 90);

        $this->assertSame(66, $r['days_past_due']);                  // 15 Apr to 20 Jun
        $this->assertSame('delinquent', $r['status']);
        $this->assertSame(300000, $r['overdue_cents']);              // three installments are overdue
        $this->assertSame('2026-04-15', $r['oldest_due']);
    }

    public function test_paying_the_oldest_installment_moves_the_clock_to_the_next_one(): void
    {
        $items = [$this->item(1, '2026-04-15', 100000, 100000), $this->item(2, '2026-05-15', 100000), $this->item(3, '2026-06-15', 100000)];
        $r = C::fromItems($items, new DateTimeImmutable('2026-06-20'), 30, 90);

        $this->assertSame(36, $r['days_past_due']);                  // now counted from 15 May
        $this->assertSame('delinquent', $r['status']);
        $this->assertSame(200000, $r['overdue_cents']);
    }

    public function test_a_partly_paid_installment_is_still_overdue_for_the_rest(): void
    {
        $items = [$this->item(1, '2026-06-10', 100000, 40000)];
        $r = C::fromItems($items, new DateTimeImmutable('2026-06-20'), 30, 90);

        $this->assertSame(10, $r['days_past_due']);
        $this->assertSame('overdue', $r['status']);
        $this->assertSame(60000, $r['overdue_cents']);
    }

    public function test_a_fully_paid_loan_is_current(): void
    {
        $r = C::fromItems([$this->item(1, '2026-01-15', 100000, 100000), $this->item(2, '2026-02-15', 100000, 100000)], new DateTimeImmutable('2026-06-20'), 30, 90);

        $this->assertSame('current', $r['status']);
        $this->assertSame(0, $r['days_past_due']);
    }
}
