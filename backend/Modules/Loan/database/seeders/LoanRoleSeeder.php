<?php

declare(strict_types=1);

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Suggested staff roles. Run after IdentitySeeder. A role is filled only when it is first created,
 * so later edits made in the Roles screen are never overwritten.
 */
final class LoanRoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $roles = [
            'Loan Officer' => ['loan.access', 'loan.applications.view', 'loan.applications.manage', 'members.view'],
            'Loan Evaluator' => ['loan.access', 'loan.applications.view', 'loan.evaluate', 'members.view'],
            'Credit Committee' => ['loan.access', 'loan.applications.view', 'loan.approve'],
            'Cashier' => ['loan.access', 'loan.applications.view', 'loan.release', 'loan.payments.record', 'members.view'],
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
