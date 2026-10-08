<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\ValidationException;
use Modules\Election\Enums\AssemblyStatus;

final class Assembly extends Model
{
    protected $table = 'election_assemblies';

    protected $fillable = ['year', 'name', 'status'];

    protected function casts(): array
    {
        return ['status' => AssemblyStatus::class];
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class)->orderBy('sort_order')->orderBy('id');
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(Amendment::class)->orderBy('id');
    }

    /** The assembly being worked on: the open one, otherwise the latest year. */
    public static function current(): ?self
    {
        return self::query()
            ->whereIn('status', [AssemblyStatus::Registration->value, AssemblyStatus::Voting->value])
            ->orderByDesc('year')
            ->first()
            ?? self::query()->orderByDesc('year')->first();
    }

    public static function currentOrFail(): self
    {
        return self::current() ?? throw ValidationException::withMessages([
            'assembly' => ['No assembly has been created yet.'],
        ]);
    }

    public function assertSetupOpen(): void
    {
        if (! $this->status->allowsSetupChanges()) {
            throw ValidationException::withMessages([
                'assembly' => ['The ballot setup is locked once voting has started.'],
            ]);
        }
    }

    public function hasVotes(): bool
    {
        return CandidateVote::query()->where('assembly_id', $this->id)->exists()
            || AmendmentVote::query()->where('assembly_id', $this->id)->exists();
    }
}
