<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Http\Resources\LoanApplicationResource;
use Modules\Loan\Http\Resources\LoanProductResource;
use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanProduct;
use Modules\Loan\Support\AgreementService;
use Modules\Loan\Support\ApplicationStatus;
use Modules\Loan\Support\ApplicationWorkflow;
use Modules\Members\Models\Member;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Member portal: a member only ever sees and changes their own applications.
 * The member comes from the portal session, never from the request.
 */
class PortalApplicationController extends Controller
{
    private const RELATIONS = ['member', 'product.documents', 'documents', 'guarantors.member', 'events', 'agreement', 'loan.scheduleItems', 'loan.release'];

    public function __construct(private readonly ApplicationWorkflow $workflow) {}

    public function products(): AnonymousResourceCollection
    {
        return LoanProductResource::collection(
            LoanProduct::query()->where('status', 'active')->with('documents')->orderBy('name')->get(),
        );
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $applications = LoanApplication::query()
            ->where('member_id', $this->member($request)->id)
            ->with(['member', 'product.documents'])
            ->orderByDesc('id')
            ->get();

        return LoanApplicationResource::collection($applications);
    }

    public function show(Request $request, int $application): LoanApplicationResource
    {
        return new LoanApplicationResource($this->own($request, $application)->load(self::RELATIONS));
    }

