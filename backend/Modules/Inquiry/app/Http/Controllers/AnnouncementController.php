<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Inquiry\Models\Announcement;

final class AnnouncementController extends Controller
{
    /** Everyone in the module sees published notices; managers also see unpublished ones. */
    public function index(Request $request): JsonResponse
    {
        $canManage = $request->user()->can('inquiry.announcements.manage');

        $items = Announcement::query()
            ->when(! $canManage, fn ($q) => $q->where('is_published', true))
            ->latest('id')
            ->get()
            ->map(static fn (Announcement $a): array => $a->toPayload());

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $announcement = Announcement::query()->create([
            'title' => $data['title'],
            'body' => $data['body'],
            'is_published' => $request->boolean('is_published', true),
            'image_path' => $request->hasFile('image') ? $request->file('image')->store('inquiry/announcements', 'public') : null,
            'created_by' => $request->user()->getKey(),
        ]);

        AuditLogger::record($request->user(), AuditAction::InquiryAnnouncementCreated, $announcement, after: $announcement->attributesToArray());

        return response()->json(['data' => $announcement->toPayload()], 201);
    }

    /** POST (not PATCH) because the form may carry an image (multipart). */
    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string', 'max:5000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_published' => ['sometimes', 'boolean'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        $before = $announcement->attributesToArray();
        $attributes = array_intersect_key($data, array_flip(['title', 'body']));

        if ($request->has('is_published')) {
            $attributes['is_published'] = $request->boolean('is_published');
        }

        if ($request->hasFile('image')) {
            $this->deleteImage($announcement->image_path);
            $attributes['image_path'] = $request->file('image')->store('inquiry/announcements', 'public');
        } elseif ($request->boolean('remove_image')) {
            $this->deleteImage($announcement->image_path);
            $attributes['image_path'] = null;
        }

        $announcement->update($attributes);

        AuditLogger::record($request->user(), AuditAction::InquiryAnnouncementUpdated, $announcement, $before, $announcement->attributesToArray());

        return response()->json(['data' => $announcement->refresh()->toPayload()]);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $before = $announcement->attributesToArray();
        $this->deleteImage($announcement->image_path);
        $announcement->delete();

        AuditLogger::record($request->user(), AuditAction::InquiryAnnouncementDeleted, $announcement, before: $before);

        return response()->json(status: 204);
    }

    private function deleteImage(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
