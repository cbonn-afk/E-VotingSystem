<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ResetUserPassword
{
    /** @param array{password: string, require_password_change?: bool} $data */
    public function execute(User $actor, User $target, array $data): User
    {
        if ($actor->is($target)) {
            throw ValidationException::withMessages([
                'user' => ['You cannot reset your own password from user management.'],
            ]);
        }

        if ($target->hasFullAccess() && ! $actor->hasFullAccess()) {
            throw ValidationException::withMessages([
                'user' => ['Only an administrator can reset an administrator password.'],
            ]);
        }

        return DB::transaction(function () use ($actor, $target, $data): User {
            $before = AuditLogger::user($target);

            $target->update([
                'password' => $data['password'],
                'require_password_change' => $data['require_password_change'] ?? true,
            ]);

            $target->revokeAccess();
            $target->refresh()->load('roles:id,name');

            AuditLogger::record($actor, AuditAction::UserPasswordReset, $target, $before, AuditLogger::user($target));

            return $target;
        });
    }
}
