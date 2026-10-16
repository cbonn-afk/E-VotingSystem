<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use Illuminate\Validation\ValidationException;

final class SignatureImage
{
    /** Decodes a drawn signature sent as a PNG data URL, or fails with a plain-language message. */
    public static function decode(string $dataUrl, string $field = 'signature'): string
    {
        $prefix = 'data:image/png;base64,';
        $binary = str_starts_with($dataUrl, $prefix) ? base64_decode(substr($dataUrl, strlen($prefix)), true) : false;

        if ($binary === false || ! str_starts_with($binary, "\x89PNG\r\n\x1a\n") || strlen($binary) > 300000) {
            throw ValidationException::withMessages([$field => ['The signature could not be read. Draw it again.']]);
        }

        return $binary;
    }
}
