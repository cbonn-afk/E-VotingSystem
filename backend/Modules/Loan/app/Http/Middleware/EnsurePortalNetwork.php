<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Loan\Models\LoanSetting;
use Symfony\Component\HttpFoundation\IpUtils;
use Symfony\Component\HttpFoundation\Response;

/**
 * network_only: the portal answers only to the listed IPs / CIDR ranges (an empty list blocks everyone).
 * online: no network check; OTP, throttling and lockout still apply.
 * Behind a load balancer, configure Laravel's trusted proxies or $request->ip() is the proxy's address.
 */
final class EnsurePortalNetwork
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = LoanSetting::current();

        if ($settings->portal_access_mode === LoanSetting::MODE_ONLINE) {
            return $next($request);
        }

        $ip = (string) $request->ip();

        if (app()->environment('local') && in_array($ip, ['127.0.0.1', '::1'], true)) {
            return $next($request);
        }

        $allowed = $settings->allowed_networks ?? [];

        if ($allowed !== [] && IpUtils::checkIp($ip, $allowed)) {
            return $next($request);
        }

        abort(403, 'The member portal is not available from this network.');
    }
}
