<?php

declare(strict_types=1);

namespace Modules\Loan\Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Needs IdentitySeeder (permissions), StaffUserSeeder and MembersDatabaseSeeder to have run first.
 */
final class LoanDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LoanRoleSeeder::class,
            LoanSettingSeeder::class,
            LoanProductSeeder::class,
            LoanApplicationSeeder::class,
        ]);
    }
}
