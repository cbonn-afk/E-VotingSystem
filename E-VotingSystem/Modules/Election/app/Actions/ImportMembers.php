<?php

declare(strict_types=1);

namespace Modules\Election\Actions;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Election\Imports\MembersImport;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Models\User;
use Modules\IdentityAccess\Support\AuditLogger;

final class ImportMembers
{
    /** @return array{created: int, updated: int, skipped: int} */
    public function execute(User $actor, UploadedFile $file): array
    {
        return DB::transaction(function () use ($actor, $file): array {
            $import = new MembersImport;
            Excel::import($import, $file);

            $summary = [
                'created' => $import->created,
                'updated' => $import->updated,
                'skipped' => $import->skipped,
            ];

            AuditLogger::record($actor, AuditAction::ElectionMembersImported, $actor, after: $summary);

            return $summary;
        });
    }
}
