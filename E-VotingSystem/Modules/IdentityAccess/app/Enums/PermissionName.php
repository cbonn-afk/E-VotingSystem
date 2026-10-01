<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum PermissionName: string
{
    case UsersView = 'users.view';
    case UsersCreate = 'users.create';
    case UsersUpdate = 'users.update';
    case UsersDelete = 'users.delete';
    case UsersRolesManage = 'users.roles.manage';
    case UsersPasswordReset = 'users.password.reset';
    case RolesView = 'roles.view';
    case RolesManage = 'roles.manage';
    case AuditView = 'audit.view';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $p): string => $p->value, self::cases());
    }
}
