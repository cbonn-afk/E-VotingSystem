<?php

namespace Modules\Inquiry\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class InquiryServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Inquiry';

    protected string $nameLower = 'inquiry';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
