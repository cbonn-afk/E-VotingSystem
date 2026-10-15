<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Modules\IdentityAccess\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;

final class PermissionController extends Controller
{
    /** The permission catalog shown in the role editor, grouped by module on the client. */
    public function index(): JsonResponse
    {
        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Permission $p): array => [
                'id' => $p->id,
                'name' => $p->name,
                'module' => Str::before($p->name, '.'),
                'action' => Str::afterLast($p->name, '.'),
            ])
            ->values();

        return response()->json(['data' => $permissions]);
    }
}
