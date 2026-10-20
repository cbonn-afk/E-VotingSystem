<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Unit;

use DateTimeImmutable;
use Modules\Loan\Support\PaymentEngine as E;
use Modules\Loan\Support\PenaltyCalculator as P;
use PHPUnit\Framework\TestCase;

/** Pure PHP: the penalty and payment rules, in whole centavos. */
final class PaymentEngineTest extends TestCase
{
    private const RULE = ['rate' => 2.0, 'grace' => 0, 'basis' => 'installment', 'calculation' => 'per_month_or_fraction', 'order' => 'penalty_interest_principal'];

    private function item(int $n, string $due, int $principal, int $interest): array
    {
        return ['id' => $n, 'number' => $n, 'due' => $due, 'principal' => $principal, 'interest' => $interest, 'paid_principal' => 0, 'paid_interest' => 0, 'penalty' => 0, 'paid_penalty' => 0, 'through' => null];
    }

    private function late(string $asOf, array $rule = self::RULE): int
    {
        // one installment of 8,884.88 (7,884.88 principal + 1,000.00 interest), due 15 Jan 2026
        return E::snapshot([$this->item(1, '2026-01-15', 788488, 100000)], $rule, new DateTimeImmutable($asOf))['penalty_owed'];
    }

    public function test_no_penalty_on_or_before_the_due_date(): void
    {
        $this->assertSame(0, $this->late('2026-01-14'));
        $this->assertSame(0, $this->late('2026-01-15'));
    }

    public function test_one_calendar_month_or_part_of_a_month_is_one_month(): void
    {
        $oneMonth = (int) round(888488 * 0.02);

        $this->assertSame($oneMonth, $this->late('2026-01-16'));
        $this->assertSame($oneMonth, $this->late('2026-02-15'));   // exactly one month late
        $this->assertSame($oneMonth * 2, $this->late('2026-02-16'));
        $this->assertSame($oneMonth * 2, $this->late('2026-03-15'));
        $this->assertSame((int) round(888488 * 0.02 * 3), $this->late('2026-03-16'));
    }

    public function test_the_grace_period_delays_the_penalty_but_then_counts_from_the_due_date(): void
    {
        $rule = ['grace' => 5] + self::RULE;

        $this->assertSame(0, $this->late('2026-01-20', $rule));
        $this->assertSame((int) round(888488 * 0.02), $this->late('2026-01-21', $rule));
    }

    public function test_daily_proration_charges_a_thirtieth_of_a_month_per_day(): void
    {
        $rule = ['calculation' => 'daily_prorated'] + self::RULE;

        $this->assertSame((int) round(888488 * 0.02 * 0.5), $this->late('2026-01-30', $rule));   // 15 days
    }

    public function test_the_penalty_basis_can_be_the_overdue_principal_only(): void
    {
        $rule = ['basis' => 'principal_balance'] + self::RULE;

        $this->assertSame((int) round(788488 * 0.02), $this->late('2026-01-16', $rule));
    }

    public function test_a_zero_rate_never_charges_a_penalty(): void
    {
        $this->assertSame(0, $this->late('2026-12-31', ['rate' => 0.0] + self::RULE));
    }

    public function test_accruing_twice_on_the_same_day_does_not_charge_twice(): void
    {
        $items = [$this->item(1, '2026-01-15', 788488, 100000)];
        $once = E::accrue($items, self::RULE, new DateTimeImmutable('2026-02-20'));
        $twice = E::accrue($once, self::RULE, new DateTimeImmutable('2026-02-20'));

        $this->assertSame($once[0]['penalty'], $twice[0]['penalty']);
    }

    public function test_a_payment_pays_penalty_then_interest_then_principal_oldest_first(): void
    {
        $items = E::accrue([$this->item(1, '2026-01-15', 788488, 100000), $this->item(2, '2026-02-15', 796373, 92515)], self::RULE, new DateTimeImmutable('2026-02-20'));
        $result = E::allocate($items, 50000, 'penalty_interest_principal');

        $this->assertSame([['item_id' => 1, 'component' => 'penalty', 'amount' => 35540], ['item_id' => 1, 'component' => 'interest', 'amount' => 14460]], $result['allocations']);
        $this->assertSame(0, $result['remaining']);
    }

