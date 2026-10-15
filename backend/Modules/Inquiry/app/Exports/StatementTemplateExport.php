<?php

declare(strict_types=1);

namespace Modules\Inquiry\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Modules\Inquiry\Support\Import\StatementImporter;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

/** Import template. Every column is Text so Excel keeps leading zeros and date strings as typed. */
final class StatementTemplateExport implements FromArray, WithColumnFormatting, WithHeadings
{
    public function __construct(private readonly StatementImporter $importer) {}

    public function headings(): array
    {
        return $this->importer->headings();
    }

    public function array(): array
    {
        return [$this->importer->sample()];
    }

    public function columnFormats(): array
    {
        $last = chr(ord('A') + count($this->importer->headings()) - 1);

        return array_fill_keys(range('A', $last), NumberFormat::FORMAT_TEXT);
    }
}
