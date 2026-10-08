<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\IdentityAccess\Models\User;

final class Registration extends Model
{
    protected $table = 'election_registrations';

    protected $fillable = [
        'assembly_id',
        'member_id',
        'registered_by',
        'registered_at',
        'election_voted_at',
        'amendments_voted_at',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'election_voted_at' => 'datetime',
            'amendments_voted_at' => 'datetime',
        ];
    }

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(Assembly::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function hasVoted(): bool
    {
        return $this->election_voted_at !== null || $this->amendments_voted_at !== null;
    }
}
