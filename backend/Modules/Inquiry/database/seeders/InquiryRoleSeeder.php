<?php

declare(strict_types=1);

namespace Modules\Inquiry\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Suggested staff roles. Run after IdentitySeeder. A role is filled only when it is first created,
 * so later edits made in the Roles screen are never overwritten.
 */
final class InquiryRoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $roles = [
            // Loads the Excel exports, browses balances, writes announcements.
            'Inquiry Officer' => [
                'inquiry.access', 'inquiry.statements.view', 'inquiry.statements.import', 'inquiry.announcements.manage',
            ],
            // The account that stays signed in on the member-facing station screen.
            'Inquiry Station' => ['inquiry.access', 'inquiry.station.use'],
        ];

        foreach ($roles as $name => $permissions) {
            $role = Role::findOrCreate($name, 'web');

            if ($role->wasRecentlyCreated) {
                $role->syncPermissions($permissions);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
