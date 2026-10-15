<?php

declare(strict_types=1);

namespace Modules\Election\Actions;

use Modules\Election\Models\Amendment;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Position;

final class TallyResults
{
    /** @return array<string, mixed> */
    public function execute(Assembly $assembly): array
    {
        $registered = $assembly->registrations()->count();

        $positions = Position::query()
            ->where('assembly_id', $assembly->id)
            ->with(['candidates' => fn ($q) => $q->withCount('votes')])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Position $position): array => $this->position($position))
            ->all();

        $amendments = Amendment::query()
            ->where('assembly_id', $assembly->id)
            ->withCount([
                'votes as agree_count' => fn ($q) => $q->where('choice', 'agree'),
                'votes as disagree_count' => fn ($q) => $q->where('choice', 'disagree'),
            ])
            ->orderBy('id')
            ->get()
            ->map(fn (Amendment $a): array => [
                'id' => $a->id,
                'title' => $a->title,
                'proposed_by' => $a->proposed_by,
                'agree' => $a->agree_count,
                'disagree' => $a->disagree_count,
                'abstained' => max(0, $registered - $a->agree_count - $a->disagree_count),
                'passed' => $a->agree_count > $a->disagree_count,
            ])
            ->all();

        return [
            'assembly' => [
                'id' => $assembly->id,
                'year' => $assembly->year,
                'name' => $assembly->name,
                'status' => $assembly->status->value,
            ],
            'turnout' => [
                'registered' => $registered,
                'election_voters' => $assembly->registrations()->whereNotNull('election_voted_at')->count(),
                'amendment_voters' => $assembly->registrations()->whereNotNull('amendments_voted_at')->count(),
            ],
            'positions' => $positions,
            'amendments' => $amendments,
        ];
    }

    /** @return array<string, mixed> */
    private function position(Position $position): array
    {
        $sorted = $position->candidates->sortByDesc('votes_count')->values();
        $cutoff = $sorted->get($position->seats - 1)?->votes_count;
        $next = $sorted->get($position->seats)?->votes_count;

        // A tie for the last seat means nobody at that level is marked elected.
        $tie = $cutoff !== null && $next !== null && $cutoff === $next && $cutoff > 0;

        return [
            'id' => $position->id,
            'title' => $position->title,
            'seats' => $position->seats,
            'total_votes' => $sorted->sum('votes_count'),
            'tie_for_last_seat' => $tie,
            'candidates' => $sorted->map(fn ($candidate, int $index): array => [
                'id' => $candidate->id,
                'name' => $candidate->name,
                'photo_url' => $candidate->photo_url,
                'votes' => $candidate->votes_count,
                'elected' => $candidate->votes_count > 0
                    && ($tie ? $candidate->votes_count > $cutoff : $index < $position->seats),
            ])->all(),
        ];
    }
}
