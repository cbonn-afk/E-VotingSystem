<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class DeleteUser
{
    public function execute(User $actor, User $target): void
    {
        if ($actor->is($target)) {
            throw ValidationException::withMessages(['user' => ['You cannot delete your own account.']]);
        }

        if ($target->isActive()) {
            throw ValidationException::withMessages(['user' => ['Deactivate the user before deleting the account.']]);
        }

        DB::transaction(function () use ($actor, $target): void {
            $before = AuditLogger::user($target);

            $target->tokens()->delete();
            $target->delete();

            AuditLogger::record($actor, AuditAction::UserDeleted, $target, before: $before);
        });
    }
}
