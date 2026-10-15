<?php

namespace Modules\IdentityAccess\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'IdentityAccess';

    public function boot(): void
    {
        parent::boot();
    }

    /** API only: the web routes and scaffold controller were removed. */
    public function map(): void
    {
        Route::middleware('api')->prefix('api')->name('api.')->group(module_path($this->name, '/routes/api.php'));
    }
}
