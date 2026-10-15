<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Roles;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\IdentityAccess\Support\RoleGuard;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

final class CreateRole
{
    /** @param array{name: string, permissions: list<string>} $data */
    public function execute(User $actor, array $data): Role
    {
        RoleGuard::assertCanGrant($actor, $data['permissions']);

        return DB::transaction(function () use ($actor, $data): Role {
            $role = Role::query()->create(['name' => $data['name'], 'guard_name' => 'web']);
            $role->syncPermissions($data['permissions']);
            $role->load('permissions:id,name');

            AuditLogger::record($actor, AuditAction::RoleCreated, $role, after: AuditLogger::role($role));

            return $role->loadCount('users');
        });
    }
}
