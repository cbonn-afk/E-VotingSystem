<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Inquiry\Models\LoanBalance;
use Modules\Inquiry\Support\MemberDirectory;

final class LoanBalanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $page = LoanBalance::query()
            ->leftJoin('inquiry_balances as b', 'b.member_code', '=', 'inquiry_loans.member_code')
            ->select('inquiry_loans.*', 'b.member_name')
            ->when($filters['search'] ?? null, fn ($q, string $s) => $q->where(
                fn ($q) => $q->whereLike('inquiry_loans.member_code', "%{$s}%")
                    ->orWhereLike('b.member_name', "%{$s}%")
                    ->orWhereLike('inquiry_loans.loan_number', "%{$s}%"),
            ))
            ->orderBy('inquiry_loans.member_code')
            ->orderBy('inquiry_loans.loan_number')
            ->paginate($filters['per_page'] ?? 25)
            ->through(static fn (LoanBalance $l): array => $l->makeHidden(['created_at', 'updated_at'])->toArray());

        return $this->paginated(MemberDirectory::applyTo($page));
    }
}
