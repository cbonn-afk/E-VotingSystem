<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Notifications\UserRolesUpdatedNotification;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\IdentityAccess\Support\RoleGuard;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class SyncUserRoles
{
    /** @param list<string> $roles */
    public function execute(User $actor, User $target, array $roles): User
    {
        if ($target->hasRole(SystemRole::SuperAdmin->value)) {
            throw ValidationException::withMessages([
                'roles' => ['The Super Admin account roles cannot be changed.'],
            ]);
        }

        RoleGuard::assertCanAssign($actor, $roles);

        return DB::transaction(function () use ($actor, $target, $roles): User {
            $before = AuditLogger::user($target);

            $target->syncRoles($roles);
            $target->refresh()->load('roles:id,name');

            AuditLogger::record($actor, AuditAction::UserRolesUpdated, $target, $before, AuditLogger::user($target));

            $target->notify(new UserRolesUpdatedNotification(
                $actor,
                $target->getRoleNames()->sort()->values()->all(),
            ));

            return $target;
        });
    }
}
