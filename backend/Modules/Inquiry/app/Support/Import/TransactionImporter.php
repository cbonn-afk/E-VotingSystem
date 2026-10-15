<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support\Import;

use Modules\Inquiry\Enums\StatementType;

/**
 * A member code | B type (RS / TD / SC) | C mode (D / W) | D amount | E balance after | F date
 *
 * Same column order as the old system's transaction file.
 */
final class TransactionImporter extends StatementImporter
{
    public function type(): StatementType
    {
        return StatementType::Transactions;
    }

    public function headings(): array
    {
        return ['member_code', 'type', 'mode', 'amount', 'balance', 'date'];
    }

    public function sample(): array
    {
        return ['B0092', 'RS', 'D', '1000.00', '1000.00', '2026-09-25'];
    }

    public function parseRow(array $cells): array
    {
        $problems = [];
        $code = Cells::code($cells[0] ?? null);
        $type = strtoupper(Cells::text($cells[1] ?? null));
        $mode = $this->mode(Cells::text($cells[2] ?? null));
        $types = array_keys((array) config('inquiry.transaction_types', ['RS' => '', 'TD' => '', 'SC' => '']));

        if ($code === '') {
            $problems[] = 'member_code is required';
        }

        if (! in_array($type, $types, true)) {
            $problems[] = 'type must be one of '.implode(', ', $types);
        }

        if ($mode === null) {
            $problems[] = 'mode must be D (deposit) or W (withdrawal)';
        }

        $amount = Cells::money($cells[3] ?? null, 'amount', $problems);
        $balance = Cells::money($cells[4] ?? null, 'balance', $problems);

        if (Cells::text($cells[3] ?? null) === '') {
            $problems[] = 'amount is required';
        }

        $attrs = [
            'member_code' => $code,
            'account_type' => $type,
            'mode' => $mode,
            'amount' => $amount,
            'running_balance' => $balance,
            'transacted_on' => Cells::date($cells[5] ?? null, 'date', $problems, required: true),
        ];

        return [$attrs, $problems];
    }

    /** D / W, or the whole word (deposit, withdraw, withdrawal). */
    private function mode(string $raw): ?string
    {
        return match (strtoupper($raw)) {
            'D', 'DEPOSIT' => 'D',
            'W', 'WITHDRAW', 'WITHDRAWAL' => 'W',
            default => null,
        };
    }
}
