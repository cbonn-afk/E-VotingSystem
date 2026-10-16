<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Database\Seeders;

use Illuminate\Database\Seeder;

/** Permissions, system roles and the Super Admin account. Everything else depends on this running first. */
final class IdentityAccessDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(IdentitySeeder::class);
    }
}
