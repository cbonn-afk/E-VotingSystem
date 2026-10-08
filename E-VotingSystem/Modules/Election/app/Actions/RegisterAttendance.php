<?php

declare(strict_types=1);

namespace Modules\Election\Actions;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Member;
use Modules\Election\Models\Registration;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;

final class RegisterAttendance
{
    public function execute(User $actor, Assembly $assembly, string $memberCode): Registration
    {
        if (! $assembly->status->allowsRegistration()) {
            $this->fail('Registration is not open for this assembly.');
        }

        $member = Member::query()->where('member_code', $memberCode)->first()
            ?? $this->fail('This member code is not recorded.');

        return DB::transaction(function () use ($actor, $assembly, $member): Registration {
            try {
                $registration = Registration::query()->create([
                    'assembly_id' => $assembly->id,
                    'member_id' => $member->id,
                    'registered_by' => $actor->id,
                    'registered_at' => now(),
                ]);
            } catch (UniqueConstraintViolationException) {
                $this->fail('This member has already registered for the general assembly.');
            }

            AuditLogger::record($actor, AuditAction::ElectionAttendanceRegistered, $registration, after: [
                'member_code' => $member->member_code,
                'assembly_year' => $assembly->year,
            ]);

            return $registration->load('member');
        });
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['member_code' => [$message]]);
    }
}
