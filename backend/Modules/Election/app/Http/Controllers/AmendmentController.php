<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Election\Models\Amendment;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class AmendmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->assembly($request)->amendments()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $assembly = $this->assembly($request);
        $assembly->assertSetupOpen();

        $amendment = Amendment::query()->create($this->validated($request) + ['assembly_id' => $assembly->id]);

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $amendment, after: $amendment->attributesToArray());

        return response()->json(['data' => $amendment], 201);
    }

    public function update(Request $request, Amendment $amendment): JsonResponse
    {
        $amendment->assembly->assertSetupOpen();

        $before = $amendment->attributesToArray();
        $amendment->update($this->validated($request));

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $amendment, $before, $amendment->attributesToArray());

        return response()->json(['data' => $amendment]);
    }

    public function destroy(Request $request, Amendment $amendment): JsonResponse
    {
        $amendment->assembly->assertSetupOpen();

        if ($amendment->votes()->exists()) {
            $this->fail('amendment', 'An amendment that already has votes cannot be deleted.');
        }

        $before = $amendment->attributesToArray();
        $amendment->delete();

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $amendment, before: $before);

        return response()->json(status: 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'proposed_by' => ['nullable', 'string', 'max:255'],
            'original_content' => ['required', 'string'],
            'proposed_content' => ['required', 'string'],
            'effect' => ['nullable', 'string'],
        ]);
    }
}
