<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Election\Models\Setting;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => Setting::current()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_title' => ['nullable', 'string', 'max:255'],
            'document_title' => ['nullable', 'string', 'max:255'],
            'document_sub_title' => ['nullable', 'string', 'max:255'],
        ]);

        $setting = Setting::current();
        $before = $setting->attributesToArray();
        $setting->update($data);

        AuditLogger::record($request->user(), AuditAction::ElectionSettingsUpdated, $setting, $before, $setting->attributesToArray());

        return response()->json(['data' => $setting]);
    }
}
