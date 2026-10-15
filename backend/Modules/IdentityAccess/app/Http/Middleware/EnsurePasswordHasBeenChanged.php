<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * While `require_password_change` is true, only the profile, logout and
 * change-password endpoints work. Everything else answers 423, which the
 * Next.js apiClient turns into a redirect to the change-password page.
 */
final class EnsurePasswordHasBeenChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if (
            $request->user()?->require_password_change
            && ! $request->routeIs('me', 'logout', 'password.change')
        ) {
            abort(423, 'You must change your password before continuing.');
        }

        return $next($request);
    }
}
