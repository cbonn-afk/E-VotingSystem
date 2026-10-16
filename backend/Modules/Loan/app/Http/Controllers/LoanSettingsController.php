<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\LoanSetting;

class LoanSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->payload(LoanSetting::current())]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'portal_access_mode' => ['required', Rule::in([LoanSetting::MODE_NETWORK_ONLY, LoanSetting::MODE_ONLINE])],
            'allowed_networks' => ['present', 'array', 'max:50'],
            'allowed_networks.*' => ['string', function (string $attr, mixed $value, \Closure $fail): void {
                if (! self::validNetwork((string) $value)) {
                    $fail('Enter an IP address or CIDR range, e.g. 192.168.1.0/24.');
                }
            }],
            'session_idle_minutes' => ['required', 'integer', 'min:5', 'max:120'],
            'signature_required' => ['required', 'boolean'],
            'diminishing_method' => ['required', Rule::in(LoanSetting::DIMINISHING_METHODS)],
            'fee_handling' => ['required', Rule::in(LoanSetting::FEE_HANDLING)],
            'payment_allocation' => ['required', Rule::in(LoanSetting::PAYMENT_ALLOCATIONS)],
            'penalty_basis' => ['required', Rule::in(LoanSetting::PENALTY_BASES)],
            'agreement_terms' => ['nullable', 'string', 'max:8000'],
        ]);

        $data['allowed_networks'] = array_values(array_unique(array_map('trim', $data['allowed_networks'])));
        // Saving the default text unchanged keeps following the default.
        $data['agreement_terms'] = ($data['agreement_terms'] ?? null) === LoanSetting::DEFAULT_TERMS ? null : ($data['agreement_terms'] ?? null);

        $settings = LoanSetting::current();
        $before = $this->payload($settings);
        $settings->update($data);

        AuditLogger::record($request->user(), AuditAction::LoanSettingsUpdated, $settings, $before, $this->payload($settings->refresh()));

        return response()->json(['data' => $this->payload($settings)]);
    }

    /** @return array<string,mixed> */
    private function payload(LoanSetting $s): array
    {
        return [
            'portal_access_mode' => $s->portal_access_mode,
            'allowed_networks' => $s->allowed_networks ?? [],
            'session_idle_minutes' => $s->session_idle_minutes,
            'signature_required' => $s->signature_required,
            'diminishing_method' => $s->diminishing_method,
            'fee_handling' => $s->fee_handling,
            'payment_allocation' => $s->payment_allocation,
            'penalty_basis' => $s->penalty_basis,
            // The text in force: the saved one, or the built-in default when none was saved.
            'agreement_terms' => $s->termsText(),
        ];
    }

    private static function validNetwork(string $value): bool
    {
        [$ip, $mask] = array_pad(explode('/', trim($value), 2), 2, null);

        if (filter_var($ip, FILTER_VALIDATE_IP) === false) {
            return false;
        }
        if ($mask === null) {
            return true;
        }

        $max = str_contains($ip, ':') ? 128 : 32;

        return ctype_digit($mask) && (int) $mask <= $max;
    }
}
