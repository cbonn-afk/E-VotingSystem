<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Modules\Members\Models\Member;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table): void {
            $table->string('password')->nullable()->after('member_code');
            // true until the member replaces the default password at first sign-in.
            $table->boolean('require_password_change')->default(true)->after('password');
        });

        // Members that already exist get the default password too, so they can sign in and must change it.
        DB::table('members')->whereNull('password')->update([
            'password' => Hash::make(Member::DEFAULT_PASSWORD),
            'require_password_change' => true,
        ]);
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table): void {
            $table->dropColumn(['password', 'require_password_change']);
        });
    }
};
