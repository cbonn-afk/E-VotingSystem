<?php

declare(strict_types=1);

namespace Modules\Election\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Election\Enums\AssemblyStatus;
use Modules\Election\Models\Amendment;
use Modules\Election\Models\AmendmentVote;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Candidate;
use Modules\Election\Models\CandidateVote;
use Modules\Election\Models\Position;
use Modules\Election\Models\Registration;
use Modules\Election\Models\Setting;
use Modules\Election\Models\TokenDistribution;
use Modules\IdentityAccess\Models\User;
use Modules\Members\Models\Member;

/**
 * A sample vote for the best tourist spots in the Philippines (2026 assembly, status "voting").
 *
 * Four categories (three single-seat, one "top 3"), two yes/no proposals, attendance for the eligible members,
 * token handouts, and anonymous ballots from most registered voters. A few registered members have NOT voted yet,
 * so voting can still be tried from the booth screen with their member codes.
 *
 * Ballots are random but repeatable (fixed seed). Skipped when the 2026 assembly already has positions.
 */
final class TouristSpotPollSeeder extends Seeder
{
    /**
     * Category => [seats, [candidate => popularity weight]]. A higher weight is picked more often.
     *
     * @var array<string, array{0:int, 1:array<string,int>}>
     */
    private const BALLOT = [
        'Best Beach Destination' => [1, [
            'Boracay Island, Aklan' => 9,
            'El Nido, Palawan' => 10,
            'Panglao Island, Bohol' => 6,
            'Siargao Island, Surigao del Norte' => 7,
            'Saud Beach, Pagudpud, Ilocos Norte' => 5,
        ]],
        'Best Natural Wonder' => [1, [
            'Puerto Princesa Underground River, Palawan' => 10,
            'Chocolate Hills, Bohol' => 8,
            'Mayon Volcano, Albay' => 7,
            'Hundred Islands National Park, Pangasinan' => 5,
        ]],
        'Best Historical and Cultural Site' => [1, [
            'Vigan Heritage Village, Ilocos Sur' => 10,
            'Intramuros, Manila' => 8,
            'Banaue Rice Terraces, Ifugao' => 9,
            'Paoay Church, Ilocos Norte' => 6,
            'Taal Heritage Town, Batangas' => 4,
        ]],
        'Top 3 Must-Visit Spots in the Philippines' => [3, [
            'El Nido, Palawan' => 9,
            'Boracay Island, Aklan' => 8,
            'Siargao Island, Surigao del Norte' => 6,
            'Coron, Palawan' => 8,
            'Puerto Princesa Underground River, Palawan' => 7,
            'Chocolate Hills, Bohol' => 6,
            'Vigan Heritage Village, Ilocos Sur' => 7,
            'Banaue Rice Terraces, Ifugao' => 6,
            'Mayon Volcano, Albay' => 5,
            'Bangui Windmills, Ilocos Norte' => 5,
        ]],
    ];

    public function run(): void
    {
        $assembly = Assembly::query()->updateOrCreate(
            ['year' => 2026],
            ['name' => 'Philippine Tourist Spot Poll 2026', 'status' => AssemblyStatus::Voting->value],
        );

        if ($assembly->positions()->exists()) {
            return;
        }

        $voters = Member::query()
            ->where('status', 'active')
            ->where('is_delinquent', false)
            ->where(fn ($q) => $q->whereNull('birth_date')->orWhere('birth_date', '<=', now()->subYears(18)->toDateString()))
            ->orderBy('member_code')
            ->get();

        if ($voters->isEmpty()) {
            $this->command?->warn('Tourist spot poll created without voters: run MembersDatabaseSeeder first.');
        }

        mt_srand(20261016);

        DB::transaction(function () use ($assembly, $voters): void {
            Setting::query()->firstOrCreate([], [
                'company_title' => 'Batman Travel Cooperative',
                'document_title' => 'Philippine Tourist Spot Poll',
                'document_sub_title' => 'Official results of the members\' vote',
            ]);

            $positions = $this->ballot($assembly);
            $amendments = $this->amendments($assembly);

            $registrar = User::query()->role('Election Registrar')->orderBy('id')->first()
                ?? User::query()->orderBy('id')->first();

            $this->registerAndVote($assembly, $voters, $positions, $amendments, $registrar);
        });
    }

    /** @return array<int, array{position: Position, seats: int, weights: array<int,int>}> */
    private function ballot(Assembly $assembly): array
    {
        $out = [];
        $order = 0;

        foreach (self::BALLOT as $title => [$seats, $candidates]) {
            $position = Position::query()->create([
                'assembly_id' => $assembly->id,
                'title' => $title,
                'seats' => $seats,
                'sort_order' => ++$order,
            ]);

            $weights = [];
            $sort = 0;

            foreach ($candidates as $name => $weight) {
                $candidate = Candidate::query()->create([
                    'position_id' => $position->id,
                    'name' => $name,
                    'photo_path' => $this->photo($name),
                    'sort_order' => ++$sort,
                ]);
                $weights[$candidate->id] = $weight;
            }

            $out[] = ['position' => $position, 'seats' => $seats, 'weights' => $weights];
        }

        return $out;
    }

