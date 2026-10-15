<?php

declare(strict_types=1);

namespace Modules\Election\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Modules\Election\Models\Assembly;
use Modules\Election\Models\TokenDistribution;

final class TokenDistributionExport implements FromCollection, WithHeadings
{
    public function __construct(private readonly Assembly $assembly) {}

    public function collection(): Collection
    {
        return TokenDistribution::query()
            ->where('assembly_id', $this->assembly->id)
            ->with('member')
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn (TokenDistribution $t): array => [
                $t->member->member_code,
                $t->member->name,
                $t->issued_at->timezone('Asia/Manila')->format('Y-m-d h:i:s A'),
            ]);
    }

    public function headings(): array
    {
        return ['Member Code', 'Name', 'Date/Time Issued'];
    }
}
