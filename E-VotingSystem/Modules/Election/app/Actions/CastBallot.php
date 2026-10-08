<?php

declare(strict_types=1);

namespace Modules\Election\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Election\Models\Amendment;
use Modules\Election\Models\AmendmentVote;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\CandidateVote;
use Modules\Election\Models\Position;
use Modules\Election\Support\VoterEligibility;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;

final class CastBallot
{
    /**
     * Seats and ownership are always read from the database, never trusted
     * from the request. Pass `null` for a section the voter is not voting on;
     * an empty array means "abstain on everything in that section".
     *
     * @param  list<array{position_id: int, candidate_ids: list<int>}>|null  $votes
     * @param  list<array{amendment_id: int, choice: string}>|null  $amendments
     */
    public function execute(
        User $actor,
        Assembly $assembly,
        string $memberCode,
        ?array $votes,
        ?array $amendments,
    ): void {
        if (! $assembly->status->allowsVoting()) {
            $this->fail('assembly', 'Voting is not open.');
        }

        if ($votes === null && $amendments === null) {
            $this->fail('votes', 'There is nothing to submit.');
        }

        DB::transaction(function () use ($actor, $assembly, $memberCode, $votes, $amendments): void {
            $registration = VoterEligibility::check($assembly, $memberCode, lock: true);
            $sections = VoterEligibility::sections($assembly, $registration);
            $cast = [];

            if ($votes !== null) {
                if (! $sections['election']) {
                    $this->fail('votes', 'The election vote was already submitted, or there is no election.');
                }

                $this->castElection($assembly, $votes);
                $registration->election_voted_at = now();
                $cast[] = 'election';
            }

            if ($amendments !== null) {
                if (! $sections['amendments']) {
                    $this->fail('amendments', 'The amendment vote was already submitted, or there are no amendments.');
                }

                $this->castAmendments($assembly, $amendments);
                $registration->amendments_voted_at = now();
                $cast[] = 'amendments';
            }

            $registration->save();

            // Audit records THAT the member voted, never WHAT they chose.
            AuditLogger::record($actor, AuditAction::ElectionBallotCast, $registration, after: ['sections' => $cast]);
        });
    }

    private function castElection(Assembly $assembly, array $votes): void
    {
        $positions = Position::query()
            ->where('assembly_id', $assembly->id)
            ->with('candidates:id,position_id')
            ->get()
            ->keyBy('id');

        $seen = [];
        $rows = [];

        foreach ($votes as $vote) {
            $position = $positions->get((int) $vote['position_id'])
                ?? $this->fail('votes', 'The ballot contains an unknown position.');

            if (isset($seen[$position->id])) {
                $this->fail('votes', "Position [{$position->title}] appears more than once.");
            }
            $seen[$position->id] = true;

            $ids = array_map('intval', $vote['candidate_ids']);

            if (count($ids) !== count(array_unique($ids))) {
                $this->fail('votes', "A candidate was selected twice for [{$position->title}].");
            }

            if (count($ids) > $position->seats) {
                $this->fail('votes', "You can vote for at most {$position->seats} candidate(s) for [{$position->title}].");
            }

            $valid = $position->candidates->pluck('id')->all();

            foreach ($ids as $id) {
                if (! in_array($id, $valid, true)) {
                    $this->fail('votes', "A selected candidate does not belong to [{$position->title}].");
                }

                $rows[] = [
                    'assembly_id' => $assembly->id,
                    'position_id' => $position->id,
                    'candidate_id' => $id,
                ];
            }
        }

        if ($rows !== []) {
            CandidateVote::query()->insert($rows);
        }
    }

    private function castAmendments(Assembly $assembly, array $amendments): void
    {
        $valid = Amendment::query()->where('assembly_id', $assembly->id)->pluck('id')->all();
        $seen = [];
        $rows = [];

        foreach ($amendments as $item) {
            $id = (int) $item['amendment_id'];

            if (! in_array($id, $valid, true)) {
                $this->fail('amendments', 'The ballot contains an unknown amendment.');
            }

            if (isset($seen[$id])) {
                $this->fail('amendments', 'An amendment appears more than once.');
            }
            $seen[$id] = true;

            $rows[] = [
                'assembly_id' => $assembly->id,
                'amendment_id' => $id,
                'choice' => $item['choice'],
            ];
        }

        if ($rows !== []) {
            AmendmentVote::query()->insert($rows);
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }
}
