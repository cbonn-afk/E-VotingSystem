<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Support\MemberDirectory;

final class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(array_keys((array) config('inquiry.transaction_types')))],
            'mode' => ['nullable', Rule::in(array_keys((array) config('inquiry.transaction_modes')))],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $page = AccountTransaction::query()
            ->leftJoin('inquiry_balances as b', 'b.member_code', '=', 'inquiry_transactions.member_code')
            ->select('inquiry_transactions.*', 'b.member_name')
            ->when($filters['search'] ?? null, fn ($q, string $s) => $q->where(
                fn ($q) => $q->whereLike('inquiry_transactions.member_code', "%{$s}%")->orWhereLike('b.member_name', "%{$s}%"),
            ))
            ->when($filters['type'] ?? null, fn ($q, string $v) => $q->where('inquiry_transactions.account_type', $v))
            ->when($filters['mode'] ?? null, fn ($q, string $v) => $q->where('inquiry_transactions.mode', $v))
            ->when($filters['from'] ?? null, fn ($q, string $v) => $q->where('inquiry_transactions.transacted_on', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, string $v) => $q->where('inquiry_transactions.transacted_on', '<=', $v))
            ->orderByDesc('inquiry_transactions.transacted_on')
            ->orderByDesc('inquiry_transactions.id')
            ->paginate($filters['per_page'] ?? 25)
            ->through(static fn (AccountTransaction $t): array => $t->makeHidden(['created_at', 'updated_at'])->toArray());

        return $this->paginated(MemberDirectory::applyTo($page));
    }
}
