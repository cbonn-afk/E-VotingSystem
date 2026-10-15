<?php

namespace Modules\Loan\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'Loan';

    public function boot(): void
    {
        parent::boot();
    }

    public function map(): void
    {
        Route::middleware('api')->prefix('api')->name('loan.')->group(module_path($this->name, '/routes/api.php'));
    }
}
