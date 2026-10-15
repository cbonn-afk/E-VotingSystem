<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Database\Seeders;

use Modules\IdentityAccess\Enums\PermissionName;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class IdentitySeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionName::cases() as $permission) {
            Permission::findOrCreate($permission->value, 'web');
        }

        // Super Admin & Admin bypass checks through Gate::before,
        // so they need no explicit permissions.
        Role::findOrCreate(SystemRole::SuperAdmin->value, 'web');
        Role::findOrCreate(SystemRole::Administrator->value, 'web');

        // Member starts empty. Add permissions here when you decide what a Member can do.
        Role::findOrCreate(SystemRole::Member->value, 'web')->syncPermissions([]);

        $root = User::query()->firstOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'admin@example.com')],
            [
                'name' => 'Super Admin',
                'password' => env('SEED_ADMIN_PASSWORD', 'ChangeMe123!'),
                'status' => UserStatus::Active,
                'require_password_change' => true,
            ],
        );
        $root->syncRoles([SystemRole::SuperAdmin->value]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
