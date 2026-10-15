<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\IdentityAccess\Database\Seeders\IdentitySeeder;
use Modules\Loan\Database\Seeders\LoanRoleSeeder;


class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(IdentitySeeder::class);
        $this->call(LoanRoleSeeder::class);
    }
}
