<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * One sample account per staff role, so every screen can be tried with a realistic login.
 * Run after IdentitySeeder and the module role seeders (Election, Loan, Inquiry).
 * Password comes from SEED_STAFF_PASSWORD (default below). Accounts are matched by email, so this is safe to re-run.
 */
final class StaffUserSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $password = (string) env('SEED_STAFF_PASSWORD', 'Password123!');

        $staff = [
            ['Ana Reyes', 'admin@ifmpc.test', SystemRole::Administrator->value],
            ['Liza Manalo', 'loan.officer@ifmpc.test', 'Loan Officer'],
            ['Mark Villareal', 'loan.evaluator@ifmpc.test', 'Loan Evaluator'],
            ['Grace Dumlao', 'credit.committee@ifmpc.test', 'Credit Committee'],
            ['Ben Sarmiento', 'loan.board@ifmpc.test', 'Loan Board'],
            ['Cora Padilla', 'cashier@ifmpc.test', 'Cashier'],
            ['Nelia Abalos', 'inquiry.officer@ifmpc.test', 'Inquiry Officer'],
            ['Inquiry Station 1', 'inquiry.station@ifmpc.test', 'Inquiry Station'],
            ['Paolo Ventura', 'election.officer@ifmpc.test', 'Election Officer'],
            ['Jenny Racelis', 'election.registrar@ifmpc.test', 'Election Registrar'],
            ['Voting Booth 1', 'election.teller@ifmpc.test', 'Election Teller'],
        ];

        foreach ($staff as [$name, $email, $role]) {
            if (! Role::query()->where('name', $role)->where('guard_name', 'web')->exists()) {
                $this->command?->warn("Role [{$role}] does not exist yet; skipped {$email}.");

                continue;
            }

            $user = User::query()->firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => $password,
                    'status' => UserStatus::Active,
                    'require_password_change' => false,
                    'email_verified_at' => now(),
                ],
            );

            $user->syncRoles([$role]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
