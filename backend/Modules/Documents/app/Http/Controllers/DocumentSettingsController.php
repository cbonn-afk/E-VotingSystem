<?php

declare(strict_types=1);

namespace Modules\Documents\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\Documents\Actions\UpdateDocumentSettingsAction;
use Modules\Documents\Actions\UploadDocumentLogoAction;
use Modules\Documents\Http\Requests\UpdateDocumentSettingsRequest;
use Modules\Documents\Http\Requests\UploadDocumentLogoRequest;
use Modules\Documents\Http\Resources\DocumentSettingResource;
use Modules\Documents\Models\DocumentSetting;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class DocumentSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return (new DocumentSettingResource(DocumentSetting::current()))->response();
    }

    public function update(UpdateDocumentSettingsRequest $request, UpdateDocumentSettingsAction $action): JsonResponse
    {
        $keys = array_keys(DocumentSetting::DEFAULTS);
        $before = DocumentSetting::current()->only($keys);
        $settings = $action->execute($request->validated());

        AuditLogger::record($request->user(), AuditAction::DocumentSettingsUpdated, $settings, $before, $settings->only($keys));

        return (new DocumentSettingResource($settings))->response();
    }

    public function logo(UploadDocumentLogoRequest $request, UploadDocumentLogoAction $action): JsonResponse
    {
        $settings = $action->execute($request->file('logo'));

        AuditLogger::record($request->user(), AuditAction::DocumentSettingsUpdated, $settings, null, ['uploaded_logo_url' => $settings->uploaded_logo_url]);

        return (new DocumentSettingResource($settings))->response();
    }
}
