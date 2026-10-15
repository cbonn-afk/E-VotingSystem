<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Members\Models\Member;

class PortalSession extends Model
{
    protected $table = 'loan_portal_sessions';

    protected $fillable = ['member_id', 'token_hash', 'ip_address', 'user_agent', 'last_activity_at', 'expires_at'];

    protected function casts(): array
    {
        return ['last_activity_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}
