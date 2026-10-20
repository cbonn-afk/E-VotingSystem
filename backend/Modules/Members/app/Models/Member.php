<?php

declare(strict_types=1);

namespace Modules\Members\Models;

use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    public const STATUSES = ['active', 'inactive'];

    /** Given to every new member (manual registration or import). They must change it at first sign-in. */
    public const DEFAULT_PASSWORD = 'Password123';

    protected $table = 'members';

    protected $fillable = [
        'member_code', 'name', 'mobile_number', 'birth_date',
        'address', 'membership_date', 'status', 'is_delinquent',
        'password', 'require_password_change',
    ];

    protected $hidden = ['password'];

    protected static function booted(): void
    {
        // Every way of creating a member (form, Excel import, seeders) gets the default password.
        static::creating(function (self $member): void {
            if (blank($member->password)) {
                $member->password = self::DEFAULT_PASSWORD;
                $member->require_password_change = true;
            }
        });
    }

    /** Back to the default password; the member must change it again at next sign-in. */
    public function resetPassword(): void
    {
        $this->forceFill(['password' => self::DEFAULT_PASSWORD, 'require_password_change' => true])->save();
    }

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'membership_date' => 'date:Y-m-d',
            'is_delinquent' => 'boolean',
            'password' => 'hashed',
            'require_password_change' => 'boolean',
        ];
    }

    /** 09171234567 / 9171234567 / 639171234567 / +639171234567 -> +639171234567, else null. */
    public static function normalizeMobile(?string $value): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $value) ?? '';

        if (preg_match('/^0(9\d{9})$/', $digits, $m) === 1) {
            return '+63'.$m[1];
        }
        if (preg_match('/^63(9\d{9})$/', $digits, $m) === 1) {
            return '+63'.$m[1];
        }
        if (preg_match('/^(9\d{9})$/', $digits, $m) === 1) {
            return '+63'.$m[1];
        }

        return null;
    }
}
