<?php

declare(strict_types=1);

namespace Modules\Loan\Http\Resources;

/** Member list row: summary only. */
final class PortalLoanListResource extends LoanDetailResource
{
    public function __construct($resource)
    {
        parent::__construct($resource, false, false);
    }
}
