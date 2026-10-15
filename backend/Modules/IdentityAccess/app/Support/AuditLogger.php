<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Support;

use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\AuditLog;
use Modules\IdentityAccess\Models\User;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

final class AuditLogger
{
    public static function record(
        ?User $actor,
        AuditAction $action,
        Model $subject,
        ?array $before = null,
        ?array $after = null,
    ): void {
        $request = request();

        AuditLog::query()->create([
            'actor_id' => $actor?->getKey(),
            'action' => $action,
            'subject_type' => $subject::class,
            'subject_id' => (string) $subject->getKey(),
            'before' => $before,
            'after' => $after,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1024),
            'request_method' => $request->method(),
            'request_url' => $request->fullUrl(),
        ]);
    }

    public static function user(User $user): array
    {
        $user->loadMissing('roles:id,name');

        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status->value,
            'roles' => $user->roles->pluck('name')->sort()->values()->all(),
        ];
    }

    public static function role(Role $role): array
    {
        $role->loadMissing('permissions:id,name');

        return [
            'id' => $role->getKey(),
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name')->sort()->values()->all(),
        ];
    }
}
