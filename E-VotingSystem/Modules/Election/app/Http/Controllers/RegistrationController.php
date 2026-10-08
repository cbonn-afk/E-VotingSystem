<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Election\Actions\RegisterAttendance;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Member;
use Modules\Election\Models\Registration;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class RegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return $this->paginated(
            $this->assembly($request)->registrations()
                ->with('member')
                ->when($filters['search'] ?? null, fn ($q, string $s) => $q->whereHas(
                    'member',
                    fn ($q) => $q->whereLike('name', "%{$s}%")->orWhereLike('member_code', "%{$s}%"),
                ))
                ->orderBy('registered_at')
                ->orderBy('id')
                ->paginate($filters['per_page'] ?? 25),
        );
    }

    /** Registration desk: find a member by code and say whether they already signed in. */
    public function lookup(string $memberCode): JsonResponse
    {
        $assembly = Assembly::currentOrFail();

        $member = Member::query()->where('member_code', $memberCode)->first()
            ?? $this->fail('member_code', 'This member code is not recorded.');

        return response()->json(['data' => [
            'member' => $member,
            'registered' => $assembly->registrations()->where('member_id', $member->id)->exists(),
        ]]);
    }

    public function store(Request $request, RegisterAttendance $action): JsonResponse
    {
        $data = $request->validate(['member_code' => ['required', 'string']]);

        $registration = $action->execute($request->user(), Assembly::currentOrFail(), $data['member_code']);

        return response()->json(['data' => $registration], 201);
    }

    public function destroy(Request $request, Registration $registration): JsonResponse
    {
        if ($registration->hasVoted()) {
            $this->fail('registration', 'A member who has already voted cannot be removed.');
        }

        if (! $registration->assembly->status->allowsRegistration()) {
            $this->fail('registration', 'Registration is closed for this assembly.');
        }

        $registration->loadMissing('member');
        $before = ['member_code' => $registration->member->member_code, 'assembly_year' => $registration->assembly->year];
        $registration->delete();

        AuditLogger::record($request->user(), AuditAction::ElectionAttendanceRemoved, $registration, before: $before);

        return response()->json(status: 204);
    }
}
