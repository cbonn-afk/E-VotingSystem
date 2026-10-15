<?php

use Illuminate\Support\Facades\Route;
use Modules\Members\Http\Controllers\MemberController;

// Loaded by the module RouteServiceProvider with prefix "api".
Route::middleware(['auth:sanctum', 'password.changed'])
    ->prefix('members')
    ->name('members.')
    ->group(function (): void {
        Route::get('template', [MemberController::class, 'template'])->middleware('can:members.manage');
        Route::post('import', [MemberController::class, 'import'])->middleware('can:members.manage');

        Route::get('/', [MemberController::class, 'index'])->middleware('can:members.view');
        Route::post('/', [MemberController::class, 'store'])->middleware('can:members.manage');
        Route::patch('{member}', [MemberController::class, 'update'])->middleware('can:members.manage');
        Route::delete('{member}', [MemberController::class, 'destroy'])->middleware('can:members.manage');
    });
