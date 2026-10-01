<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum AuditAction: string
{
    case UserCreated = 'user.created';
    case UserUpdated = 'user.updated';
    case UserStatusUpdated = 'user.status.updated';
    case UserRolesUpdated = 'user.roles.updated';
    case UserPasswordReset = 'user.password.reset';
    case UserDeleted = 'user.deleted';
    case RoleCreated = 'role.created';
    case RoleUpdated = 'role.updated';
    case RoleDeleted = 'role.deleted';
}
