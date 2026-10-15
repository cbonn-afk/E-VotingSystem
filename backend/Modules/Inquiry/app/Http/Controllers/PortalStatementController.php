<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Inquiry\Support\MemberStatement;
use Modules\Members\Models\Member;

/**
 * A member's own statement, behind the Loan module's member portal session (member code + SMS code).
 * The member comes from the session, never from the request.
 */
final class PortalStatementController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $member = $request->attributes->get('portal_member');

        abort_unless($member instanceof Member, 401);

        return response()->json(['data' => MemberStatement::forMember($member)]);
    }
}
