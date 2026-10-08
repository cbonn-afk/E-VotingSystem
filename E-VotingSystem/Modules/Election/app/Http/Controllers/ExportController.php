<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Election\Exports\AttendanceExport;
use Modules\Election\Exports\MembersExport;
use Modules\Election\Exports\TokenDistributionExport;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class ExportController extends Controller
{
    public function members(Request $request): BinaryFileResponse
    {
        $assembly = $this->assembly($request);

        return Excel::download(new MembersExport($assembly), "members-{$assembly->year}.xlsx");
    }

    public function attendance(Request $request): BinaryFileResponse
    {
        $assembly = $this->assembly($request);

        return Excel::download(new AttendanceExport($assembly), "attendance-{$assembly->year}.xlsx");
    }

    public function tokens(Request $request): BinaryFileResponse
    {
        $assembly = $this->assembly($request);

        return Excel::download(new TokenDistributionExport($assembly), "token-distribution-{$assembly->year}.xlsx");
    }
}
