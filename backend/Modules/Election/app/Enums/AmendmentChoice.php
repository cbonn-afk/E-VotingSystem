<?php

declare(strict_types=1);

namespace Modules\Election\Enums;

enum AmendmentChoice: string
{
    case Agree = 'agree';
    case Disagree = 'disagree';
}
