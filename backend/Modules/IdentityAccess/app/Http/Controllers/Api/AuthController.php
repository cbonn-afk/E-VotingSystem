<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Controllers\Api;

use Modules\IdentityAccess\Enums\ModuleName;
use Modules\IdentityAccess\Enums\ThemePreference;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Http\Controllers\Controller;
use Modules\IdentityAccess\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

final class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Only active, non-deleted accounts can sign in.
        $attempt = Auth::guard('web')->attempt(
            [...$credentials, 'status' => UserStatus::Active->value],
            $request->boolean('remember'),
        );

        if (! $attempt) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records, or the account is deactivated.'],
            ]);
        }

        $request->session()->regenerate();

        return $this->userResponse($request->user(), withPasswordFlag: true);
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return $this->userResponse($request->user());
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password:web'],
            'password' => ['required', 'confirmed', 'different:current_password', Password::min(8)],
        ]);

        $user = $request->user();
        $user->update([
            'password' => $data['password'],
            'require_password_change' => false,
        ]);

        return $this->userResponse($user->refresh());
    }

    /** POST (not PATCH) because the form may carry an avatar file (multipart). */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'theme_preference' => ['sometimes', 'required', Rule::enum(ThemePreference::class)],
            'avatar' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $attributes = Arr::only($data, ['name', 'email', 'phone', 'address', 'theme_preference']);

        if ($request->hasFile('avatar')) {
            $this->deleteAvatar($user);
            $attributes['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar')) {
            $this->deleteAvatar($user);
            $attributes['avatar_path'] = null;
        }

        $user->update($attributes);

        return $this->userResponse($user->refresh());
    }

    private function deleteAvatar(User $user): void
    {
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }
    }

    private function userResponse(User $user, bool $withPasswordFlag = false): JsonResponse
    {
        $profile = $this->profile($user);

        return response()->json([
            'data' => $profile,
            ...($withPasswordFlag ? ['requires_password_change' => $profile['require_password_change']] : []),
        ]);
    }

    /** Shape expected by the Next.js `User` type. */
    private function profile(User $user): array
    {
        $fullAccess = $user->hasFullAccess();
        $permissions = $user->getAllPermissions()->pluck('name')->values()->all();
        // A module is reachable when the user holds any permission under its prefix.
        $modules = $fullAccess
            ? ModuleName::values()
            : array_values(array_filter(
                ModuleName::values(),
                static fn (string $module): bool => collect($permissions)->contains(
                    static fn (string $p): bool => str_starts_with($p, $module.'.'),
                ),
            ));

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'avatar_url' => $user->avatar_url,
            'theme_preference' => $user->theme_preference->value,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'status' => $user->status->value,
            'deactivated_at' => $user->deactivated_at?->toISOString(),
            'is_super_admin' => $fullAccess, // Super Admin and Admin are identical
            'roles' => $user->getRoleNames()->values()->all(),
            'permissions' => $permissions,
            'modules' => $modules,
            'require_password_change' => $user->require_password_change,
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];
    }
}
