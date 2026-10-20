<?php

namespace Modules\Loan\Providers;

use Modules\Loan\Http\Middleware\EnsurePortalNetwork;
use Modules\Loan\Http\Middleware\EnsurePortalPasswordChanged;
use Modules\Loan\Http\Middleware\EnsurePortalSession;
use Modules\Loan\Support\Sms\LogSmsSender;
use Modules\Loan\Support\Sms\SmsSender;
use Nwidart\Modules\Support\ModuleServiceProvider;

class LoanServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Loan';

    protected string $nameLower = 'loan';

    protected array $providers = [
        RouteServiceProvider::class,
    ];

    public function register(): void
    {
        parent::register();

        // Add real drivers (Semaphore, Twilio, ...) here when the provider is chosen.
        $this->app->bind(SmsSender::class, fn () => match (config('loan.sms.driver')) {
            default => new LogSmsSender,
        });
    }

    public function boot(): void
    {
        parent::boot();

        $router = $this->app['router'];
        $router->aliasMiddleware('portal.network', EnsurePortalNetwork::class);
        $router->aliasMiddleware('portal.session', EnsurePortalSession::class);
        $router->aliasMiddleware('portal.password', EnsurePortalPasswordChanged::class);
    }
}
