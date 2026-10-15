<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Election\Actions\ImportMembers;
use Modules\Election\Models\Member;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'delinquent' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return $this->paginated(
            Member::query()
                ->when($filters['search'] ?? null, fn ($q, string $s) => $q->where(
                    fn ($q) => $q->whereLike('name', "%{$s}%")->orWhereLike('member_code', "%{$s}%"),
                ))
                ->when($request->has('delinquent'), fn ($q) => $q->where('is_delinquent', $request->boolean('delinquent')))
                ->orderBy('name')
                ->orderBy('id')
                ->paginate($filters['per_page'] ?? 25),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_code' => ['required', 'string', 'max:50', 'regex:/^\S+$/', 'unique:election_members,member_code'],
            'name' => ['required', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_delinquent' => ['nullable', 'boolean'],
        ]);

        $member = Member::query()->create($data);

        AuditLogger::record($request->user(), AuditAction::ElectionMemberCreated, $member, after: $member->attributesToArray());

        return response()->json(['data' => $member], 201);
    }

    public function update(Request $request, Member $member): JsonResponse
    {
        $data = $request->validate([
            'member_code' => ['sometimes', 'required', 'string', 'max:50', 'regex:/^\S+$/', Rule::unique('election_members', 'member_code')->ignore($member)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_delinquent' => ['nullable', 'boolean'],
        ]);

        $before = $member->attributesToArray();
        $member->update($data);

        AuditLogger::record($request->user(), AuditAction::ElectionMemberUpdated, $member, $before, $member->attributesToArray());

        return response()->json(['data' => $member]);
    }

    public function destroy(Request $request, Member $member): JsonResponse
    {
        if ($member->registrations()->exists()) {
            $this->fail('member', 'A member who registered for an assembly cannot be deleted.');
        }

        $before = $member->attributesToArray();
        $member->delete();

        AuditLogger::record($request->user(), AuditAction::ElectionMemberDeleted, $member, before: $before);

        return response()->json(status: 204);
    }

    public function import(Request $request, ImportMembers $action): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240']]);

        return response()->json(['data' => $action->execute($request->user(), $request->file('file'))]);
    }
}
