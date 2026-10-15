<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Election\Actions\CastBallot;
use Modules\Election\Enums\AmendmentChoice;
use Modules\Election\Models\Assembly;
use Modules\Election\Support\VoterEligibility;

final class VotingController extends Controller
{
    /** What the voting station shows: positions, candidates, amendments. No counts. */
    public function ballot(): JsonResponse
    {
        $assembly = Assembly::currentOrFail();

        if (! $assembly->status->allowsVoting()) {
            $this->fail('assembly', 'Voting is not open.');
        }

        return response()->json(['data' => [
            'assembly' => ['id' => $assembly->id, 'year' => $assembly->year, 'name' => $assembly->name],
            'positions' => $assembly->positions()->with('candidates')->get(),
            'amendments' => $assembly->amendments()->get(),
        ]]);
    }

    public function eligibility(Request $request): JsonResponse
    {
        $data = $request->validate(['member_code' => ['required', 'string']]);
        $assembly = Assembly::currentOrFail();

        if (! $assembly->status->allowsVoting()) {
            $this->fail('assembly', 'Voting is not open.');
        }

        $registration = VoterEligibility::check($assembly, $data['member_code']);

        return response()->json(['data' => [
            'member_code' => $registration->member->member_code,
            'name' => $registration->member->name,
            'sections' => VoterEligibility::sections($assembly, $registration),
        ]]);
    }

    public function cast(Request $request, CastBallot $action): JsonResponse
    {
        $data = $request->validate([
            'member_code' => ['required', 'string'],
            'votes' => ['nullable', 'array'],
            'votes.*.position_id' => ['required', 'integer'],
            'votes.*.candidate_ids' => ['present', 'array'],
            'votes.*.candidate_ids.*' => ['integer'],
            'amendments' => ['nullable', 'array'],
            'amendments.*.amendment_id' => ['required', 'integer'],
            'amendments.*.choice' => ['required', Rule::enum(AmendmentChoice::class)],
        ]);

        $action->execute(
            $request->user(),
            Assembly::currentOrFail(),
            $data['member_code'],
            $data['votes'] ?? null,
            $data['amendments'] ?? null,
        );

        return response()->json(['message' => 'Your vote has been recorded.'], 201);
    }
}
