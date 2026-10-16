<?php

declare(strict_types=1);

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Loan\Models\LoanApprovalLevel;
use Spatie\Permission\Models\Permission;
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
            'Loan Board' => ['loan.access', 'loan.applications.view', 'loan.approve'],
            'Cashier' => ['loan.access', 'loan.applications.view', 'loan.release', 'loan.payments.record', 'members.view'],
        ];

        foreach ($roles as $name => $permissions) {
            $role = Role::findOrCreate($name, 'web');

            if ($role->wasRecentlyCreated) {
                $role->syncPermissions($permissions);
            }
        }

        // Loan Officers approve small loans, so an existing Loan Officer role gains the approve permission (additive only).
        Role::findByName('Loan Officer', 'web')->givePermissionTo(Permission::findOrCreate('loan.approve', 'web'));

        // Point the default approval levels at the matching roles, only where no role was chosen yet.
        foreach (['Loan Officer' => 'Loan Officer', 'Credit Committee' => 'Credit Committee', 'Management / Board' => 'Loan Board'] as $level => $role) {
            LoanApprovalLevel::query()->where('name', $level)->whereNull('role_id')
                ->update(['role_id' => Role::findByName($role, 'web')->id]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
