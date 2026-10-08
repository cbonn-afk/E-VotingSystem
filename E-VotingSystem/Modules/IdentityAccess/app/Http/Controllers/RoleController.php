<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Controllers;

use Modules\IdentityAccess\Actions\Roles\CreateRole;
use Modules\IdentityAccess\Actions\Roles\DeleteRole;
use Modules\IdentityAccess\Actions\Roles\ListRoles;
use Modules\IdentityAccess\Actions\Roles\UpdateRole;
use Modules\IdentityAccess\Enums\PermissionName;
use Modules\IdentityAccess\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

final class RoleController extends Controller
{
    public function index(Request $request, ListRoles $action): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($action->execute($filters));
    }

    public function store(Request $request, CreateRole $action): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionName::values())],
        ]);

        return response()->json($action->execute($request->user(), $data), 201);
    }

    public function update(Request $request, Role $role, UpdateRole $action): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role)],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(PermissionName::values())],
        ]);

        return response()->json($action->execute($request->user(), $role, $data));
    }

    public function destroy(Request $request, Role $role, DeleteRole $action): JsonResponse
    {
        $action->execute($request->user(), $role);

        return response()->json(status: 204);
    }
}
