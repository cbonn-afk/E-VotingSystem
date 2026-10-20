<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\Loan\Http\Resources\LoanApplicationResource;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanApplicationEvaluation;
use Modules\Loan\Models\LoanRelease;
use Modules\Loan\Support\ApplicationStatus;
use Modules\Loan\Support\AgreementService;
use Modules\Loan\Support\ApplicationWorkflow;
use Modules\Loan\Support\ReleaseService;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Staff queue. Drafts are private to the member, so nothing that was never submitted is listed. */
class LoanApplicationController extends Controller
{
    private const RELATIONS = ['member', 'product', 'guarantors.member', 'events', 'evaluation', 'approvals', 'agreement', 'loan.scheduleItems', 'loan.release'];

    public function __construct(private readonly ApplicationWorkflow $workflow) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $applications = LoanApplication::query()
            ->whereNotNull('submitted_at')
            ->with(['member', 'product'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->query('status')))
            ->when($q !== '', fn ($query) => $query->where(function ($w) use ($q): void {
                $w->whereLike('reference_no', "%{$q}%")->orWhereHas('member', function ($m) use ($q): void {
                    $m->whereLike('name', "%{$q}%")->orWhereLike('member_code', "%{$q}%");
                });
            }))
            ->orderByDesc('id')
            ->paginate(min((int) $request->query('per_page', 15), 100));

        return LoanApplicationResource::collection($applications);
    }

    public function show(int $application): LoanApplicationResource
    {
        return new LoanApplicationResource($this->submitted($application)->load(self::RELATIONS));
    }

    public function transition(Request $request, int $application): LoanApplicationResource
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(array_keys(ApplicationStatus::ACTIONS))],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $model = $this->submitted($application);
        $this->workflow->apply($model, $data['action'], $request->user(), $data['remarks'] ?? null);

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    public function evaluate(Request $request, int $application): LoanApplicationResource
    {
        $data = $request->validate([
            'recommendation' => ['required', Rule::in(LoanApplicationEvaluation::RECOMMENDATIONS)],
            'recommended_amount' => ['nullable', 'numeric', 'min:1', 'max:99999999'],
            'verified_income' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'existing_obligations' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'notes' => ['required', 'string', 'max:2000'],
        ], ['notes.required' => 'Write your assessment so the approvers can see your reasoning.']);

        $model = $this->submitted($application);
        $this->workflow->evaluate($model, $request->user(), $data);

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    public function decide(Request $request, int $application): LoanApplicationResource
    {
        $data = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'approved_amount' => ['nullable', 'numeric', 'min:1', 'max:99999999'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $model = $this->submitted($application);
        $this->workflow->decide(
            $model,
            $request->user(),
            $data['decision'],
            isset($data['approved_amount']) ? (string) $data['approved_amount'] : null,
            $data['remarks'] ?? null,
        );

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    /** Shows the agreement's figures for a first due date without saving anything. */
    public function previewAgreement(Request $request, int $application, AgreementService $agreements): JsonResponse
    {
        $data = $request->validate(['first_due_date' => ['required', 'date_format:Y-m-d']]);
        $model = $this->submitted($application)->loadMissing('product');

        abort_unless(in_array($model->status, [ApplicationStatus::APPROVED, ApplicationStatus::FOR_AGREEMENT, ApplicationStatus::FOR_RELEASE], true), 409, 'This loan is not ready for an agreement.');

        return response()->json(['data' => $agreements->terms($model, new DateTimeImmutable($data['first_due_date']))]);
    }

    public function generateAgreement(Request $request, int $application, AgreementService $agreements): LoanApplicationResource
    {
        $data = $request->validate(['first_due_date' => ['required', 'date_format:Y-m-d']]);
        $model = $this->submitted($application);

        $agreements->generate($model, $request->user(), new DateTimeImmutable($data['first_due_date']));

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    public function release(Request $request, int $application, ReleaseService $releases): LoanApplicationResource
    {
        $data = $request->validate([
            'method' => ['required', Rule::in(LoanRelease::METHODS)],
            'reference_no' => ['nullable', 'string', 'max:80', 'required_unless:method,cash'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'fees_collected' => ['sometimes', 'boolean'],
        ], ['reference_no.required_unless' => 'Enter the check, transfer or account reference.']);

        $model = $this->submitted($application);
        $releases->release($model, $request->user(), $data);

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    public function signature(int $application): StreamedResponse
    {
        $model = $this->submitted($application);

        abort_if($model->signature_path === null, 404);

        return Storage::disk('local')->download($model->signature_path, "signature-{$model->reference_no}.png");
    }

    private function submitted(int $id): LoanApplication
    {
        return LoanApplication::query()->whereNotNull('submitted_at')->findOrFail($id);
    }
}
