<?php

declare(strict_types=1);

namespace Modules\Inquiry\Support\Import;

use DateTimeImmutable;
use DateTimeInterface;

/**
 * Turns raw spreadsheet cells into clean values. No framework dependencies on purpose,
 * so every rule here can be tested without booting Laravel.
 */
final class Cells
{
    /** Accepted text date formats. Slash/dash dates are month-first (06-25-2024), as in the old sample files. */
    private const DATE_FORMATS = ['Y-m-d', 'm/d/Y', 'm-d-Y', 'n/j/Y', 'n-j-Y', 'Y/m/d'];

    public static function isBlankRow(array $cells): bool
    {
        foreach ($cells as $cell) {
            if ($cell !== null && trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    public static function text(mixed $value): string
    {
        return trim(is_scalar($value) ? (string) $value : '');
    }

    /** Member codes are stored UPPERCASE with no spaces (the old system uppercased every code). */
    public static function code(mixed $value): string
    {
        return strtoupper((string) preg_replace('/\s+/', '', self::text($value)));
    }

    /**
     * Money as a "1234.50" string. Blank means 0. Commas, spaces and a peso sign are ignored.
     * Returns null (and adds a problem) for anything that is not a plain non-negative amount.
     *
     * @param  list<string>  $problems
     */
    public static function money(mixed $value, string $label, array &$problems): ?string
    {
        if ($value === null || trim((string) $value) === '') {
            return '0.00';
        }

        $clean = is_string($value) ? str_replace([',', ' ', '₱'], '', trim($value)) : $value;

        if (! is_numeric($clean)) {
            $problems[] = "{$label} must be a number";

            return null;
        }

        $number = (float) $clean;

        if ($number < 0) {
            $problems[] = "{$label} must not be negative";

            return null;
        }

        if ($number >= 1e13) {
            $problems[] = "{$label} is too large";

            return null;
        }

        return number_format(round($number, 2), 2, '.', '');
    }

    /**
     * A date as "YYYY-MM-DD". Accepts Excel serial numbers and the text formats above.
     *
     * @param  list<string>  $problems
     */
    public static function date(mixed $value, string $label, array &$problems, bool $required): ?string
    {
        if ($value instanceof DateTimeInterface) {
            $date = DateTimeImmutable::createFromInterface($value);
        } else {
            if ($value === null || trim((string) $value) === '') {
                if ($required) {
                    $problems[] = "{$label} is required";
                }

                return null;
            }

            $date = is_numeric($value) ? self::fromSerial((float) $value) : self::fromText(trim((string) $value));
        }

        $year = $date === null ? 0 : (int) $date->format('Y');

        if ($date === null || $year < 1950 || $year > 2100) {
            $problems[] = "{$label} is not a valid date (use YYYY-MM-DD or MM-DD-YYYY)";

            return null;
        }

        return $date->format('Y-m-d');
    }

    private static function fromSerial(float $serial): ?DateTimeImmutable
    {
        // Excel counts days from 1899-12-30 (this absorbs its 1900 leap-year bug for modern dates).
        if ($serial < 1 || $serial > 80000) {
            return null;
        }

        return (new DateTimeImmutable('1899-12-30'))->modify('+'.(int) floor($serial).' days');
    }

    private static function fromText(string $text): ?DateTimeImmutable
    {
        foreach (self::DATE_FORMATS as $format) {
            $date = DateTimeImmutable::createFromFormat('!'.$format, $text);
            $errors = DateTimeImmutable::getLastErrors();

            // getLastErrors() is false when clean (PHP 8.2+); a warning means an overflowed date such as 13-45-2024.
            if ($date !== false && ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0))) {
                return $date;
            }
        }

        return null;
    }
}
