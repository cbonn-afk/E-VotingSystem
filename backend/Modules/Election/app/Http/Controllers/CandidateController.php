<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\Election\Models\Candidate;
use Modules\Election\Models\CandidateVote;
use Modules\Election\Models\Position;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class CandidateController extends Controller
{
    public function store(Request $request, Position $position): JsonResponse
    {
        $position->assembly->assertSetupOpen();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $candidate = Candidate::query()->create([
            'position_id' => $position->id,
            'name' => $data['name'],
            'photo_path' => $request->hasFile('photo')
                ? $request->file('photo')->store('election/candidates', 'public')
                : null,
            'sort_order' => ((int) $position->candidates()->max('sort_order')) + 1,
        ]);

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $candidate, after: $candidate->attributesToArray());

        return response()->json(['data' => $candidate], 201);
    }

    /** POST (not PATCH) because the form may carry a photo (multipart). */
    public function update(Request $request, Candidate $candidate): JsonResponse
    {
        $candidate->position->assembly->assertSetupOpen();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $before = $candidate->attributesToArray();
        $attributes = array_intersect_key($data, array_flip(['name', 'sort_order']));

        if ($request->hasFile('photo')) {
            $this->deletePhoto($candidate->photo_path);
            $attributes['photo_path'] = $request->file('photo')->store('election/candidates', 'public');
        } elseif ($request->boolean('remove_photo')) {
            $this->deletePhoto($candidate->photo_path);
            $attributes['photo_path'] = null;
        }

        $candidate->update($attributes);

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $candidate, $before, $candidate->attributesToArray());

        return response()->json(['data' => $candidate->refresh()]);
    }

    public function destroy(Request $request, Candidate $candidate): JsonResponse
    {
        $candidate->position->assembly->assertSetupOpen();

        if (CandidateVote::query()->where('candidate_id', $candidate->id)->exists()) {
            $this->fail('candidate', 'A candidate who already has votes cannot be deleted.');
        }

        $before = $candidate->attributesToArray();
        $this->deletePhoto($candidate->photo_path);
        $candidate->delete();

        AuditLogger::record($request->user(), AuditAction::ElectionSetupChanged, $candidate, before: $before);

        return response()->json(status: 204);
    }

    private function deletePhoto(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
