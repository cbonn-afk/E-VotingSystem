<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Support;

use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Models\User;
use Illuminate\Validation\ValidationException;

final class RoleGuard
{
    /** @param list<string> $roles */
    public static function assertCanAssign(User $actor, array $roles): void
    {
        if (in_array(SystemRole::SuperAdmin->value, $roles, true)) {
            self::deny('roles', 'The Super Admin role cannot be assigned.');
        }

        $grantsFullAccess = array_intersect($roles, SystemRole::fullAccessValues()) !== [];

        if ($grantsFullAccess && ! $actor->hasFullAccess()) {
            self::deny('roles', 'Only an administrator can assign the Admin role.');
        }
    }

    /**
     * Non-admins can only hand out permissions they hold themselves.
     *
     * @param list<string> $permissions
     */
    public static function assertCanGrant(User $actor, array $permissions): void
    {
        if ($actor->hasFullAccess()) {
            return;
        }

        foreach ($permissions as $permission) {
            if (! $actor->can($permission)) {
                self::deny('permissions', "You cannot grant the [{$permission}] permission.");
            }
        }
    }

    private static function deny(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }
}
