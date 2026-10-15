<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Http\Resources\LoanApplicationResource;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Support\ApplicationStatus;
use Modules\Loan\Support\ApplicationWorkflow;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Staff queue. Drafts are private to the member, so nothing that was never submitted is listed. */
class LoanApplicationController extends Controller
{
    private const RELATIONS = ['member', 'product.documents', 'documents', 'guarantors.member', 'events'];

    public function __construct(private readonly ApplicationWorkflow $workflow) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $applications = LoanApplication::query()
            ->whereNotNull('submitted_at')
            ->with(['member', 'product.documents'])
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

    public function reviewDocument(Request $request, int $application, int $document): LoanApplicationResource
    {
        $model = $this->submitted($application);

        if ($model->status !== ApplicationStatus::DOCUMENT_REVIEW) {
            throw ValidationException::withMessages(['status' => ['Start the document review first.']]);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'rejected'])],
            'remarks' => ['nullable', 'string', 'max:500', 'required_if:status,rejected'],
        ], ['remarks.required_if' => 'Say what is wrong with the document.']);

        $row = $model->documents()->findOrFail($document);
        $row->update([
            'status' => $data['status'],
            'remarks' => $data['status'] === 'rejected' ? $data['remarks'] : null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        AuditLogger::record($request->user(), AuditAction::LoanDocumentReviewed, $model, null, [
            'requirement' => $row->requirement,
            'status' => $data['status'],
        ]);

        return new LoanApplicationResource($model->load(self::RELATIONS));
    }

    public function downloadDocument(int $application, int $document): StreamedResponse
    {
        $row = $this->submitted($application)->documents()->findOrFail($document);

        return Storage::disk('local')->download($row->path, $row->original_name);
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
