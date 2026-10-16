<?php

declare(strict_types=1);

namespace Modules\Documents\Models;

use Illuminate\Database\Eloquent\Model;

final class DocumentSetting extends Model
{
    protected $table = 'document_settings';

    public const DEFAULTS = [
        'template' => 'classic',
        'paper_size' => 'A4',
        'orientation' => 'portrait',
        'margin_mm' => 12,
        'font_family' => 'Inter',
        'header_alignment' => 'split',
        'logo_mode' => 'none',
        'logo_size' => 44,
        'uploaded_logo_url' => null,
        'uploaded_logo_path' => null,
        'density' => 'comfortable',
        'border_style' => 'accent',
        'company_name' => 'Your Organization',
        'company_address' => '',
        'company_contact' => '',
        'company_tin' => null,
        'accent_color' => '#B8892E',
        'footer_note' => null,
        'show_prepared_by' => true,
        'show_signature_blocks' => true,
        'table_striped' => true,
        'watermark' => null,
        'terms_title' => 'Terms and Notes',
        'footer_page_number_label' => 'Page',
    ];

    protected $fillable = [
        'template', 'paper_size', 'orientation', 'margin_mm', 'font_family', 'header_alignment',
        'logo_mode', 'logo_size', 'uploaded_logo_url', 'uploaded_logo_path', 'density', 'border_style',
        'company_name', 'company_address', 'company_contact', 'company_tin', 'accent_color',
        'footer_note', 'show_prepared_by', 'show_signature_blocks', 'table_striped', 'watermark',
        'terms_title', 'footer_page_number_label',
    ];

    public static function current(): self
    {
        return self::query()->first() ?? self::query()->create(self::DEFAULTS);
    }

    protected function casts(): array
    {
        return [
            'margin_mm' => 'integer',
            'logo_size' => 'integer',
            'show_prepared_by' => 'boolean',
            'show_signature_blocks' => 'boolean',
            'table_striped' => 'boolean',
        ];
    }
}
