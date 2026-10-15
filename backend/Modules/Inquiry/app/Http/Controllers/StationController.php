<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Inquiry\Support\MemberStatement;

/** The inquiry station: a staff-signed-in screen where a member scans a card or types a member code. */
final class StationController extends Controller
{
    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:100']]);

        $found = MemberStatement::resolveScan($data['code']);

        if ($found === null) {
            $this->fail('code', 'This member code is not recorded. Please contact the cooperative office.');
        }

        [$member, $balance] = $found;

        AuditLogger::record($request->user(), AuditAction::InquiryStationLookup, $member ?? $balance);

        return response()->json(['data' => MemberStatement::build($member, $balance)]);
    }
}
