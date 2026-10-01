<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}
