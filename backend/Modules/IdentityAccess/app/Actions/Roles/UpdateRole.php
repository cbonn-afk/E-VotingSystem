<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Roles;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\IdentityAccess\Support\RoleGuard;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

final class UpdateRole
{
    /** @param array<string, mixed> $data */
    public function execute(User $actor, Role $role, array $data): Role
    {
        if (in_array($role->name, SystemRole::values(), true)) {
            throw ValidationException::withMessages(['role' => ['System roles cannot be modified.']]);
        }

        if (isset($data['permissions'])) {
            RoleGuard::assertCanGrant($actor, $data['permissions']);
        }

        return DB::transaction(function () use ($actor, $role, $data): Role {
            $before = AuditLogger::role($role);

            if (isset($data['name'])) {
                $role->update(['name' => $data['name']]);
            }

            if (isset($data['permissions'])) {
                $role->syncPermissions($data['permissions']);
            }

            $role->refresh()->load('permissions:id,name');

            AuditLogger::record($actor, AuditAction::RoleUpdated, $role, $before, AuditLogger::role($role));

            return $role->loadCount('users');
        });
    }
}
