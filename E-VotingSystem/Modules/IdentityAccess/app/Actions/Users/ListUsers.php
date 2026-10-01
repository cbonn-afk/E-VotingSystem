<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Actions\Users;

use Modules\IdentityAccess\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

final class ListUsers
{
    /** @param array<string, mixed> $filters */
    public function execute(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->with('roles:id,name')
            ->when($filters['search'] ?? null, fn ($q, string $s) => $q->where(
                fn ($q) => $q->whereLike('name', "%{$s}%")->orWhereLike('email', "%{$s}%"),
            ))
            ->when($filters['status'] ?? null, fn ($q, string $s) => $q->where('status', $s))
            ->when($filters['role'] ?? null, fn ($q, string $r) => $q->whereHas(
                'roles',
                fn ($q) => $q->where('name', $r),
            ))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 15);
    }
}
