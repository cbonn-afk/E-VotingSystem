<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Modules\Loan\Http\Resources\PortalLoanListResource;
use Modules\Loan\Http\Resources\PortalLoanResource;
use Modules\Loan\Models\Loan;

/** Member portal: a member sees only their own loans, schedule and payments. */
class PortalLoanController extends Controller
{
    private const RELATIONS = ['product', 'scheduleItems'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $loans = Loan::query()->with(self::RELATIONS)->where('member_id', $request->attributes->get('portal_member')->id)->orderByDesc('id')->get();

        return PortalLoanListResource::collection($loans);
    }

    public function show(Request $request, int $loan): PortalLoanResource
    {
        $model = Loan::query()->with(self::RELATIONS)->where('member_id', $request->attributes->get('portal_member')->id)->findOrFail($loan);

        return new PortalLoanResource($model);
    }
}
