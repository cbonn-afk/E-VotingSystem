<?php

declare(strict_types=1);

namespace Modules\Election\Imports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Modules\Election\Models\Member;
use PhpOffice\PhpSpreadsheet\Shared\Date;

/**
 * Columns: A member code, B name, C birth date, D address, E delinquent (yes/no).
 * Existing members are UPDATED by member code; nothing is ever truncated.
 */
final class MembersImport implements ToCollection, WithStartRow
{
    public int $created = 0;

    public int $updated = 0;

    public int $skipped = 0;

    public function startRow(): int
    {
        return 2;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            $code = preg_replace('/\s+/', '', (string) ($row[0] ?? ''));
            $name = trim((string) ($row[1] ?? ''));

            if ($code === '' || $name === '') {
                $this->skipped++;

                continue;
            }

            $member = Member::query()->firstOrNew(['member_code' => $code]);
            $existed = $member->exists;

            $member->fill([
                'name' => $name,
                'birth_date' => $this->date($row[2] ?? null),
                'address' => ($row[3] ?? null) !== null ? trim((string) $row[3]) : null,
                'is_delinquent' => in_array(strtolower(trim((string) ($row[4] ?? ''))), ['yes', 'y', 'true', '1'], true),
            ])->save();

            $existed ? $this->updated++ : $this->created++;
        }
    }

    private function date(mixed $value): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return Carbon::instance(Date::excelToDateTimeObject($value));
        }

        try {
            return Carbon::parse((string) $value);
        } catch (\Throwable) {
            return null;
        }
    }
}
