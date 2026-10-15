<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\IdentityAccess\Enums\ModuleName;

/** @mixin \Modules\IdentityAccess\Models\User */
final class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $permissions = $this->getAllPermissions()->pluck('name')->values()->all();

        $modules = $this->hasFullAccess()
            ? ModuleName::values()
            : array_values(array_filter(
                ModuleName::values(),
                static fn (string $module): bool => collect($permissions)->contains(
                    static fn (string $p): bool => str_starts_with($p, $module.'.'),
                ),
            ));

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'status' => $this->status->value,
            'deactivated_at' => $this->deactivated_at?->toISOString(),
            'roles' => $this->roles->pluck('name')->values()->all(),
            'permissions' => $permissions,
            'modules' => $modules,
            'require_password_change' => (bool) $this->require_password_change,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
