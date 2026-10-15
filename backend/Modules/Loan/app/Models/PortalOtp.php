<?php

declare(strict_types=1);

namespace Modules\Loan\Models;

use Illuminate\Database\Eloquent\Model;

class PortalOtp extends Model
{
    protected $table = 'loan_portal_otps';

    protected $fillable = ['member_id', 'purpose', 'code_hash', 'attempts', 'expires_at', 'used_at', 'ip_address'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'used_at' => 'datetime'];
    }

    public static function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) config('app.key'));
    }
}
