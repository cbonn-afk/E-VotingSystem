<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\IdentityAccess\Enums\SystemRole;

/** @mixin \Spatie\Permission\Models\Role */
final class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_system' => in_array($this->name, SystemRole::values(), true),
            'permissions' => $this->permissions->pluck('name')->values()->all(),
            'users_count' => (int) ($this->users_count ?? 0),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
