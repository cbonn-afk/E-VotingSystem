<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\IdentityAccess\Models\User;

final class ListUsers
{
    public const SORTABLE = ['name', 'email', 'status', 'created_at', 'updated_at'];

    /** @param array<string, mixed> $filters */
    public function execute(array $filters): LengthAwarePaginator
    {
        $sort = in_array($filters['sort'] ?? null, self::SORTABLE, true) ? $filters['sort'] : 'name';
        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return User::query()
            ->with(['roles.permissions:id,name', 'permissions:id,name'])
            ->when($filters['search'] ?? null, fn ($q, string $s) => $q->where(
                fn ($q) => $q->whereLike('name', "%{$s}%")->orWhereLike('email', "%{$s}%"),
            ))
            ->when($filters['status'] ?? null, fn ($q, string $s) => $q->where('status', $s))
            ->when($filters['role'] ?? null, fn ($q, string $r) => $q->whereHas(
                'roles',
                fn ($q) => $q->where('name', $r),
            ))
            ->orderBy($sort, $direction)
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 15);
    }
}
