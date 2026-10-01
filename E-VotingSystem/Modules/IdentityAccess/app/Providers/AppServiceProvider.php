<?php

namespace Modules\IdentityAccess\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Super Admin and Admin pass every permission check.
        Gate::before(
            static fn (User $user): ?bool => $user->hasFullAccess() ? true : null,
        );
    }
}
