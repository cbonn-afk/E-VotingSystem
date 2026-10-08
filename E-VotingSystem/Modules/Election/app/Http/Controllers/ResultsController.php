<?php

declare(strict_types=1);

namespace Modules\Election\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Election\Actions\TallyResults;

final class ResultsController extends Controller
{
    public function show(Request $request, TallyResults $action): JsonResponse
    {
        return response()->json(['data' => $action->execute($this->assembly($request))]);
    }
}
