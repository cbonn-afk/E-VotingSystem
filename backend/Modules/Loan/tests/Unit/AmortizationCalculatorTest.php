<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Unit;

use DateTimeImmutable;
use InvalidArgumentException;
use Modules\Loan\Support\AmortizationCalculator as Calc;
use PHPUnit\Framework\TestCase;

/** Pure PHP: no database or Laravel needed. Expected figures are the standard published ones. */
final class AmortizationCalculatorTest extends TestCase
{
    private function build(string $method, string $dim, string $freq, int $months, string $principal = '100000.00', string $rate = '12', string $first = '2026-11-15'): array
    {
        return Calc::build($principal, $rate, $method, $dim, $freq, $months, new DateTimeImmutable($first));
    }

    public function test_diminishing_with_equal_installments_matches_the_standard_payment(): void
    {
        $r = $this->build('diminishing', 'equal_installment', 'monthly', 12);

        $this->assertSame(12, $r['installments_count']);
        $this->assertSame('8884.88', $r['installment_amount']);   // 100,000 at 12% a year over 12 months
        $this->assertSame('6618.53', $r['total_interest']);
        $this->assertSame('106618.53', $r['total_payable']);
        $this->assertSame('1000.00', $r['items'][0]['interest']);  // 1% of the full balance in month 1
        $this->assertSame('7884.88', $r['items'][0]['principal']);
        $this->assertSame('92115.12', $r['items'][0]['balance_after']);
        $this->assertSame('8884.85', $r['items'][11]['total']);    // the last payment absorbs the cents
        $this->assertSame('0.00', $r['items'][11]['balance_after']);
        $this->assertSame('2027-10-15', $r['maturity_date']);
    }

    public function test_diminishing_with_fixed_principal(): void
    {
        $r = $this->build('diminishing', 'fixed_principal', 'monthly', 12);

        $this->assertSame('9333.33', $r['installment_amount']);    // 8,333.33 principal + 1,000.00 interest
        $this->assertSame('6500.00', $r['total_interest']);
        $this->assertSame('8416.70', $r['items'][11]['total']);
        $this->assertSame('0.00', $r['items'][11]['balance_after']);
    }

    public function test_flat_rate_charges_interest_on_the_original_amount_for_the_whole_term(): void
    {
        $r = $this->build('flat', 'equal_installment', 'monthly', 12);

        $this->assertSame('12000.00', $r['total_interest']);
        $this->assertSame('112000.00', $r['total_payable']);
        $this->assertSame('9333.33', $r['installment_amount']);
        $this->assertSame('9333.37', $r['items'][11]['total']);
        $this->assertSame('1000.00', $r['items'][5]['interest']);
    }

    public function test_a_zero_rate_loan_is_split_evenly(): void
    {
        $r = $this->build('diminishing', 'equal_installment', 'monthly', 12, '12000.00', '0');

        $this->assertSame('0.00', $r['total_interest']);
        $this->assertSame('1000.00', $r['installment_amount']);
        $this->assertSame('1000.00', $r['items'][11]['total']);
    }

    public function test_due_dates_keep_the_month_end_anchor(): void
    {
        $r = $this->build('flat', 'equal_installment', 'monthly', 4, '12000.00', '12', '2027-01-31');

        $this->assertSame(['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30'], array_column($r['items'], 'due_date'));
    }

    public function test_twice_a_month_uses_the_15th_and_the_last_day(): void
    {
        $r = $this->build('diminishing', 'equal_installment', 'semi_monthly', 3, '50000.00', '18', '2026-11-30');

        $this->assertSame(6, $r['installments_count']);
        $this->assertSame(['2026-11-30', '2026-12-15', '2026-12-31', '2027-01-15', '2027-01-31', '2027-02-15'], array_column($r['items'], 'due_date'));
    }

    public function test_twice_a_month_rejects_a_first_date_that_is_not_the_15th_or_month_end(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->build('flat', 'equal_installment', 'semi_monthly', 3, '1000.00', '12', '2026-11-10');
    }

    public function test_weekly_loans_get_one_payment_a_week(): void
    {
        $r = $this->build('diminishing', 'equal_installment', 'weekly', 6, '30000.00', '24', '2026-11-15');

        $this->assertSame(26, $r['installments_count']);
        $this->assertSame('2026-11-15', $r['items'][0]['due_date']);
        $this->assertSame('2026-11-22', $r['items'][1]['due_date']);
        $this->assertSame('2027-05-09', $r['maturity_date']);
    }

    public function test_the_principal_always_adds_up_and_the_balance_always_ends_at_zero(): void
    {
        foreach (['monthly', 'semi_monthly', 'weekly'] as $freq) {
            foreach (['flat', 'diminishing'] as $method) {
                foreach (['equal_installment', 'fixed_principal'] as $dim) {
                    foreach ([1, 5, 12, 36] as $months) {
                        foreach (['1000.00', '33333.33', '250000.00'] as $principal) {
                            $r = $this->build($method, $dim, $freq, $months, $principal, '7.5');

                            $sum = 0;
                            foreach ($r['items'] as $item) {
                                $sum += (int) round(((float) $item['principal']) * 100);
                            }

                            $this->assertSame((int) round(((float) $principal) * 100), $sum);
                            $this->assertSame('0.00', end($r['items'])['balance_after']);
                        }
                    }
                }
            }
        }
    }

    public function test_it_suggests_a_first_due_date_one_period_later(): void
    {
        $this->assertSame('2026-02-28', Calc::suggestFirstDue('monthly', new DateTimeImmutable('2026-01-31'))->format('Y-m-d'));
        $this->assertSame('2026-11-17', Calc::suggestFirstDue('weekly', new DateTimeImmutable('2026-11-10'))->format('Y-m-d'));
        $this->assertSame('2026-11-30', Calc::suggestFirstDue('semi_monthly', new DateTimeImmutable('2026-11-10'))->format('Y-m-d'));
    }
}
