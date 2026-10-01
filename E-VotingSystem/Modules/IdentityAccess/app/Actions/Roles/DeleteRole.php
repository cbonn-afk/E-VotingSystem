<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Roles;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

final class DeleteRole
{
    public function execute(User $actor, Role $role): void
    {
        if (in_array($role->name, SystemRole::values(), true)) {
            throw ValidationException::withMessages(['role' => ['System roles cannot be deleted.']]);
        }

        if ($role->users()->exists()) {
            throw ValidationException::withMessages(['role' => ['A role assigned to users cannot be deleted.']]);
        }

        DB::transaction(function () use ($actor, $role): void {
            $before = AuditLogger::role($role);

            $role->delete();

            AuditLogger::record($actor, AuditAction::RoleDeleted, $role, before: $before);
        });
    }
}
