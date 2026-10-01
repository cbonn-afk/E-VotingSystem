<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Models;

use Modules\IdentityAccess\Enums\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

final class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id')->withTrashed();
    }

    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'subject_id' => 'string',
            'before' => 'array',
            'after' => 'array',
            'created_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        self::updating(static fn (): never => throw new LogicException('Audit logs are append-only.'));
        self::deleting(static fn (): never => throw new LogicException('Audit logs are append-only.'));
    }
}
