<?php

namespace Modules\IdentityAccess\Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(IdentitySeeder::class);
    }
}
