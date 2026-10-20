<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs after portal.session. While the member still has the default password, everything except
 * me / logout / change-password answers 428. (Not 423: the shared apiClient turns 423 into a redirect
 * to the staff /change-password page, which is not the member portal.)
 */
final class EnsurePortalPasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->attributes->get('portal_member')?->require_password_change) {
            abort(428, 'You must change your password before continuing.');
        }

        return $next($request);
    }
}
