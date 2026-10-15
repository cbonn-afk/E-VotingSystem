<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\IdentityAccess\Support\RoleGuard;
use Illuminate\Support\Facades\DB;

final class CreateUser
{
    /** @param array<string, mixed> $data */
    public function execute(User $actor, array $data): User
    {
        $roles = $data['roles'] ?? [SystemRole::Member->value];

        RoleGuard::assertCanAssign($actor, $roles);

        return DB::transaction(function () use ($actor, $data, $roles): User {
            $status = UserStatus::from($data['status'] ?? UserStatus::Active->value);

            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'status' => $status,
                'require_password_change' => $data['require_password_change'] ?? false,
                'deactivated_at' => $status === UserStatus::Inactive ? now() : null,
            ]);

            $user->syncRoles($roles);
            $user->load('roles:id,name');

            AuditLogger::record($actor, AuditAction::UserCreated, $user, after: AuditLogger::user($user));

            return $user;
        });
    }
}
