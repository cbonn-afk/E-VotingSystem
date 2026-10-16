<?php

declare(strict_types=1);

namespace Modules\Documents\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Documents\Models\DocumentSetting;

/** @mixin DocumentSetting */
final class DocumentSettingResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'template' => $this->template,
            'paperSize' => $this->paper_size,
            'orientation' => $this->orientation,
            'marginMm' => $this->margin_mm,
            'fontFamily' => $this->font_family,
            'headerAlignment' => $this->header_alignment,
            'logoMode' => $this->logo_mode,
            'logoSize' => $this->logo_size,
            // Built from the stored path on the current request host, so it still loads when APP_URL differs from the real URL.
            'uploadedLogoUrl' => filled($this->uploaded_logo_path) ? url('storage/'.$this->uploaded_logo_path) : $this->uploaded_logo_url,
            'density' => $this->density,
            'borderStyle' => $this->border_style,
            'companyName' => $this->company_name,
            'companyAddress' => $this->company_address,
            'companyContact' => $this->company_contact,
            'companyTin' => $this->company_tin,
            'accentColor' => $this->accent_color,
            'footerNote' => $this->footer_note,
            'showPreparedBy' => $this->show_prepared_by,
            'showSignatureBlocks' => $this->show_signature_blocks,
            'tableStriped' => $this->table_striped,
            'watermark' => $this->watermark,
            'termsTitle' => $this->terms_title,
            'footerPageNumberLabel' => $this->footer_page_number_label,
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
