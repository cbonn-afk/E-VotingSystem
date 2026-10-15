<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Models;

use Modules\IdentityAccess\Enums\SystemRole;
use Modules\IdentityAccess\Enums\ThemePreference;
use Modules\IdentityAccess\Enums\UserStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable, SoftDeletes;

    protected string $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'avatar_path',
        'theme_preference',
        'password',
        'status',
        'require_password_change',
        'deactivated_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    /** Public URL of the stored avatar, or null. */
    protected function avatarUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->avatar_path
                ? Storage::disk('public')->url($this->avatar_path)
                : null,
        );
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
            'theme_preference' => ThemePreference::class,
            'require_password_change' => 'boolean',
            'deactivated_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /** Sign the user out everywhere (API tokens and browser sessions). */
    public function revokeAccess(): void
    {
        $this->tokens()->delete();

        DB::table('sessions')->where('user_id', $this->getKey())->delete();
    }

    /** Super Admin and Admin both have unrestricted access. */
    public function hasFullAccess(): bool
    {
        return $this->hasAnyRole(SystemRole::fullAccessValues());
    }
}
