<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateUserStatus
{
    public function execute(User $actor, User $target, UserStatus $status): User
    {
        if ($actor->is($target)) {
            $this->fail('You cannot change your own account status.');
        }

        if ($target->hasFullAccess() && ! $actor->hasFullAccess()) {
            $this->fail('You cannot change this user account status.');
        }

        $this->assertAnotherAdminRemains($target, $status);

        return DB::transaction(function () use ($actor, $target, $status): User {
            $before = AuditLogger::user($target);

            $target->update([
                'status' => $status,
                'deactivated_at' => $status === UserStatus::Inactive ? now() : null,
            ]);

            if ($status === UserStatus::Inactive) {
                $target->tokens()->delete(); // sign the user out everywhere
            }

            $target->refresh()->load('roles:id,name');

            AuditLogger::record($actor, AuditAction::UserStatusUpdated, $target, $before, AuditLogger::user($target));

            return $target;
        });
    }

    private function assertAnotherAdminRemains(User $target, UserStatus $status): void
    {
        if ($status !== UserStatus::Inactive || ! $target->isActive() || ! $target->hasFullAccess()) {
            return;
        }

        $activeAdmins = User::query()
            ->role(SystemRole::fullAccessValues())
            ->where('status', UserStatus::Active->value)
            ->count();

        if ($activeAdmins <= 1) {
            $this->fail('The last active administrator cannot be deactivated.');
        }
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['status' => [$message]]);
    }
}
