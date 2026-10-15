<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\Election\Models\CandidateVote;
use Modules\Election\Models\Position;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class PositionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->assembly($request)->positions()->with('candidates')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $assembly = $this->assembly($request);
        $assembly->assertSetupOpen();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'between:1,50'],
        ]);

        $position = Position::query()->create($data + [
            'assembly_id' => $assembly->id,
            'sort_order' => ((int) $assembly->positions()->max('sort_order')) + 1,
        ]);

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $position, after: $position->attributesToArray());

        return response()->json(['data' => $position->load('candidates')], 201);
    }

    public function update(Request $request, Position $position): JsonResponse
    {
        $position->assembly->assertSetupOpen();

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'seats' => ['sometimes', 'required', 'integer', 'between:1,50'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $before = $position->attributesToArray();
        $position->update($data);

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $position, $before, $position->attributesToArray());

        return response()->json(['data' => $position->load('candidates')]);
    }

    public function destroy(Request $request, Position $position): JsonResponse
    {
        $position->assembly->assertSetupOpen();

        if (CandidateVote::query()->where('position_id', $position->id)->exists()) {
            $this->fail('position', 'A position that already has votes cannot be deleted.');
        }

        $before = $position->attributesToArray();
        $position->candidates->each(fn ($candidate) => $this->deletePhoto($candidate->photo_path));
        $position->delete();

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $position, before: $before);

        return response()->json(status: 204);
    }

    private function deletePhoto(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
