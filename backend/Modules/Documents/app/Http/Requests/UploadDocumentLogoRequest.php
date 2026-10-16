<?php

declare(strict_types=1);

namespace Modules\Documents\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UploadDocumentLogoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'logo' => ['required', 'file', 'mimetypes:image/png,image/jpeg,image/webp', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ];
    }
}
