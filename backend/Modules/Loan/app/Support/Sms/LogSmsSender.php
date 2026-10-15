<?php

declare(strict_types=1);

namespace Modules\Loan\Support\Sms;

use Illuminate\Support\Facades\Log;

/** Development driver: the "SMS" is written to storage/logs/laravel.log. Never use in production. */
final class LogSmsSender implements SmsSender
{
    public function send(string $to, string $message): void
    {
        Log::info('[loan sms] to '.$to.': '.$message);
    }
}
