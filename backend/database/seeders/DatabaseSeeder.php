<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Documents\Database\Seeders\DocumentsDatabaseSeeder;
use Modules\Election\Database\Seeders\ElectionDatabaseSeeder;
use Modules\Election\Database\Seeders\ElectionRoleSeeder;
use Modules\IdentityAccess\Database\Seeders\IdentityAccessDatabaseSeeder;
use Modules\IdentityAccess\Database\Seeders\StaffUserSeeder;
use Modules\Inquiry\Database\Seeders\InquiryDatabaseSeeder;
use Modules\Inquiry\Database\Seeders\InquiryRoleSeeder;
use Modules\Loan\Database\Seeders\LoanDatabaseSeeder;
use Modules\Loan\Database\Seeders\LoanRoleSeeder;
use Modules\Members\Database\Seeders\MembersDatabaseSeeder;

/**
 * Seeds every module. The order matters:
 *  1. permissions, system roles and the Super Admin (IdentityAccess)
 *  2. the module staff roles, then one sample staff account per role
 *  3. print settings, the shared member list
 *  4. module data that depends on members and staff: Loan, Inquiry, Election
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            IdentityAccessDatabaseSeeder::class,

            ElectionRoleSeeder::class,
            LoanRoleSeeder::class,
            InquiryRoleSeeder::class,
            StaffUserSeeder::class,

            DocumentsDatabaseSeeder::class,
            MembersDatabaseSeeder::class,

            LoanDatabaseSeeder::class,
            InquiryDatabaseSeeder::class,
            ElectionDatabaseSeeder::class,
        ]);
    }
}
