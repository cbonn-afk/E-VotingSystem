<?php

declare(strict_types=1);

namespace Modules\Documents\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateDocumentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // gated by the `can:settings.documents.manage` route middleware
    }

    public function rules(): array
    {
        return [
            'template' => ['sometimes', Rule::in(['classic', 'compact', 'executive'])],
            'paper_size' => ['sometimes', Rule::in(['A4', 'Letter', 'Legal'])],
            'orientation' => ['sometimes', Rule::in(['portrait', 'landscape'])],
            'margin_mm' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'font_family' => ['sometimes', Rule::in(['Inter', 'Arial', 'Georgia'])],
            'header_alignment' => ['sometimes', Rule::in(['split', 'left', 'center'])],
            'logo_mode' => ['sometimes', Rule::in(['upload', 'none'])],
            'logo_size' => ['sometimes', 'integer', 'min:24', 'max:160'],
            'uploaded_logo_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'density' => ['sometimes', Rule::in(['comfortable', 'compact'])],
            'border_style' => ['sometimes', Rule::in(['clean', 'boxed', 'accent'])],
            'company_name' => ['sometimes', 'string', 'max:255'],
            'company_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'company_contact' => ['sometimes', 'nullable', 'string', 'max:500'],
            // Philippine TIN: 9-digit base + 3-5 digit branch code, e.g. 123-456-789-000.
            'company_tin' => ['sometimes', 'nullable', 'string', 'regex:/^\d{3}-\d{3}-\d{3}-\d{3,5}$/', 'max:20'],
            'accent_color' => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'footer_note' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'show_prepared_by' => ['sometimes', 'boolean'],
            'show_signature_blocks' => ['sometimes', 'boolean'],
            'table_striped' => ['sometimes', 'boolean'],
            'watermark' => ['sometimes', 'nullable', 'string', 'max:255'],
            'terms_title' => ['sometimes', 'string', 'max:255'],
            'footer_page_number_label' => ['sometimes', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_tin.regex' => 'Enter a valid TIN in the format 000-000-000-000.',
        ];
    }
}