    public function test_the_payment_order_is_a_setting(): void
    {
        $items = E::accrue([$this->item(1, '2026-01-15', 788488, 100000)], self::RULE, new DateTimeImmutable('2026-02-20'));
        $result = E::allocate($items, 50000, 'interest_penalty_principal');

        $this->assertSame([['item_id' => 1, 'component' => 'interest', 'amount' => 50000]], $result['allocations']);
    }

    public function test_paying_ahead_settles_the_next_installments_in_order(): void
    {
        $items = [$this->item(1, '2026-03-15', 100000, 10000), $this->item(2, '2026-04-15', 100000, 8000)];
        $result = E::allocate($items, 120000, 'penalty_interest_principal');

        $this->assertSame(0, E::owedOf($result['items'][0], 'principal') + E::owedOf($result['items'][0], 'interest'));
        $this->assertSame(98000, E::owedOf($result['items'][1], 'principal') + E::owedOf($result['items'][1], 'interest') - 0);
    }

    public function test_the_snapshot_reports_what_is_due_now_and_the_next_installment(): void
    {
        $items = [$this->item(1, '2026-01-15', 788488, 100000), $this->item(2, '2026-02-15', 796373, 92515), $this->item(3, '2026-03-15', 804336, 84552)];
        $snapshot = E::snapshot($items, self::RULE, new DateTimeImmutable('2026-02-20'));

        $this->assertSame(2, $snapshot['overdue_count']);
        $this->assertSame(['number' => 3, 'due' => '2026-03-15', 'amount' => 888888], $snapshot['next_due']);
        $this->assertSame(888488 + 888888 + $snapshot['penalty_owed'], $snapshot['due_now']);
    }

    public function test_paying_the_exact_payoff_clears_the_loan(): void
    {
        $items = E::accrue([$this->item(1, '2026-01-15', 788488, 100000), $this->item(2, '2026-02-15', 796373, 92515)], self::RULE, new DateTimeImmutable('2026-03-01'));
        $result = E::allocate($items, E::payoff($items), 'penalty_interest_principal');

        $this->assertSame(0, E::payoff($result['items']));
        $this->assertSame(0, E::outstanding($result['items']));
    }

    public function test_item_status_for_display(): void
    {
        $item = $this->item(1, '2026-01-15', 788488, 100000);

        $this->assertSame('upcoming', E::status($item, new DateTimeImmutable('2026-01-14')));
        $this->assertSame('due', E::status($item, new DateTimeImmutable('2026-01-15')));
        $this->assertSame('overdue', E::status($item, new DateTimeImmutable('2026-01-16')));
        $this->assertSame('paid', E::status(['paid_principal' => 788488, 'paid_interest' => 100000] + $item, new DateTimeImmutable('2026-01-16')));
    }

    public function test_random_payment_sequences_never_create_or_lose_money(): void
    {
        mt_srand(7);

        for ($run = 0; $run < 200; $run++) {
            $items = [];
            $start = new DateTimeImmutable('2026-01-15');

            for ($k = 1; $k <= mt_rand(2, 8); $k++) {
                $items[] = $this->item($k, $start->modify('+'.($k - 1).' months')->format('Y-m-d'), mt_rand(50000, 900000), mt_rand(1000, 90000));
            }

            $rule = ['rate' => [0, 2.0, 3.5][mt_rand(0, 2)], 'grace' => mt_rand(0, 7), 'basis' => ['installment', 'principal_balance'][mt_rand(0, 1)], 'calculation' => P::CALCULATIONS[mt_rand(0, 1)], 'order' => ['penalty_interest_principal', 'interest_penalty_principal'][mt_rand(0, 1)]];
            $date = $start->modify('+'.mt_rand(0, 20).' days');

            for ($payment = 0; $payment < 6; $payment++) {
                $items = E::accrue($items, $rule, $date);
                $payoff = E::payoff($items);

                if ($payoff <= 0) {
                    break;
                }

                $amount = mt_rand(1, $payoff);
                $result = E::allocate($items, $amount, $rule['order']);

                $this->assertSame($amount, array_sum(array_column($result['allocations'], 'amount')));
                $this->assertSame($payoff - $amount, E::payoff($result['items']));

                foreach ($result['items'] as $item) {
                    foreach (['principal', 'interest', 'penalty'] as $component) {
                        $this->assertTrue($item['paid_'.$component] >= 0 && $item['paid_'.$component] <= $item[$component]);
                    }
                }

                $items = $result['items'];
                $date = $date->modify('+'.mt_rand(0, 45).' days');
            }
        }
    }
}
