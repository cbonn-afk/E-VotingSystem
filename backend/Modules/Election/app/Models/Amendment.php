<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Amendment extends Model
{
    protected $table = 'election_amendments';

    protected $fillable = [
        'assembly_id',
        'title',
        'proposed_by',
        'original_content',
        'proposed_content',
        'effect',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(AmendmentVote::class);
    }
}
