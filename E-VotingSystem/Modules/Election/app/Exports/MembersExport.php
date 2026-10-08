<?php

declare(strict_types=1);

namespace Modules\Election\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Member;

/** Members with whether they registered and voted (never WHO they voted for). */
final class MembersExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Assembly $assembly) {}

    public function collection(): Collection
    {
        $registrations = $this->assembly->registrations()->get()->keyBy('member_id');

        return Member::query()->orderBy('name')->get()->map(function (Member $member) use ($registrations): array {
            $registration = $registrations->get($member->id);

            return [
                $member->member_code,
                $member->name,
                $member->birth_date?->format('Y-m-d'),
                $member->address,
                $member->is_delinquent ? 'Yes' : 'No',
                $registration ? 'Yes' : 'No',
                $registration?->election_voted_at ? 'Yes' : 'No',
                $registration?->amendments_voted_at ? 'Yes' : 'No',
            ];
        });
    }

    public function headings(): array
    {
        return ['Member Code', 'Name', 'Birth Date', 'Address', 'Delinquent', 'Registered', 'Voted (Election)', 'Voted (Amendments)'];
    }
}
