<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

/** Staff list row: summary only, no schedule or payments. */
final class LoanListResource extends LoanDetailResource
{
    public function __construct($resource)
    {
        parent::__construct($resource, true, false);
    }
}
