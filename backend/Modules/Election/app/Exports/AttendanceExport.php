<?php

declare(strict_types=1);

namespace Modules\Election\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\Registration;

final class AttendanceExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Assembly $assembly) {}

    public function collection(): Collection
    {
        return $this->assembly->registrations()
            ->with('member')
            ->orderBy('registered_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Registration $r): array => [
                $r->member->member_code,
                $r->member->name,
                $r->member->address,
                $r->member->birth_date?->format('Y-m-d'),
                $r->election_voted_at ? 'Yes' : 'No',
                $r->member->is_delinquent ? 'Yes' : 'No',
                $r->registered_at->timezone('Asia/Manila')->format('m-d-Y h:i:s A'),
            ]);
    }

    public function headings(): array
    {
        return ['Member Code', 'Name', 'Address', 'Birth Date', 'Voted', 'Delinquent', 'Time In'];
    }
}
