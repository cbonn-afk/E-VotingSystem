<?php

declare(strict_types=1);

namespace Modules\Inquiry\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Modules\IdentityAccess\Enums\UserStatus;
use Modules\IdentityAccess\Models\User;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

abstract class InquiryTestCase extends TestCase
{
    use RefreshDatabase;

    protected function staff(array $permissions): User
    {
        $user = User::query()->create([
            'name' => 'Staff',
            'email' => Str::random(8).'@example.test',
            'password' => 'password',
            'status' => UserStatus::Active,
            'require_password_change' => false,
        ]);

        foreach ($permissions as $name) {
            $user->givePermissionTo(Permission::findOrCreate($name, 'web'));
        }

        return $user;
    }

    /** CSV keeps the tests independent of Excel binaries; the importer reads it the same way. */
    protected function csv(string $name, array $rows): UploadedFile
    {
        $lines = array_map(static fn (array $r): string => implode(',', $r), $rows);

        return UploadedFile::fake()->createWithContent($name, implode("\n", $lines)."\n");
    }

    protected function balancesCsv(array $dataRows): UploadedFile
    {
        return $this->csv('balances.csv', [
            ['rf_id', 'member_code', 'member_name', 'share_capital', 'savings_bonus', 'regular_savings', 'div_sc', 'div_sv', 'as_of_date', 'time_deposit'],
            ...$dataRows,
        ]);
    }
}
