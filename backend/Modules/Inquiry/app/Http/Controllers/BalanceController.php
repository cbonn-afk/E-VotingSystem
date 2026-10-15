<?php

declare(strict_types=1);

namespace Modules\Inquiry\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Support\MemberDirectory;

final class BalanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $page = AccountBalance::query()
            ->when($filters['search'] ?? null, fn ($q, string $s) => $q->where(
                fn ($q) => $q->whereLike('member_name', "%{$s}%")->orWhereLike('member_code', "%{$s}%")
                    // ...or the name kept in the Members list
                    ->orWhereRaw('EXISTS (SELECT 1 FROM members m WHERE UPPER(m.member_code) = inquiry_balances.member_code AND LOWER(m.name) LIKE ?)', ['%'.mb_strtolower($s).'%']),
            ))
            ->orderBy('member_name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 25)
            ->through(static fn (AccountBalance $b): array => $b->makeHidden(['rf_id', 'created_at', 'updated_at'])->toArray());

        return $this->paginated(MemberDirectory::applyTo($page));
    }
}
