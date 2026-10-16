<?php

declare(strict_types=1);

namespace Modules\Election\Database\Seeders;

use Illuminate\Database\Seeder;

/** Needs IdentitySeeder (permissions) and MembersDatabaseSeeder to have run first. */
final class ElectionDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ElectionRoleSeeder::class,
            TouristSpotPollSeeder::class,
        ]);
    }
}
