<?php

declare(strict_types=1);

namespace Modules\Loan\Console;

use DateTimeImmutable;
use Illuminate\Console\Command;
use Modules\Loan\Support\CollectionStatusService;

/** Runs every night (see LoanServiceProvider). You can also run it by hand. */
final class UpdateCollectionStatusCommand extends Command
{
    protected $signature = 'loans:update-collection-status {--date= : Check as of this date (YYYY-MM-DD) instead of today}';

    protected $description = 'Label every active loan as current, due, overdue, delinquent or default';

    public function handle(CollectionStatusService $service): int
    {
        $date = $this->option('date');

        if ($date !== null && ! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $date)) {
            $this->error('Use a date like 2026-06-20.');

            return self::FAILURE;
        }

        $result = $service->refreshAll($date === null ? null : new DateTimeImmutable((string) $date));

        $this->info("Checked {$result['checked']} loan(s); {$result['changed']} changed status.");

        return self::SUCCESS;
    }
}
