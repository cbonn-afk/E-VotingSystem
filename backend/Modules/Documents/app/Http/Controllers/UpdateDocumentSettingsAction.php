<?php

declare(strict_types=1);

namespace Modules\Documents\Actions;

use Illuminate\Support\Facades\Storage;
use Modules\Documents\Models\DocumentSetting;

final class UpdateDocumentSettingsAction
{
    public const LOGO_DIR = 'documents/logos';

    public function execute(array $data): DocumentSetting
    {
        $settings = DocumentSetting::current();

        // Clearing the logo (or switching to "none") removes the stored file too.
        $clearing = (array_key_exists('uploaded_logo_url', $data) && blank($data['uploaded_logo_url']))
            || ($data['logo_mode'] ?? null) === 'none';

        if ($clearing) {
            $this->deleteLogoIfSafe($settings->uploaded_logo_path);
            $data['uploaded_logo_url'] = null;
            $data['uploaded_logo_path'] = null;
        }

        $settings->update($data);

        return $settings->refresh();
    }

    private function deleteLogoIfSafe(?string $path): void
    {
        if (blank($path) || ! str_starts_with($path, self::LOGO_DIR.'/')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