    /**
     * Copies database/seeders/images/tourist-spots/<slug>.(jpg|jpeg|png|webp) to the public disk and returns its path.
     * The slug is the spot name before the comma ("El Nido, Palawan" -> el-nido). Returns null when no file exists.
     * Drop real photos in that folder with the same name to replace the placeholders, then re-seed.
     */
    private function photo(string $name): ?string
    {
        $slug = Str::slug(Str::before($name, ','));

        foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
            $file = __DIR__."/images/tourist-spots/{$slug}.{$ext}";

            if (File::exists($file)) {
                $path = "election/candidates/{$slug}.{$ext}";
                Storage::disk('public')->put($path, File::get($file));

                return $path;
            }
        }

        return null;
    }

    /** @return list<Amendment> */
    private function amendments(Assembly $assembly): array
    {
        return [
            Amendment::query()->create([
                'assembly_id' => $assembly->id,
                'title' => 'Add a "Best Food Trip Destination" category',
                'proposed_by' => 'Tourism Committee',
                'original_content' => 'The poll has four categories: beach, natural wonder, historical and cultural site, and top 3 must-visit spots.',
                'proposed_content' => 'The poll has five categories. A new category, Best Food Trip Destination, is added for regional cuisine.',
                'effect' => 'Members get one more category to vote on. Previous results are not affected.',
            ]),
            Amendment::query()->create([
                'assembly_id' => $assembly->id,
                'title' => 'Hold the tourist spot poll every year',
                'proposed_by' => 'Board of Directors',
                'original_content' => 'The poll is held only when the General Assembly approves it.',
                'proposed_content' => 'The poll is held once every year, during the General Assembly.',
                'effect' => 'The poll becomes a yearly activity and the top spots are used for the cooperative\'s annual tour.',
            ]),
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Member>  $voters
     * @param  array<int, array{position: Position, seats: int, weights: array<int,int>}>  $positions
     * @param  list<Amendment>  $amendments
     */
    private function registerAndVote(Assembly $assembly, $voters, array $positions, array $amendments, ?User $registrar): void
    {
        $candidateRows = [];
        $amendmentRows = [];

        foreach ($voters as $i => $member) {
            // About 1 in 8 eligible members did not come to the assembly.
            if (mt_rand(1, 8) === 1) {
                continue;
            }

            $arrived = now()->subHours(6)->addMinutes($i * 4);

            $registration = Registration::query()->create([
                'assembly_id' => $assembly->id,
                'member_id' => $member->id,
                'registered_by' => $registrar?->id,
                'registered_at' => $arrived,
            ]);

            TokenDistribution::query()->create([
                'assembly_id' => $assembly->id,
                'member_id' => $member->id,
                'issued_by' => $registrar?->id,
                'issued_at' => $arrived->copy()->addMinutes(2),
            ]);

            // The last few registered members are left unvoted on purpose, so the booth can still be tried.
            $isLeftToTest = $i >= $voters->count() - 4;

            if (! $isLeftToTest && mt_rand(1, 100) <= 80) {
                foreach ($positions as $p) {
                    // Roughly 1 in 12 voters abstains on a category.
                    if (mt_rand(1, 12) === 1) {
                        continue;
                    }

                    foreach ($this->pick($p['weights'], $p['seats']) as $candidateId) {
                        $candidateRows[] = [
                            'assembly_id' => $assembly->id,
                            'position_id' => $p['position']->id,
                            'candidate_id' => $candidateId,
                        ];
                    }
                }

                $registration->election_voted_at = $arrived->copy()->addMinutes(10);
            }

            if (! $isLeftToTest && mt_rand(1, 100) <= 70) {
                foreach ($amendments as $amendment) {
                    $amendmentRows[] = [
                        'assembly_id' => $assembly->id,
                        'amendment_id' => $amendment->id,
                        'choice' => mt_rand(1, 100) <= 72 ? 'agree' : 'disagree',
                    ];
                }

                $registration->amendments_voted_at = $arrived->copy()->addMinutes(12);
            }

            $registration->save();
        }

        // Anonymous rows: no voter reference and no timestamps, same as the real ballot.
        foreach (array_chunk($candidateRows, 200) as $chunk) {
            CandidateVote::query()->insert($chunk);
        }
        foreach (array_chunk($amendmentRows, 200) as $chunk) {
            AmendmentVote::query()->insert($chunk);
        }
    }

    /**
     * Picks $count distinct candidates, each draw favouring the heavier weights.
     *
     * @param  array<int,int>  $weights  candidate id => weight
     * @return list<int>
     */
    private function pick(array $weights, int $count): array
    {
        $chosen = [];

        for ($n = 0; $n < $count && $weights !== []; $n++) {
            $roll = mt_rand(1, array_sum($weights));

            foreach ($weights as $id => $weight) {
                $roll -= $weight;

                if ($roll <= 0) {
                    $chosen[] = $id;
                    unset($weights[$id]);

                    break;
                }
            }
        }

        return $chosen;
    }
}
