<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Modules\Loan\Http\Resources\CollectionRowResource;
use Modules\Loan\Models\Loan;
use Modules\Loan\Support\CollectionClassifier;
use Modules\Loan\Support\CollectionStatusService;
use Modules\Loan\Support\PaymentService;

/** Follow-up: which loans are late, by how much, and how the portfolio is aging. */
class CollectionController extends Controller
{
    private const LATE = ['overdue', 'delinquent', 'default'];

    public function __construct(private readonly CollectionStatusService $statuses) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->freshen();

        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');
        $bucket = (string) $request->query('bucket', '');

        $loans = Loan::query()
            ->with(['member', 'product'])
            ->where('status', 'active')
            ->whereIn('collection_status', in_array($status, [...self::LATE, 'due'], true) ? [$status] : self::LATE)
            ->when(in_array($bucket, CollectionClassifier::BUCKETS, true), function ($query) use ($bucket): void {
                [$min, $max] = CollectionClassifier::bucketRange($bucket);
                $query->where('days_past_due', '>=', $min)->when($max !== null, fn ($b) => $b->where('days_past_due', '<=', $max));
            })
            ->when($q !== '', fn ($query) => $query->where(function ($w) use ($q): void {
                $w->whereLike('loan_no', "%{$q}%")->orWhereHas('member', function ($m) use ($q): void {
                    $m->whereLike('name', "%{$q}%")->orWhereLike('member_code', "%{$q}%");
                });
            }))
            ->orderByDesc('days_past_due')
            ->orderByDesc('overdue_amount')
            ->paginate(min((int) $request->query('per_page', 15), 100));

        $lastPaid = DB::table('loan_payments')
            ->whereIn('loan_id', $loans->getCollection()->pluck('id'))
            ->where('status', 'posted')
            ->groupBy('loan_id')
            ->selectRaw('loan_id, max(paid_on) as last_paid')
            ->pluck('last_paid', 'loan_id');

        $loans->getCollection()->each(fn (Loan $loan) => $loan->setAttribute('last_payment_on', $lastPaid[$loan->id] ?? null));

        return CollectionRowResource::collection($loans);
    }

    /** Counts and amounts per label and per aging bucket, plus Portfolio at Risk (balance more than 30 days late). */
    public function summary(): JsonResponse
    {
        $this->freshen();

        $money = static fn ($value): string => PaymentService::money((int) round(((float) $value) * 100));
        $active = Loan::query()->where('status', 'active');

        $byStatus = (clone $active)->selectRaw('collection_status, count(*) as loans, coalesce(sum(outstanding_balance), 0) as balance, coalesce(sum(overdue_amount), 0) as overdue')
            ->groupBy('collection_status')->get()->keyBy('collection_status');

        $statuses = [];

        foreach (CollectionClassifier::STATUSES as $name) {
            $row = $byStatus->get($name);
            $statuses[$name] = ['loans' => (int) ($row->loans ?? 0), 'balance' => $money($row->balance ?? 0), 'overdue' => $money($row->overdue ?? 0)];
        }

        $buckets = [];

        foreach (CollectionClassifier::BUCKETS as $bucket) {
            [$min, $max] = CollectionClassifier::bucketRange($bucket);
            $row = (clone $active)->where('days_past_due', '>=', $min)->when($max !== null, fn ($b) => $b->where('days_past_due', '<=', $max))
                ->selectRaw('count(*) as loans, coalesce(sum(outstanding_balance), 0) as balance, coalesce(sum(overdue_amount), 0) as overdue')->first();
            $buckets[$bucket] = ['loans' => (int) $row->loans, 'balance' => $money($row->balance), 'overdue' => $money($row->overdue)];
        }

        $totalBalance = (float) (clone $active)->sum('outstanding_balance');
        $atRisk = (float) (clone $active)->where('days_past_due', '>', 30)->sum('outstanding_balance');

        return response()->json(['data' => [
            'active_loans' => (clone $active)->count(),
            'outstanding_balance' => $money($totalBalance),
            'statuses' => $statuses,
            'buckets' => $buckets,
            'portfolio_at_risk_percent' => $totalBalance > 0 ? round($atRisk / $totalBalance * 100, 2) : 0,
        ]]);
    }

    /** If the nightly job has not run today (for example the scheduler is not set up yet), check the loans now. */
    private function freshen(): void
    {
        if ($this->statuses->isStale()) {
            $this->statuses->refreshAll();
        }
    }
}
