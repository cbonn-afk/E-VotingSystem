<?php

declare(strict_types=1);

namespace Modules\Members\Support;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Members\Models\Member;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

final class MemberImporter
{
    public const HEADERS = [
        'member_code', 'name', 'mobile_number', 'birth_date',
        'address', 'membership_date', 'status', 'is_delinquent',
    ];

    public const REQUIRED = ['member_code', 'name', 'mobile_number'];

    /**
     * Validate every row; save only when $commit is true.
     * Rows with errors are skipped. Existing member codes are updated.
     *
     * @return array{total:int,created:int,updated:int,errors:list<array{row:int,message:string}>,committed:bool,fatal:?string}
     */
    public function run(UploadedFile $file, bool $commit): array
    {
        $sheets = Excel::toArray(new class implements ToArray {
            public function array(array $array): void {}
        }, $file);

        $sheet = $sheets[0] ?? [];
        $headerRow = array_shift($sheet) ?? [];
        $headers = array_map(fn ($h): string => strtolower(trim((string) $h)), $headerRow);

        $missing = array_values(array_diff(self::REQUIRED, $headers));
        if ($missing !== []) {
            return $this->result(0, 0, 0, [], false, 'Missing required column(s): '.implode(', ', $missing));
        }

        $valid = [];
        $errors = [];
        $seen = [];
        $total = 0;

        foreach ($sheet as $i => $row) {
            $rowNo = $i + 2; // header is row 1
            $data = [];
            foreach ($headers as $idx => $name) {
                $data[$name] = $row[$idx] ?? null;
            }
            if (collect($data)->every(fn ($v) => $v === null || trim((string) $v) === '')) {
                continue; // blank row
            }
            $total++;

            $attrs = $this->parseRow($data);
            $problems = $attrs['_problems'];
            unset($attrs['_problems']);

            $code = $attrs['member_code'];
            if ($code !== '') {
                if (isset($seen[$code])) {
                    $problems[] = "member_code {$code} is repeated (first seen on row {$seen[$code]})";
                }
                $seen[$code] ??= $rowNo;
            }

            if ($problems !== []) {
                $errors[] = ['row' => $rowNo, 'message' => implode('; ', $problems)];

                continue;
            }
            $valid[] = $attrs;
        }

        $existing = Member::whereIn('member_code', array_column($valid, 'member_code'))
            ->pluck('id', 'member_code');

        $created = 0;
        $updated = 0;
        foreach ($valid as $a) {
            isset($existing[$a['member_code']]) ? $updated++ : $created++;
        }

        if ($commit && $valid !== []) {
            DB::transaction(function () use ($valid, $existing): void {
                foreach ($valid as $a) {
                    $values = array_filter($a, fn ($v) => $v !== null);
                    unset($values['member_code']);
                    if (! isset($existing[$a['member_code']])) {
                        $values += ['status' => 'active', 'is_delinquent' => false];
                    }
                    Member::updateOrCreate(['member_code' => $a['member_code']], $values);
                }
            });
        }

        return $this->result($total, $created, $updated, $errors, $commit, null);
    }

    /** @param array<string,mixed> $data */
    private function parseRow(array $data): array
    {
        $problems = [];
        $code = trim((string) ($data['member_code'] ?? ''));
        $name = trim((string) ($data['name'] ?? ''));
        $mobile = Member::normalizeMobile((string) ($data['mobile_number'] ?? ''));

        if ($code === '') {
            $problems[] = 'member_code is required';
        }
        if ($name === '') {
            $problems[] = 'name is required';
        }
        if ($mobile === null) {
            $problems[] = 'mobile_number is missing or not a valid PH number';
        }

        $birth = $this->parseDate($data['birth_date'] ?? null, 'birth_date', $problems);
        $since = $this->parseDate($data['membership_date'] ?? null, 'membership_date', $problems);

        $status = strtolower(trim((string) ($data['status'] ?? '')));
        if ($status !== '' && ! in_array($status, Member::STATUSES, true)) {
            $problems[] = 'status must be active or inactive';
            $status = '';
        }

        $delinquent = null;
        $raw = strtolower(trim((string) ($data['is_delinquent'] ?? '')));
        if ($raw !== '') {
            if (in_array($raw, ['yes', 'y', 'true', '1'], true)) {
                $delinquent = true;
            } elseif (in_array($raw, ['no', 'n', 'false', '0'], true)) {
                $delinquent = false;
            } else {
                $problems[] = 'is_delinquent must be yes or no';
            }
        }

        $address = trim((string) ($data['address'] ?? ''));

        return [
            'member_code' => $code,
            'name' => $name,
            'mobile_number' => $mobile,
            'birth_date' => $birth,
            'address' => $address === '' ? null : $address,
            'membership_date' => $since,
            'status' => $status === '' ? null : $status,
            'is_delinquent' => $delinquent,
            '_problems' => $problems,
        ];
    }

    /** Accepts YYYY-MM-DD text or an Excel serial number. */
    private function parseDate(mixed $value, string $field, array &$problems): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }
        try {
            if (is_numeric($value)) {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value))->format('Y-m-d');
            }

            return Carbon::createFromFormat('!Y-m-d', trim((string) $value))->format('Y-m-d');
        } catch (\Throwable) {
            $problems[] = "{$field} must be YYYY-MM-DD";

            return null;
        }
    }

    private function result(int $total, int $created, int $updated, array $errors, bool $committed, ?string $fatal): array
    {
        return compact('total', 'created', 'updated', 'errors', 'committed', 'fatal');
    }
}
