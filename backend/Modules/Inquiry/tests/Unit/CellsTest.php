<?php

declare(strict_types=1);

namespace Modules\Inquiry\Tests\Unit;

use DateTimeImmutable;
use Modules\Inquiry\Support\Import\Cells;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CellsTest extends TestCase
{
    #[DataProvider('moneyCases')]
    public function test_money(mixed $input, ?string $expected): void
    {
        $problems = [];

        $this->assertSame($expected, Cells::money($input, 'amount', $problems));
        $this->assertSame($expected === null, $problems !== []);
    }

    /** @return array<string,array{0:mixed,1:?string}> */
    public static function moneyCases(): array
    {
        return [
            'integer' => [1000, '1000.00'], 'rounds' => [1234.567, '1234.57'], 'commas' => ['1,234.50', '1234.50'],
            'peso sign' => ['₱ 2,000', '2000.00'], 'blank is zero' => ['', '0.00'], 'null is zero' => [null, '0.00'],
            'text' => ['abc', null], 'negative' => [-5, null], 'too large' => [1e15, null],
        ];
    }

    #[DataProvider('dateCases')]
    public function test_date(mixed $input, ?string $expected): void
    {
        $problems = [];

        $this->assertSame($expected, Cells::date($input, 'date', $problems, true));
    }

    /** @return array<string,array{0:mixed,1:?string}> */
    public static function dateCases(): array
    {
        return [
            'excel serial' => [45292, '2024-01-01'], 'serial with time' => [45292.75, '2024-01-01'],
            'iso' => ['2024-06-25', '2024-06-25'], 'month first dashes' => ['06-25-2024', '2024-06-25'],
            'slashes' => ['6/25/2024', '2024-06-25'], 'overflow' => ['13-45-2024', null],
            'feb 30' => ['2024-02-30', null], 'day first is rejected' => ['25-06-2024', null],
            'garbage' => ['yesterday', null], 'date object' => [new DateTimeImmutable('2025-03-04'), '2025-03-04'],
        ];
    }

    public function test_codes_are_uppercased_without_spaces(): void
    {
        $this->assertSame('B0092', Cells::code(' b 0092 '));
        $this->assertSame('12345', Cells::code(12345.0));
    }
}
