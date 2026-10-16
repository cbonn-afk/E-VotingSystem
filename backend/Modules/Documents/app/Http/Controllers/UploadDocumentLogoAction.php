<?php

declare(strict_types=1);

namespace Modules\Documents\Actions;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Documents\Models\DocumentSetting;

final class UploadDocumentLogoAction
{
    public function execute(UploadedFile $logo): DocumentSetting
    {
        $settings = DocumentSetting::current();
        $previous = $settings->uploaded_logo_path;

        $path = $logo->storePublicly(UpdateDocumentSettingsAction::LOGO_DIR, 'public');

        $settings->update([
            'logo_mode' => 'upload',
            'uploaded_logo_path' => $path,
            'uploaded_logo_url' => Storage::disk('public')->url($path),
        ]);

        if (filled($previous) && $previous !== $path && str_starts_with($previous, UpdateDocumentSettingsAction::LOGO_DIR.'/')) {
            Storage::disk('public')->delete($previous);
        }

        return $settings->refresh();
    }
}
