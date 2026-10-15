<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum SystemRole: string
{
    case SuperAdmin = 'Super Admin';
    case Administrator = 'Admin';
    case Member = 'Member';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $r): string => $r->value, self::cases());
    }

    /** Roles with unrestricted access (bypass every permission check). */
    public static function fullAccessValues(): array
    {
        return [self::SuperAdmin->value, self::Administrator->value];
    }
}
