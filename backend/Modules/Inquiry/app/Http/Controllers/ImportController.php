<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Inquiry\Actions\ImportStatement;
use Modules\Inquiry\Enums\StatementType;
use Modules\Inquiry\Exports\StatementTemplateExport;
use Modules\Inquiry\Models\ImportBatch;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class ImportController extends Controller
{
    /** Latest imports, newest first. */
    public function index(): JsonResponse
    {
        $batches = ImportBatch::query()->with('importer:id,name')->latest('id')->limit(30)->get()
            ->map(static fn (ImportBatch $b): array => [
                'id' => $b->id,
                'type' => $b->type,
                'file_name' => $b->file_name,
                'row_count' => $b->row_count,
                'as_of_date' => $b->as_of_date?->format('Y-m-d'),
                'imported_by' => $b->importer?->name,
                'imported_at' => $b->created_at?->toISOString(),
            ]);

        return response()->json(['data' => $batches]);
    }

    /** POST file + commit=0 (check only) or commit=1 (replace the data). */
    public function store(Request $request, string $type, ImportStatement $action): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
            'commit' => ['sometimes', 'boolean'],
        ]);

        $result = $action->execute(
            $request->user(),
            StatementType::from($type),
            $request->file('file'),
            $request->boolean('commit'),
        );

        return response()->json(
            ['message' => $result['fatal'] ?? 'Import checked.', 'data' => $result],
            $result['fatal'] === null ? 200 : 422,
        );
    }

    public function template(string $type): BinaryFileResponse
    {
        $statementType = StatementType::from($type);

        return Excel::download(new StatementTemplateExport($statementType->importer()), "{$statementType->value}-template.xlsx");
    }
}
