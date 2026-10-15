<?php

declare(strict_types=1);

namespace Modules\Inquiry\Actions;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Inquiry\Enums\StatementType;
use Modules\Inquiry\Models\ImportBatch;
use Modules\Members\Models\Member;

final class ImportStatement
{
    /**
     * Check a file ($commit = false) or load it ($commit = true).
     * Loading replaces ALL existing rows of that type and only happens when every row is valid.
     *
     * @return array{type:string,total:int,importable:int,existing:int,errors:list<array{row:int,message:string}>,warnings:list<string>,as_of_date:?string,committed:bool,fatal:?string}
     */
    public function execute(User $actor, StatementType $type, UploadedFile $file, bool $commit): array
    {
        $importer = $type->importer();
        $parsed = $importer->parse($file);
        $model = $type->model();
        $existing = $model::query()->count();

        $result = [
            'type' => $type->value,
            'total' => $parsed['total'],
            'importable' => count($parsed['rows']),
            'existing' => $existing,
            'errors' => $parsed['errors'],
            'warnings' => $parsed['fatal'] === null ? $this->unmatchedMembers($parsed['rows']) : [],
            'as_of_date' => $importer->asOf($parsed['rows']),
            'committed' => false,
            'fatal' => $parsed['fatal'],
        ];

        if ($parsed['fatal'] !== null || ! $commit) {
            return $result;
        }

        if ($parsed['errors'] !== []) {
            $count = count($parsed['errors']);
            $result['fatal'] = "Fix the {$count} row error(s) listed before importing. Nothing was changed.";

            return $result;
        }

        DB::transaction(function () use ($actor, $type, $file, $importer, $parsed, $result): void {
            $importer->replaceAll($parsed['rows']);

            $batch = ImportBatch::query()->create([
                'type' => $type->value,
                'file_name' => substr($file->getClientOriginalName(), 0, 255),
                'row_count' => count($parsed['rows']),
                'as_of_date' => $result['as_of_date'],
                'imported_by' => $actor->getKey(),
            ]);

            AuditLogger::record($actor, AuditAction::InquiryStatementsImported, $batch, after: $batch->attributesToArray());
        });

        $result['committed'] = true;

        return $result;
    }

    /**
     * Codes in the file that are not in the Members list. Not an error: the accounting system is the source,
     * but a typo in a code is easy to spot this way.
     *
     * @param  list<array<string,mixed>>  $rows
     * @return list<string>
     */
    private function unmatchedMembers(array $rows): array
    {
        if (! class_exists(Member::class) || ! Schema::hasTable('members')) {
            return [];
        }

        $codes = array_values(array_unique(array_column($rows, 'member_code')));
        $known = [];

        foreach (array_chunk($codes, 500) as $chunk) {
            foreach (Member::query()->whereIn(DB::raw('UPPER(member_code)'), $chunk)->pluck('member_code') as $code) {
                $known[strtoupper((string) $code)] = true;
            }
        }

        $missing = array_values(array_filter($codes, static fn (string $code): bool => ! isset($known[$code])));

        if ($missing === []) {
            return [];
        }

        $sample = implode(', ', array_slice($missing, 0, 5));
        $more = count($missing) > 5 ? ', …' : '';

        return [count($missing)." member code(s) in this file are not in the Members list yet (for example: {$sample}{$more})."];
    }
}
