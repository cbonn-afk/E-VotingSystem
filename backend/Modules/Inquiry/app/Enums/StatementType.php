<?php

declare(strict_types=1);

namespace Modules\Inquiry\Enums;

use Illuminate\Database\Eloquent\Model;
use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Models\LoanBalance;
use Modules\Inquiry\Support\Import\BalanceImporter;
use Modules\Inquiry\Support\Import\LoanImporter;
use Modules\Inquiry\Support\Import\StatementImporter;
use Modules\Inquiry\Support\Import\TransactionImporter;

/** The three Excel files the cooperative's accounting system exports. */
enum StatementType: string
{
    case Balances = 'balances';
    case Transactions = 'transactions';
    case Loans = 'loans';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $t): string => $t->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Balances => 'Account balances',
            self::Transactions => 'Savings transactions',
            self::Loans => 'Loan balances',
        };
    }

    /** @return class-string<Model> */
    public function model(): string
    {
        return match ($this) {
            self::Balances => AccountBalance::class,
            self::Transactions => AccountTransaction::class,
            self::Loans => LoanBalance::class,
        };
    }

    public function importer(): StatementImporter
    {
        return match ($this) {
            self::Balances => new BalanceImporter,
            self::Transactions => new TransactionImporter,
            self::Loans => new LoanImporter,
        };
    }
}