    public function store(Request $request): JsonResponse
    {
        $member = $this->member($request);
        $data = $this->validatedDetails($request) + $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('loan_products', 'id')->where('status', 'active')],
        ]);

        $application = DB::transaction(function () use ($data, $member): LoanApplication {
            $application = LoanApplication::query()->create($data + [
                'member_id' => $member->id,
                'status' => ApplicationStatus::DRAFT,
            ]);

            $application->update(['reference_no' => sprintf('LN-%s-%06d', now()->format('Y'), $application->id)]);
            $this->workflow->record($application, null, ApplicationStatus::DRAFT, 'member', $member->name);

            return $application;
        });

        AuditLogger::record(null, AuditAction::LoanApplicationCreated, $application, null, [
            'reference_no' => $application->reference_no,
            'member_code' => $member->member_code,
        ]);

        return (new LoanApplicationResource($application->load(self::RELATIONS)))->response()->setStatusCode(201);
    }

    public function update(Request $request, int $application): LoanApplicationResource
    {
        $model = $this->editable($request, $application);
        $model->update($this->validatedDetails($request));

        return new LoanApplicationResource($model->load(self::RELATIONS));
    }

    /** Only a draft can be withdrawn by the member. */
    public function destroy(Request $request, int $application): JsonResponse
    {
        $model = $this->own($request, $application);

        if ($model->status !== ApplicationStatus::DRAFT) {
            abort(409, 'Only a draft can be cancelled.');
        }

        $this->workflow->cancel($model->loadMissing('member'));

        return response()->json(null, 204);
    }

    public function uploadDocument(Request $request, int $application): LoanApplicationResource
    {
        $model = $this->editable($request, $application)->load('product.documents');

        $request->validate([
            'requirement' => ['required', 'string', Rule::in($model->product->documents->pluck('name')->all())],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $file = $request->file('file');
        $path = $file->store("loan/applications/{$model->id}", 'local');
        $existing = $model->documents()->where('requirement', $request->input('requirement'))->first();

        $attributes = [
            'path' => $path,
            'original_name' => Str::limit(basename($file->getClientOriginalName()), 200, ''),
            'mime' => (string) $file->getMimeType(),
            'size' => (int) $file->getSize(),
            'status' => 'pending',
            'remarks' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];

        if ($existing === null) {
            $model->documents()->create($attributes + ['requirement' => $request->input('requirement')]);
        } else {
            $oldPath = $existing->path;
            $existing->update($attributes);
            Storage::disk('local')->delete($oldPath);
        }

        AuditLogger::record(null, AuditAction::LoanDocumentUploaded, $model, null, ['requirement' => $request->input('requirement')]);

        return new LoanApplicationResource($model->load(self::RELATIONS));
    }

    public function deleteDocument(Request $request, int $application, int $document): LoanApplicationResource
    {
        $model = $this->editable($request, $application);
        $row = $model->documents()->findOrFail($document);

        Storage::disk('local')->delete($row->path);
        $row->delete();

        return new LoanApplicationResource($model->load(self::RELATIONS));
    }

    public function downloadDocument(Request $request, int $application, int $document): StreamedResponse
    {
        $row = $this->own($request, $application)->documents()->findOrFail($document);

        return Storage::disk('local')->download($row->path, $row->original_name);
    }

    public function setGuarantors(Request $request, int $application): LoanApplicationResource
    {
        $model = $this->editable($request, $application);
        $member = $this->member($request);

        $data = $request->validate([
            'member_codes' => ['present', 'array', 'max:5'],
            'member_codes.*' => ['required', 'string', 'max:50', 'distinct'],
        ]);

        $codes = array_map('trim', $data['member_codes']);

        $guarantors = Member::query()
            ->whereIn('member_code', $codes)
            ->where('status', 'active')
            ->where('id', '!=', $member->id)
            ->get();

        // One generic message: the portal must not confirm which codes exist.
        if ($guarantors->count() !== count($codes)) {
            throw ValidationException::withMessages([
                'member_codes' => ['One or more guarantor codes are not valid. Check them and try again.'],
            ]);
        }

        DB::transaction(function () use ($model, $guarantors): void {
            $model->guarantors()->delete();

            foreach ($guarantors as $guarantor) {
                $model->guarantors()->create(['member_id' => $guarantor->id]);
            }
        });

        return new LoanApplicationResource($model->load(self::RELATIONS));
    }

    /** The drawn signature arrives as a PNG data URL. Optional unless Loan settings require it. */
    public function saveSignature(Request $request, int $application): LoanApplicationResource
    {
        $model = $this->editable($request, $application);
        $data = $request->validate(['signature' => ['required', 'string', 'max:400000']]);

        $prefix = 'data:image/png;base64,';
        $binary = str_starts_with($data['signature'], $prefix)
            ? base64_decode(substr($data['signature'], strlen($prefix)), true)
            : false;

        if ($binary === false || ! str_starts_with($binary, "\x89PNG\r\n\x1a\n") || strlen($binary) > 300000) {
            throw ValidationException::withMessages(['signature' => ['The signature could not be read. Draw it again.']]);
        }

        $path = "loan/applications/{$model->id}/signature.png";
        Storage::disk('local')->put($path, $binary);
        $model->update(['signature_path' => $path, 'signed_at' => now()]);

        return new LoanApplicationResource($model->load(self::RELATIONS));
    }

    /** The member accepts the agreement. A drawn signature is required only when Loan settings say so. */
    public function signAgreement(Request $request, int $application, AgreementService $agreements): LoanApplicationResource
    {
        $model = $this->own($request, $application);
        $data = $request->validate([
            'agreed' => ['accepted'],
            'signature' => ['nullable', 'string', 'max:400000'],
        ], ['agreed.accepted' => 'Confirm that you accept the agreement.']);

        $agreements->signByMember($model, $data['signature'] ?? null);

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    public function submit(Request $request, int $application): LoanApplicationResource
    {
        $model = $this->editable($request, $application);
        $request->validate(['confirmed' => ['accepted']], ['confirmed.accepted' => 'Confirm that your information is correct.']);

        $this->workflow->submit($model);

        return new LoanApplicationResource($model->refresh()->load(self::RELATIONS));
    }

    private function member(Request $request): Member
    {
        return $request->attributes->get('portal_member');
    }

    private function own(Request $request, int $id): LoanApplication
    {
        return LoanApplication::query()->where('member_id', $this->member($request)->id)->findOrFail($id);
    }

    private function editable(Request $request, int $id): LoanApplication
    {
        $application = $this->own($request, $id);

        if (! $application->isMemberEditable()) {
            abort(409, 'This application can no longer be changed.');
        }

        return $application;
    }

    /** @return array<string,mixed> */
    private function validatedDetails(Request $request): array
    {
        return $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:99999999'],
            'term_months' => ['required', 'integer', 'min:1', 'max:360'],
            'purpose' => ['required', 'string', 'max:1000'],
            'monthly_income' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'employer_business' => ['nullable', 'string', 'max:160'],
            'collateral_description' => ['nullable', 'string', 'max:500'],
            'collateral_value' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
        ]);
    }
}
