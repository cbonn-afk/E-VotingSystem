<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Position extends Model
{
    protected $table = 'election_positions';

    protected $fillable = ['assembly_id', 'title', 'seats', 'sort_order'];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class)->orderBy('sort_order')->orderBy('id');
    }
}
