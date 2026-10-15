<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class LoanSetting extends Model
{
    public const MODE_NETWORK_ONLY = 'network_only';
    public const MODE_ONLINE = 'online';

    protected $table = 'loan_settings';

    protected $fillable = ['portal_access_mode', 'allowed_networks', 'session_idle_minutes', 'signature_required'];

    protected function casts(): array
    {
        return [
            'allowed_networks' => 'array',
            'session_idle_minutes' => 'integer',
            'signature_required' => 'boolean',
        ];
    }

    /** The single settings row (created on first use, closed to the internet by default). */
    public static function current(): self
    {
        return static::query()->first() ?? static::query()->create([
            'portal_access_mode' => self::MODE_NETWORK_ONLY,
            'allowed_networks' => [],
            'session_idle_minutes' => 20,
            'signature_required' => false,
        ]);
    }
}
