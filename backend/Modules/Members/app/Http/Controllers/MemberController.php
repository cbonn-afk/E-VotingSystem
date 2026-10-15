<?php

declare(strict_types=1);

namespace Modules\Members\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Members\Exports\MemberTemplateExport;
use Modules\Members\Http\Resources\MemberResource;
use Modules\Members\Models\Member;
use Modules\Members\Support\MemberImporter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MemberController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q', ''));

        $members = Member::query()
            ->when($q !== '', fn ($query) => $query->where(function ($w) use ($q): void {
                $like = '%'.$q.'%';
                $w->where('name', 'ilike', $like)
                    ->orWhere('member_code', 'ilike', $like)
                    ->orWhere('mobile_number', 'like', $like);
            }))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->query('status')))
            ->orderBy('name')
            ->paginate(min((int) $request->query('per_page', 15), 100));

        return MemberResource::collection($members);
    }

    public function store(Request $request): JsonResponse
    {
        $member = Member::create($this->validated($request));

        return (new MemberResource($member))->response()->setStatusCode(201);
    }

    public function update(Request $request, Member $member): MemberResource
    {
        $member->update($this->validated($request, $member));

        return new MemberResource($member->refresh());
    }

    public function destroy(Member $member): JsonResponse
    {
        $member->delete();

        return response()->json(null, 204);
    }

    /** POST file + commit=0 (check only) or commit=1 (save). */
    public function import(Request $request, MemberImporter $importer): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:5120'],
            'commit' => ['sometimes', 'boolean'],
        ]);

        $result = $importer->run($request->file('file'), $request->boolean('commit'));

        return response()->json(
            ['message' => $result['fatal'] ?? 'Import checked.', 'data' => $result],
            $result['fatal'] === null ? 200 : 422,
        );
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(new MemberTemplateExport, 'members-template.xlsx');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request, ?Member $member = null): array
    {
        $request->merge(['mobile_number' => Member::normalizeMobile($request->input('mobile_number'))]);

        return $request->validate([
            'member_code' => ['required', 'string', 'max:50', Rule::unique('members', 'member_code')->ignore($member?->id)],
            'name' => ['required', 'string', 'max:255'],
            'mobile_number' => ['required', 'string'],
            'birth_date' => ['nullable', 'date_format:Y-m-d'],
            'address' => ['nullable', 'string', 'max:255'],
            'membership_date' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['required', Rule::in(Member::STATUSES)],
            'is_delinquent' => ['required', 'boolean'],
        ], ['mobile_number.required' => 'Enter a valid PH mobile number, e.g. 09171234567.']);
    }
}
