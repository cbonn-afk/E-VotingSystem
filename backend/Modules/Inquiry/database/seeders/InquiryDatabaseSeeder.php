<?php

declare(strict_types=1);

namespace Modules\Inquiry\Database\Seeders;

use Illuminate\Database\Seeder;

/** Needs IdentitySeeder (permissions) and MembersDatabaseSeeder to have run first. */
final class InquiryDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            InquiryRoleSeeder::class,
            InquiryStatementSeeder::class,
            InquiryAnnouncementSeeder::class,
        ]);
    }
}
