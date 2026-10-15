<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Http\Resources\LoanProductResource;
use Modules\Loan\Models\LoanProduct;

/**
 * Products are deactivated, never deleted: applications and loans will keep pointing at them.
 */
class LoanProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $products = LoanProduct::query()
            ->with('documents')
            ->when($q !== '', fn ($query) => $query->where(function ($w) use ($q): void {
                $w->whereLike('name', "%{$q}%")->orWhereLike('code', "%{$q}%");
            }))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->query('status')))
            ->orderBy('name')
            ->paginate(min((int) $request->query('per_page', 15), 100));

        return LoanProductResource::collection($products);
    }

    public function show(LoanProduct $product): LoanProductResource
    {
        return new LoanProductResource($product->load('documents'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $product = DB::transaction(function () use ($data): LoanProduct {
            $product = LoanProduct::query()->create($this->attributes($data));
            $this->syncDocuments($product, $data['documents'] ?? []);

            return $product->load('documents');
        });

        AuditLogger::record($request->user(), AuditAction::LoanProductCreated, $product, null, $this->snapshot($product));

        return (new LoanProductResource($product))->response()->setStatusCode(201);
    }

    public function update(Request $request, LoanProduct $product): LoanProductResource
    {
        $data = $this->validated($request, $product);
        $before = $this->snapshot($product->load('documents'));

        DB::transaction(function () use ($product, $data): void {
            $product->update($this->attributes($data));
            $this->syncDocuments($product, $data['documents'] ?? []);
        });

        $product->refresh()->load('documents');

        AuditLogger::record($request->user(), AuditAction::LoanProductUpdated, $product, $before, $this->snapshot($product));

        return new LoanProductResource($product);
    }

    /** @return array<string,mixed> */
    private function validated(Request $request, ?LoanProduct $product = null): array
    {
        // Codes are stored upper-case; normalise first so the unique check is not case-sensitive.
        $request->merge(['code' => strtoupper(trim((string) $request->input('code')))]);

        return $request->validate([
            'code' => ['required', 'string', 'max:30', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('loan_products', 'code')->ignore($product?->id)],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'min_amount' => ['required', 'numeric', 'min:1', 'max:99999999'],
            'max_amount' => ['required', 'numeric', 'gte:min_amount', 'max:99999999'],
            'interest_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'interest_method' => ['required', Rule::in(LoanProduct::INTEREST_METHODS)],
            'term_min_months' => ['required', 'integer', 'min:1', 'max:360'],
            'term_max_months' => ['required', 'integer', 'gte:term_min_months', 'max:360'],
            'payment_frequency' => ['required', Rule::in(LoanProduct::FREQUENCIES)],
            'processing_fee_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'service_fee_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'penalty_rate_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'grace_period_days' => ['required', 'integer', 'min:0', 'max:365'],
            'requires_guarantor' => ['required', 'boolean'],
            'guarantor_count' => ['required', 'integer', 'min:0', 'max:5', 'required_if_accepted:requires_guarantor', Rule::when($request->boolean('requires_guarantor'), ['min:1'])],
            'requires_collateral' => ['required', 'boolean'],
            'min_membership_months' => ['required', 'integer', 'min:0', 'max:600'],
            'status' => ['required', Rule::in(LoanProduct::STATUSES)],
            'documents' => ['nullable', 'array', 'max:20'],
            'documents.*.name' => ['required', 'string', 'max:120'],
            'documents.*.is_required' => ['required', 'boolean'],
        ]);
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    private function attributes(array $data): array
    {
        unset($data['documents']);

        // Without a guarantor requirement the count is meaningless.
        if (! ($data['requires_guarantor'] ?? false)) {
            $data['guarantor_count'] = 0;
        }

        $data['code'] = strtoupper($data['code']);

        return $data;
    }

    /** @param list<array{name:string,is_required:bool}> $documents */
    private function syncDocuments(LoanProduct $product, array $documents): void
    {
        $product->documents()->delete();

        foreach ($documents as $document) {
            $product->documents()->create([
                'name' => trim($document['name']),
                'is_required' => (bool) $document['is_required'],
            ]);
        }
    }

    /** @return array<string,mixed> */
    private function snapshot(LoanProduct $product): array
    {
        return (new LoanProductResource($product))->resolve();
    }
}
