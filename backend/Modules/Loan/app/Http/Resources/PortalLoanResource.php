<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

/** Member's own loan with schedule and posted payments. */
final class PortalLoanResource extends LoanDetailResource
{
    public function __construct($resource)
    {
        parent::__construct($resource, false, true);
    }
}
