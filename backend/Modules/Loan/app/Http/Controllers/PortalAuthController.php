<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Http\Middleware\EnsurePortalSession;
use Modules\Loan\Models\PortalSession;
use Modules\Members\Models\Member;

/**
 * Member portal sign-in with member code + password. New members start with the default password
 * (Member::DEFAULT_PASSWORD) and must change it before using the portal.
 * Wrong guesses are rate limited per code+IP and per IP.
 */
class PortalAuthController extends Controller
{
    /** Same answer for an unknown code, an inactive member and a wrong password, so codes cannot be probed. */
    private const FAILED = 'We could not sign you in with that member code and password. Check them and try again.';

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_code' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $code = trim($data['member_code']);
        $ip = (string) $request->ip();

        $codeKey = 'loan-portal:code:'.sha1(Str::lower($code).'|'.$ip);
        $ipKey = 'loan-portal:ip:'.$ip;

        $this->assertNotLocked($codeKey, (int) config('loan.portal.login_max_attempts', 5));
        $this->assertNotLocked($ipKey, (int) config('loan.portal.login_ip_max_attempts', 20));

        $member = Member::query()->where('member_code', $code)->where('status', 'active')->first();

        // Always run a hash check so an unknown code takes as long as a wrong password.
        $passwordOk = Hash::check($data['password'], $member?->password ?? Hash::make(Str::random(16))) && $member !== null;

        if (! $passwordOk) {
            $lockSeconds = (int) config('loan.portal.login_lockout_minutes', 15) * 60;

            RateLimiter::hit($codeKey, $lockSeconds);
            RateLimiter::hit($ipKey, $lockSeconds);
            Log::notice('Loan portal sign-in failed.', ['ip' => $ip]);

            throw ValidationException::withMessages(['member_code' => [self::FAILED]]);
        }

        // A success clears the per-code counter only; the IP counter is not reset, so an
        // attacker cannot earn free guesses by signing in to their own account in between.
        RateLimiter::clear($codeKey);

        PortalSession::query()->where('member_id', $member->id)->where('expires_at', '<', now())->delete();

        $hours = (int) config('loan.portal.session_max_hours', 8);
        $token = Str::random(64);

        PortalSession::query()->create([
            'member_id' => $member->id,
            'token_hash' => hash('sha256', $token),
            'ip_address' => $ip,
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
            'last_activity_at' => now(),
            'expires_at' => now()->addHours($hours),
        ]);

        AuditLogger::record(null, AuditAction::LoanPortalLoginSucceeded, $member, null, ['ip' => $ip]);

        $cookie = cookie(EnsurePortalSession::COOKIE, $token, $hours * 60, '/', null, app()->isProduction(), true, false, 'lax');

        return response()->json(['data' => $this->summary($member)])->withCookie($cookie);
    }

    /** Replaces the default password. Other sessions of this member are signed out. */
    public function changePassword(Request $request): JsonResponse
    {
        /** @var Member $member */
        $member = $request->attributes->get('portal_member');

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', 'different:current_password', Password::min(8)],
        ]);

        if (! Hash::check($data['current_password'], (string) $member->password)) {
            throw ValidationException::withMessages(['current_password' => ['The current password is incorrect.']]);
        }

        $member->forceFill(['password' => $data['password'], 'require_password_change' => false])->save();

        PortalSession::query()
            ->where('member_id', $member->id)
            ->where('id', '!=', $request->attributes->get('portal_session')->id)
            ->delete();

        AuditLogger::record(null, AuditAction::LoanPortalPasswordChanged, $member, null, ['ip' => (string) $request->ip()]);

        return response()->json(['data' => $this->summary($member)]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->summary($request->attributes->get('portal_member'))]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('portal_session')?->delete();

        return response()->json(null, 204)->withoutCookie(EnsurePortalSession::COOKIE);
    }

    private function assertNotLocked(string $key, int $max): void
    {
        if (! RateLimiter::tooManyAttempts($key, $max)) {
            return;
        }

        $minutes = max(1, (int) ceil(RateLimiter::availableIn($key) / 60));

        throw new HttpResponseException(response()->json([
            'message' => "Too many attempts. Try again in {$minutes} minute".($minutes === 1 ? '' : 's').'.',
        ], 429));
    }

    /** @return array<string,mixed> */
    private function summary(Member $member): array
    {
        $mobile = (string) $member->mobile_number;

        return [
            'id' => $member->id,
            'member_code' => $member->member_code,
            'name' => $member->name,
            'mobile_masked' => $mobile === '' ? null : substr($mobile, 0, 3).str_repeat('*', max(strlen($mobile) - 7, 0)).substr($mobile, -4),
            'is_delinquent' => $member->is_delinquent,
            'require_password_change' => $member->require_password_change,
        ];
    }
}
