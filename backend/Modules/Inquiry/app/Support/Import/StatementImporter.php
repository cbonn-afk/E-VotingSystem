<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support\Import;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Inquiry\Enums\StatementType;

/**
 * Reads one accounting export. Columns are POSITIONAL (row 1 is a heading row and is ignored),
 * so files that worked in the old system keep working unchanged.
 *
 * Every import REPLACES the whole table for its type: the file is the full picture as of its date.
 * Nothing is written unless every row is valid.
 */
abstract class StatementImporter
{
    private const CHUNK = 200;

    abstract public function type(): StatementType;

    /** Template headings, in file column order. */
    abstract public function headings(): array;

    /** One example row for the downloadable template. */
    abstract public function sample(): array;

    /**
     * Clean one non-blank row.
     *
     * @param  array<int,mixed>  $cells
     * @return array{0: array<string,mixed>, 1: list<string>} attributes, problems
     */
    abstract public function parseRow(array $cells): array;

    /**
     * Cross-row checks (for example repeated member codes).
     *
     * @param  list<array<string,mixed>>  $rows  valid rows
     * @param  list<int>  $rowNumbers  spreadsheet row number of each valid row
     * @return list<array{row:int,message:string}>
     */
    public function crossCheck(array $rows, array $rowNumbers): array
    {
        return [];
    }

    /** The "as of" date the file carries, if it has one. */
    public function asOf(array $rows): ?string
    {
        return null;
    }

    /**
     * @return array{total:int, rows:list<array<string,mixed>>, errors:list<array{row:int,message:string}>, fatal:?string}
     */
    public function parse(UploadedFile $file): array
    {
        $sheets = Excel::toArray(new class implements ToArray
        {
            public function array(array $array): void {}
        }, $file);

        $sheet = $sheets[0] ?? [];
        array_shift($sheet); // heading row

        $rows = [];
        $rowNumbers = [];
        $errors = [];
        $total = 0;

        foreach (array_values($sheet) as $i => $cells) {
            if (Cells::isBlankRow($cells)) {
                continue;
            }

            $total++;
            $rowNo = $i + 2;
            [$attrs, $problems] = $this->parseRow($cells);

            if ($problems !== []) {
                $errors[] = ['row' => $rowNo, 'message' => implode('; ', $problems)];

                continue;
            }

            $rows[] = $attrs;
            $rowNumbers[] = $rowNo;
        }

        foreach ($this->crossCheck($rows, $rowNumbers) as $error) {
            $errors[] = $error;
        }

        usort($errors, static fn (array $a, array $b): int => $a['row'] <=> $b['row']);

        $fatal = $total === 0 ? 'The file has no data rows. Row 1 is the heading row; data starts on row 2.' : null;

        return ['total' => $total, 'rows' => $rows, 'errors' => $errors, 'fatal' => $fatal];
    }

    /** @param  list<array<string,mixed>>  $rows */
    public function replaceAll(array $rows): void
    {
        /** @var class-string<Model> $model */
        $model = $this->type()->model();
        $now = now();

        DB::transaction(function () use ($model, $rows, $now): void {
            $model::query()->delete();

            foreach (array_chunk($rows, self::CHUNK) as $chunk) {
                $model::query()->insert(array_map(
                    static fn (array $row): array => $row + ['created_at' => $now, 'updated_at' => $now],
                    $chunk,
                ));
            }
        });
    }
}
