<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum ThemePreference: string
{
    case Light = 'light';
    case Dark = 'dark';
    case System = 'system';
}
