<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Modules\Loan\Http\Resources\LoanDetailResource;
use Modules\Loan\Http\Resources\LoanListResource;
use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanPayment;
use Modules\Loan\Support\PaymentService;

/** Staff: look up a loan, record a payment, and void the latest one. */
class LoanAccountController extends Controller
{
    private const RELATIONS = ['member', 'product', 'scheduleItems'];

    public function __construct(private readonly PaymentService $payments) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $loans = Loan::query()
            ->with(self::RELATIONS)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->query('status')))
            ->when($q !== '', fn ($query) => $query->where(function ($w) use ($q): void {
                $w->whereLike('loan_no', "%{$q}%")->orWhereHas('member', function ($m) use ($q): void {
                    $m->whereLike('name', "%{$q}%")->orWhereLike('member_code', "%{$q}%");
                });
            }))
            ->orderByDesc('id')
            ->paginate(min((int) $request->query('per_page', 15), 100));

        return LoanListResource::collection($loans);
    }

    public function show(int $loan): LoanDetailResource
    {
        return new LoanDetailResource(Loan::query()->with(self::RELATIONS)->findOrFail($loan));
    }

    public function recordPayment(Request $request, int $loan): LoanDetailResource
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:99999999'],
            'paid_on' => ['required', 'date_format:Y-m-d'],
            'method' => ['required', Rule::in(LoanPayment::METHODS)],
            'reference_no' => ['nullable', 'string', 'max:80', 'required_unless:method,cash'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ], ['reference_no.required_unless' => 'Enter the check, transfer or deduction reference.']);

        $model = Loan::query()->findOrFail($loan);
        $this->payments->record($model, $request->user(), $data);

        return new LoanDetailResource($model->refresh()->load(self::RELATIONS));
    }

    public function voidPayment(Request $request, int $loan, int $payment): LoanDetailResource
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']], ['reason.required' => 'Give the reason this payment is being voided.']);

        $model = Loan::query()->findOrFail($loan);
        $this->payments->void($model, $model->payments()->findOrFail($payment), $request->user(), $data['reason']);

        return new LoanDetailResource($model->refresh()->load(self::RELATIONS));
    }
}
