<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\Members\Models\Member;

/**
 * Inquiry's link to the shared Members list. Statement files are keyed by member code (stored UPPERCASE);
 * Members keeps codes as typed, so matching ignores case.
 */
final class MemberDirectory
{
    /**
     * @param  iterable<string>  $codes
     * @return array<string, Member> keyed by UPPERCASE member code
     */
    public static function find(iterable $codes): array
    {
        $unique = [];

        foreach ($codes as $code) {
            if ($code !== null && $code !== '') {
                $unique[strtoupper((string) $code)] = true;
            }
        }

        $found = [];

        foreach (array_chunk(array_keys($unique), 500) as $chunk) {
            foreach (Member::query()->whereIn(DB::raw('UPPER(member_code)'), $chunk)->get(['id', 'member_code', 'name', 'status']) as $member) {
                $found[strtoupper($member->member_code)] = $member;
            }
        }

        return $found;
    }

    /**
     * Prefer the Members list's name and add the member's status. Rows are arrays with a member_code.
     */
    public static function applyTo(LengthAwarePaginator $page): LengthAwarePaginator
    {
        $rows = $page->getCollection();
        $known = self::find($rows->pluck('member_code'));

        return $page->setCollection($rows->map(static function (array $row) use ($known): array {
            $member = $known[strtoupper((string) $row['member_code'])] ?? null;

            $row['member_name'] = $member?->name ?? ($row['member_name'] ?? null);
            $row['member_status'] = $member?->status;

            return $row;
        }));
    }
}
