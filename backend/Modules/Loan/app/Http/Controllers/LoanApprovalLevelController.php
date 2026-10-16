<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;
use Modules\Loan\Models\LoanApprovalLevel;
use Spatie\Permission\Models\Role;

/** The approval chain: which levels exist, who may act on each, and the loan amount each one starts at. */
class LoanApprovalLevelController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->payload()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'levels' => ['required', 'array', 'min:1', 'max:6'],
            'levels.*.name' => ['required', 'string', 'max:80', 'distinct'],
            'levels.*.role_id' => ['nullable', 'integer', 'exists:roles,id'],
            'levels.*.min_amount' => ['required', 'numeric', 'min:0', 'max:99999999'],
        ]);

        $levels = array_values($data['levels']);

        if ((float) $levels[0]['min_amount'] !== 0.0) {
            throw ValidationException::withMessages(['levels.0.min_amount' => ['The first level must start at 0 so every loan has an approver.']]);
        }

        foreach ($levels as $i => $level) {
            if ($i > 0 && (float) $level['min_amount'] <= (float) $levels[$i - 1]['min_amount']) {
                throw ValidationException::withMessages(["levels.{$i}.min_amount" => ['Each level must start at a higher amount than the one before it.']]);
            }
        }

        $before = $this->payload()['levels'];

        DB::transaction(function () use ($levels): void {
            LoanApprovalLevel::query()->delete();

            foreach ($levels as $i => $level) {
                LoanApprovalLevel::query()->create([
                    'sequence' => $i + 1,
                    'name' => trim($level['name']),
                    'role_id' => $level['role_id'] ?? null,
                    'min_amount' => $level['min_amount'],
                ]);
            }
        });

        $after = $this->payload();

        AuditLogger::record($request->user(), AuditAction::LoanApprovalLevelsUpdated, LoanApprovalLevel::query()->firstOrFail(), $before, $after['levels']);

        return response()->json(['data' => $after]);
    }

    /** @return array{levels: list<array<string,mixed>>, roles: list<array{id:int,name:string}>} */
    private function payload(): array
    {
        return [
            'levels' => LoanApprovalLevel::query()->orderBy('sequence')->get()->map(static fn (LoanApprovalLevel $l): array => [
                'sequence' => $l->sequence,
                'name' => $l->name,
                'role_id' => $l->role_id,
                'min_amount' => (string) $l->min_amount,
            ])->all(),
            'roles' => Role::query()->where('guard_name', 'web')->orderBy('name')->get(['id', 'name'])
                ->map(static fn (Role $r): array => ['id' => $r->id, 'name' => $r->name])->all(),
        ];
    }
}
