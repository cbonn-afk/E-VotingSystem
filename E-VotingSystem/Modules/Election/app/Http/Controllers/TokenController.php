<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Member;
use Modules\Election\Models\TokenDistribution;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class TokenController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $assembly = $this->assembly($request);

        return $this->paginated(
            TokenDistribution::query()
                ->where('assembly_id', $assembly->id)
                ->with('member')
                ->orderByDesc('issued_at')
                ->orderByDesc('id')
                ->paginate(25),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['member_code' => ['required', 'string']]);
        $assembly = Assembly::currentOrFail();

        $member = Member::query()->where('member_code', $data['member_code'])->first()
            ?? $this->fail('member_code', 'This member code is not recorded.');

        if (! $assembly->registrations()->where('member_id', $member->id)->exists()) {
            $this->fail('member_code', 'This member has not registered to attend the general assembly.');
        }

        if (TokenDistribution::query()->where('assembly_id', $assembly->id)->where('member_id', $member->id)->exists()) {
            $this->fail('member_code', 'This member already received the item.');
        }

        $token = TokenDistribution::query()->create([
            'assembly_id' => $assembly->id,
            'member_id' => $member->id,
            'issued_by' => $request->user()->id,
            'issued_at' => now(),
        ]);

        AuditLogger::record($request->user(), AuditAction::ElectionTokenIssued, $token, after: [
            'member_code' => $member->member_code,
            'assembly_year' => $assembly->year,
        ]);

        return response()->json(['data' => $token->load('member')], 201);
    }
}
