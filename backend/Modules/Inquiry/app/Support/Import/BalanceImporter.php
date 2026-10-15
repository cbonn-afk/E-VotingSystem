<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support\Import;

use Modules\Inquiry\Enums\StatementType;

/**
 * A rf_id (optional) | B member code | C member name | D share capital | E savings bonus |
 * F regular savings | G dividend credited to share capital | H dividend credited to savings |
 * I as-of date | J time deposit (optional)
 *
 * Columns A-I are in the same order as the old system's account balance file.
 */
final class BalanceImporter extends StatementImporter
{
    public function type(): StatementType
    {
        return StatementType::Balances;
    }

    public function headings(): array
    {
        return [
            'rf_id', 'member_code', 'member_name', 'share_capital', 'savings_bonus', 'regular_savings',
            'dividend_to_share_capital', 'dividend_to_savings', 'as_of_date', 'time_deposit',
        ];
    }

    public function sample(): array
    {
        return ['0012345678', 'B0092', 'JUAN DELA CRUZ', '1000.00', '250.00', '6000.00', '120.00', '280.00', '2026-09-30', '0.00'];
    }

    public function parseRow(array $cells): array
    {
        $problems = [];
        $code = Cells::code($cells[1] ?? null);
        $name = Cells::text($cells[2] ?? null);
        $rfId = Cells::text($cells[0] ?? null);

        if ($code === '') {
            $problems[] = 'member_code is required';
        }

        if ($name === '') {
            $problems[] = 'member_name is required';
        }

        $attrs = [
            'member_code' => $code,
            'rf_id' => $rfId === '' ? null : $rfId,
            'member_name' => $name,
            'share_capital' => Cells::money($cells[3] ?? null, 'share_capital', $problems),
            'savings_bonus' => Cells::money($cells[4] ?? null, 'savings_bonus', $problems),
            'regular_savings' => Cells::money($cells[5] ?? null, 'regular_savings', $problems),
            'dividend_to_share_capital' => Cells::money($cells[6] ?? null, 'dividend_to_share_capital', $problems),
            'dividend_to_savings' => Cells::money($cells[7] ?? null, 'dividend_to_savings', $problems),
            'as_of_date' => Cells::date($cells[8] ?? null, 'as_of_date', $problems, required: true),
            'time_deposit' => Cells::money($cells[9] ?? null, 'time_deposit', $problems),
        ];

        return [$attrs, $problems];
    }

    public function crossCheck(array $rows, array $rowNumbers): array
    {
        $errors = [];
        $codes = [];
        $cards = [];

        foreach ($rows as $i => $row) {
            $rowNo = $rowNumbers[$i];

            if (isset($codes[$row['member_code']])) {
                $errors[] = ['row' => $rowNo, 'message' => "member_code {$row['member_code']} is repeated (first seen on row {$codes[$row['member_code']]})"];
            }
            $codes[$row['member_code']] ??= $rowNo;

            if ($row['rf_id'] !== null) {
                if (isset($cards[$row['rf_id']])) {
                    $errors[] = ['row' => $rowNo, 'message' => "rf_id {$row['rf_id']} is repeated (first seen on row {$cards[$row['rf_id']]})"];
                }
                $cards[$row['rf_id']] ??= $rowNo;
            }
        }

        return $errors;
    }

    public function asOf(array $rows): ?string
    {
        $dates = array_filter(array_column($rows, 'as_of_date'));

        return $dates === [] ? null : max($dates);
    }
}
