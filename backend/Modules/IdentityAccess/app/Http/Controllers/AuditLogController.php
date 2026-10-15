<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Controllers;

use Modules\IdentityAccess\Http\Controllers\Controller;
use Modules\IdentityAccess\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string'],
            'actor_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json(
            AuditLog::query()
                ->with('actor:id,name,email')
                ->when($filters['action'] ?? null, fn ($q, string $a) => $q->where('action', $a))
                ->when($filters['actor_id'] ?? null, fn ($q, int $id) => $q->where('actor_id', $id))
                ->latest('created_at')
                ->latest('id')
                ->paginate($filters['per_page'] ?? 25),
        );
    }
}
