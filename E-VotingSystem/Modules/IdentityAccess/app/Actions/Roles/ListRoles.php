<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Roles;

use Modules\IdentityAccess\Enums\SystemRole;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Permission\Models\Role;

final class ListRoles
{
    /** @param array<string, mixed> $filters */
    public function execute(array $filters): LengthAwarePaginator
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->where('name', '!=', SystemRole::SuperAdmin->value) // hidden root role
            ->with('permissions:id,name')
            ->withCount('users')
            ->when($filters['search'] ?? null, fn ($q, string $s) => $q->whereLike('name', "%{$s}%"))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 25);
    }
}
