<?php

declare(strict_types=1);

namespace Modules\Loan\Support\Sms;

interface SmsSender
{
    /** @param string $to number in +639XXXXXXXXX format */
    public function send(string $to, string $message): void;
}
