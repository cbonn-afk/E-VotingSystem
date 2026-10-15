<?php

declare(strict_types=1);

namespace Modules\Members\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Modules\Members\Support\MemberImporter;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

/** Import template. Every column is Text so Excel keeps leading zeros and date strings. */
final class MemberTemplateExport implements FromArray, WithColumnFormatting, WithHeadings
{
    public function headings(): array
    {
        return MemberImporter::HEADERS;
    }

    public function array(): array
    {
        return [[
            'M-0001', 'Juan Dela Cruz', '09171234567', '1985-03-21',
            'Bayambang, Pangasinan', '2015-06-01', 'active', 'no',
        ]];
    }

    public function columnFormats(): array
    {
        return array_fill_keys(range('A', 'H'), NumberFormat::FORMAT_TEXT);
    }
}
