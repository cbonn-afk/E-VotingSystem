<?php

declare(strict_types=1);

namespace Modules\Documents\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Documents\Models\DocumentSetting;

/**
 * The single row of print settings (branding for every printable).
 * Created only when none exists, so edits made in Settings are never overwritten.
 */
final class DocumentsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (DocumentSetting::query()->exists()) {
            return;
        }

        DocumentSetting::query()->create(array_merge(DocumentSetting::DEFAULTS, [
            'company_name' => 'Ilocos Farmers Multi-Purpose Cooperative',
            'company_address' => 'Poblacion, Laoag City, Ilocos Norte, Philippines',
            'company_contact' => '(077) 600-1234 | info@ifmpc.example.com',
            'company_tin' => '123-456-789-000',
            'footer_note' => 'This is a system-generated document.',
            'watermark' => null,
        ]));
    }
}
