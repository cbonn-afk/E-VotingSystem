<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Illuminate\Support\Facades\DB;

final class UpdateUser
{
    /** @param array<string, mixed> $data */
    public function execute(User $actor, User $user, array $data): User
    {
        return DB::transaction(function () use ($actor, $user, $data): User {
            $before = AuditLogger::user($user);

            $user->update($data);
            $user->refresh()->load('roles:id,name');

            AuditLogger::record($actor, AuditAction::UserUpdated, $user, $before, AuditLogger::user($user));

            return $user;
        });
    }
}
