<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

final class Candidate extends Model
{
    protected $table = 'election_candidates';

    protected $fillable = ['position_id', 'name', 'photo_path', 'sort_order'];

    protected $hidden = ['photo_path'];

    protected $appends = ['photo_url'];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(CandidateVote::class);
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->photo_path
                ? Storage::disk('public')->url($this->photo_path)
                : null,
        );
    }
}
