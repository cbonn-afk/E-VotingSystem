<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support\Import;

use Modules\Inquiry\Enums\StatementType;

/**
 * A member code | B loan code | C loan number | D loan type | E principal | F interest |
 * G principal paid | H interest paid | I principal balance | J interest balance |
 * K released | L start | M maturity
 *
 * Same column order as the old system's loan balance file.
 */
final class LoanImporter extends StatementImporter
{
    public function type(): StatementType
    {
        return StatementType::Loans;
    }

    public function headings(): array
    {
        return [
            'member_code', 'loan_code', 'loan_number', 'loan_type', 'principal', 'interest',
            'principal_paid', 'interest_paid', 'principal_balance', 'interest_balance',
            'released_on', 'start_on', 'maturity_on',
        ];
    }

    public function sample(): array
    {
        return ['B0092', 'REG', 'L-2026-0001', 'REGULAR LOAN', '50000.00', '6000.00', '10000.00', '1200.00', '40000.00', '4800.00', '2026-01-15', '2026-02-01', '2027-01-31'];
    }

    public function parseRow(array $cells): array
    {
        $problems = [];
        $code = Cells::code($cells[0] ?? null);
        $loanCode = strtoupper(Cells::text($cells[1] ?? null));
        $loanNumber = strtoupper(Cells::text($cells[2] ?? null));
        $loanType = strtoupper(Cells::text($cells[3] ?? null));

        foreach (['member_code' => $code, 'loan_code' => $loanCode, 'loan_number' => $loanNumber, 'loan_type' => $loanType] as $label => $value) {
            if ($value === '') {
                $problems[] = "{$label} is required";
            }
        }

        $attrs = [
            'member_code' => $code,
            'loan_code' => $loanCode,
            'loan_number' => $loanNumber,
            'loan_type' => $loanType,
            'principal' => Cells::money($cells[4] ?? null, 'principal', $problems),
            'interest' => Cells::money($cells[5] ?? null, 'interest', $problems),
            'principal_paid' => Cells::money($cells[6] ?? null, 'principal_paid', $problems),
            'interest_paid' => Cells::money($cells[7] ?? null, 'interest_paid', $problems),
            'principal_balance' => Cells::money($cells[8] ?? null, 'principal_balance', $problems),
            'interest_balance' => Cells::money($cells[9] ?? null, 'interest_balance', $problems),
            'released_on' => Cells::date($cells[10] ?? null, 'released_on', $problems, required: false),
            'start_on' => Cells::date($cells[11] ?? null, 'start_on', $problems, required: false),
            'maturity_on' => Cells::date($cells[12] ?? null, 'maturity_on', $problems, required: false),
        ];

        return [$attrs, $problems];
    }
}
