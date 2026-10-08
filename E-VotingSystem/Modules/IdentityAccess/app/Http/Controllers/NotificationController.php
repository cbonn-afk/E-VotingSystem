<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Controllers;

use Modules\IdentityAccess\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->boolean('unread')
            ? $request->user()->unreadNotifications()
            : $request->user()->notifications();

        return response()->json($query->latest()->paginate(20));
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return response()->json($notification->refresh());
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
