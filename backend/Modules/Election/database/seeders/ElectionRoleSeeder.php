<?php

declare(strict_types=1);

namespace Modules\Election\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Suggested staff roles. Run after IdentitySeeder. A role is filled only when it is first created,
 * so later edits made in the Roles screen are never overwritten.
 */
final class ElectionRoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $roles = [
            // Runs the whole election: assemblies, ballot setup, results, reports.
            'Election Officer' => [
                'election.access', 'election.assemblies.manage', 'election.members.view', 'election.members.manage',
                'election.registration.view', 'election.registration.manage', 'election.ballot.view', 'election.ballot.manage',
                'election.tokens.manage', 'election.results.view', 'election.reports.export', 'election.settings.manage',
                'members.view',
            ],
            // Front desk: registers attendance and hands out tokens.
            'Election Registrar' => [
                'election.access', 'election.members.view', 'election.registration.view',
                'election.registration.manage', 'election.tokens.manage', 'members.view',
            ],
            // The account that stays signed in on a voting booth.
            'Election Teller' => ['election.access', 'election.ballot.view', 'election.voting.cast'],
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
