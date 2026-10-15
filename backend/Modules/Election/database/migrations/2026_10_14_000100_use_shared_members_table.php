<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Moves Election onto the Members module's `members` table.
 *  1. Members that exist only in `election_members` are copied into `members` (existing members win).
 *  2. Registrations and token distributions are re-pointed to the matching `members.id` (matched by member_code).
 *  3. `election_members` is dropped.
 * Not reversible: restore a backup if you need the old table back.
 */
return new class extends Migration
{
    private const TABLES = ['election_registrations', 'election_token_distributions'];

    /** Added to every member_id first so old and new ids can never collide mid-update. */
    private const OFFSET = 1_000_000_000;

    public function up(): void
    {
        if (! Schema::hasTable('election_members')) {
            return;
        }

        $now = now();

        DB::table('election_members')->orderBy('id')->chunkById(500, function ($rows) use ($now): void {
            $existing = DB::table('members')->whereIn('member_code', $rows->pluck('member_code'))->pluck('member_code')->all();

            $new = $rows->reject(fn ($r) => in_array($r->member_code, $existing, true))->map(fn ($r): array => [
                'member_code' => $r->member_code,
                'name' => $r->name,
                'birth_date' => $r->birth_date,
                'address' => $r->address,
                'is_delinquent' => $r->is_delinquent,
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ])->values()->all();

            if ($new !== []) {
                DB::table('members')->insert($new);
            }
        });

        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $t): void {
                $t->dropForeign(['member_id']);
            });

            DB::statement("UPDATE {$table} SET member_id = member_id + ".self::OFFSET);
            DB::statement(
                "UPDATE {$table} SET member_id = (
                    SELECT m.id FROM members m
                    JOIN election_members e ON e.member_code = m.member_code
                    WHERE e.id = {$table}.member_id - ".self::OFFSET.'
                )'
            );

            Schema::table($table, function (Blueprint $t): void {
                $t->foreign('member_id')->references('id')->on('members')->restrictOnDelete();
            });
        }

        Schema::drop('election_members');
    }

    public function down(): void
    {
        // Intentionally empty: the old table cannot be rebuilt faithfully.
    }
};
