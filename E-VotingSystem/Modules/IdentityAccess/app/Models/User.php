<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Models;

use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected string $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'require_password_change',
        'deactivated_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
            'require_password_change' => 'boolean',
            'deactivated_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /** Super Admin and Admin both have unrestricted access. */
    public function hasFullAccess(): bool
    {
        return $this->hasAnyRole(SystemRole::fullAccessValues());
    }
}
