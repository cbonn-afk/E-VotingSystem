<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum ModuleName: string
{
    case Settings = 'settings';
    case Members = 'members';
    case Election = 'election';
    case Loan = 'loan';
    case Inquiry = 'inquiry';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $m): string => $m->value, self::cases());
    }
}
