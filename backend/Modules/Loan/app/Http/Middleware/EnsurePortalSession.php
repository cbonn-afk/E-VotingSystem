<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Loan\Models\LoanSetting;
use Modules\Loan\Models\PortalSession;
use Symfony\Component\HttpFoundation\Response;

/** Identifies the member from the portal session cookie. The member id never comes from the request body. */
final class EnsurePortalSession
{
    public const COOKIE = 'loan_portal_session';

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie(self::COOKIE);

        if (! is_string($token) || $token === '') {
            abort(401, 'Sign in to continue.');
        }

        $session = PortalSession::query()->with('member')->where('token_hash', hash('sha256', $token))->first();
        $idle = LoanSetting::current()->session_idle_minutes;

        if (
            $session === null
            || $session->expires_at->isPast()
            || $session->last_activity_at->copy()->addMinutes($idle)->isPast()
            || $session->member === null
            || $session->member->status !== 'active'
        ) {
            $session?->delete();

            abort(401, 'Your session has expired. Sign in again.');
        }

        // Extra guard for requests that are not covered by Sanctum's CSRF check.
        if (! $request->isMethodSafe() && $request->header('X-Requested-With') !== 'XMLHttpRequest') {
            abort(419, 'Missing request header.');
        }

        $session->forceFill(['last_activity_at' => now()])->save();
        $request->attributes->set('portal_member', $session->member);
        $request->attributes->set('portal_session', $session);

        return $next($request);
    }
}
