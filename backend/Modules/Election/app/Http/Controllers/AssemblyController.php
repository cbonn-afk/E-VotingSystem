<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Election\Enums\AssemblyStatus;
use Modules\Election\Models\Assembly;
use Modules\IdentityAccess\Enums\AuditAction;
use Modules\IdentityAccess\Support\AuditLogger;

final class AssemblyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Assembly::query()->withCount('registrations')->orderByDesc('year')->get(),
        ]);
    }

    public function current(): JsonResponse
    {
        return response()->json(['data' => Assembly::current()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'between:2000,2100', 'unique:election_assemblies,year'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $assembly = Assembly::query()->create($data + ['status' => AssemblyStatus::Draft]);

        AuditLogger::record($request->user(), AuditAction::ElectionAssemblyCreated, $assembly, after: $assembly->attributesToArray());

        return response()->json(['data' => $assembly], 201);
    }

    public function update(Request $request, Assembly $assembly): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:255']]);

        $before = $assembly->attributesToArray();
        $assembly->update($data);

        AuditLogger::record($request->user(), AuditAction::ElectionAssemblyUpdated, $assembly, $before, $assembly->attributesToArray());

        return response()->json(['data' => $assembly]);
    }

    public function status(Request $request, Assembly $assembly): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::enum(AssemblyStatus::class)]]);
        $to = AssemblyStatus::from($data['status']);
        $from = $assembly->status;

        if (! $from->canTransitionTo($to)) {
            $this->fail('status', "An assembly cannot move from [{$from->value}] to [{$to->value}].");
        }

        if ($to->isOpen() && Assembly::query()
            ->whereKeyNot($assembly->id)
            ->whereIn('status', [AssemblyStatus::Registration->value, AssemblyStatus::Voting->value])
            ->exists()) {
            $this->fail('status', 'Another assembly is already open. Close it first.');
        }

        if ($to === AssemblyStatus::Voting) {
            if (! $assembly->positions()->exists() && ! $assembly->amendments()->exists()) {
                $this->fail('status', 'Add positions or amendments before opening voting.');
            }

            if ($assembly->positions()->doesntHave('candidates')->exists()) {
                $this->fail('status', 'Every position needs at least one candidate before voting can open.');
            }
        }

        if ($from === AssemblyStatus::Voting && $to === AssemblyStatus::Registration && $assembly->hasVotes()) {
            $this->fail('status', 'Voting cannot be reopened for registration once votes have been cast.');
        }

        $assembly->update(['status' => $to]);

        AuditLogger::record(
            $request->user(),
            AuditAction::ElectionAssemblyStatusUpdated,
            $assembly,
            ['status' => $from->value],
            ['status' => $to->value],
        );

        return response()->json(['data' => $assembly]);
    }

    public function destroy(Request $request, Assembly $assembly): JsonResponse
    {
        if ($assembly->status !== AssemblyStatus::Draft || $assembly->registrations()->exists()) {
            $this->fail('assembly', 'Only an empty draft assembly can be deleted.');
        }

        $before = $assembly->attributesToArray();
        $assembly->delete();

        AuditLogger::record($request->user(), AuditAction::ElectionAssemblyDeleted, $assembly, before: $before);

        return response()->json(status: 204);
    }
}
