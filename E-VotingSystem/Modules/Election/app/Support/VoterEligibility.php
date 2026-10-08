<?php

declare(strict_types=1);

namespace Modules\Election\Support;

use Illuminate\Validation\ValidationException;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Member;
use Modules\Election\Models\Registration;

final class VoterEligibility
{
    public const MINIMUM_AGE = 18;

    /**
     * Returns the voter's registration (with `member` loaded) or throws a
     * readable validation error. Pass `lock: true` inside a transaction to
     * stop two stations from accepting the same voter at once.
     */
    public static function check(Assembly $assembly, string $memberCode, bool $lock = false): Registration
    {
        $member = Member::query()->where('member_code', $memberCode)->first()
            ?? self::fail('This member code is not recorded.');

        $query = Registration::query()
            ->where('assembly_id', $assembly->id)
            ->where('member_id', $member->id);

        if ($lock) {
            $query->lockForUpdate();
        }

        $registration = $query->first()
            ?? self::fail('This member has not registered to attend the general assembly.');

        if ($member->birth_date !== null && $member->birth_date->age < self::MINIMUM_AGE) {
            self::fail('Voting is not possible since the member is underage.');
        }

        if ($member->is_delinquent) {
            self::fail('Voting is not possible since the account is past due.');
        }

        $sections = self::sections($assembly, $registration);

        if (! $sections['election'] && ! $sections['amendments']) {
            self::fail('This member has already used up their vote privilege.');
        }

        return $registration->setRelation('member', $member);
    }

    /**
     * Which parts of the ballot this member can still vote on.
     *
     * @return array{election: bool, amendments: bool}
     */
    public static function sections(Assembly $assembly, Registration $registration): array
    {
        return [
            'election' => $registration->election_voted_at === null
                && $assembly->positions()->exists(),
            'amendments' => $registration->amendments_voted_at === null
                && $assembly->amendments()->exists(),
        ];
    }

    private static function fail(string $message): never
    {
        throw ValidationException::withMessages(['member_code' => [$message]]);
    }
}
