<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Controllers;

use Modules\IdentityAccess\Actions\Users\CreateUser;
use Modules\IdentityAccess\Actions\Users\DeleteUser;
use Modules\IdentityAccess\Actions\Users\ListUsers;
use Modules\IdentityAccess\Actions\Users\ResetUserPassword;
use Modules\IdentityAccess\Actions\Users\SyncUserRoles;
use Modules\IdentityAccess\Actions\Users\UpdateUser;
use Modules\IdentityAccess\Actions\Users\UpdateUserStatus;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Http\Controllers\Controller;
use Modules\IdentityAccess\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class UserController extends Controller
{
    public function index(Request $request, ListUsers $action): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(UserStatus::class)],
            'role' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json($action->execute($filters));
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('roles:id,name'));
    }

    public function store(Request $request, CreateUser $action): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->withoutTrashed()],
            'password' => ['required', Password::min(8)],
            'status' => ['nullable', Rule::enum(UserStatus::class)],
            'require_password_change' => ['nullable', 'boolean'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')],
        ]);

        return response()->json($action->execute($request->user(), $data), 201);
    }

    public function update(Request $request, User $user, UpdateUser $action): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)->withoutTrashed()],
        ]);

        return response()->json($action->execute($request->user(), $user, $data));
    }

    public function status(Request $request, User $user, UpdateUserStatus $action): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::enum(UserStatus::class)]]);

        return response()->json($action->execute($request->user(), $user, UserStatus::from($data['status'])));
    }

    public function roles(Request $request, User $user, SyncUserRoles $action): JsonResponse
    {
        $data = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::exists('roles', 'name')],
        ]);

        return response()->json($action->execute($request->user(), $user, $data['roles']));
    }

    public function resetPassword(Request $request, User $user, ResetUserPassword $action): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', Password::min(8)],
            'require_password_change' => ['nullable', 'boolean'],
        ]);

        return response()->json($action->execute($request->user(), $user, $data));
    }

    public function destroy(Request $request, User $user, DeleteUser $action): JsonResponse
    {
        $action->execute($request->user(), $user);

        return response()->json(status: 204);
    }
}
