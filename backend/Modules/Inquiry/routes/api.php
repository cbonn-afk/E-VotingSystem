<?php

use Illuminate\Support\Facades\Route;
use Modules\Inquiry\Enums\StatementType;
use Modules\Inquiry\Http\Controllers\AnnouncementController;
use Modules\Inquiry\Http\Controllers\BalanceController;
use Modules\Inquiry\Http\Controllers\ImportController;
use Modules\Inquiry\Http\Controllers\LoanBalanceController;
use Modules\Inquiry\Http\Controllers\PortalStatementController;
use Modules\Inquiry\Http\Controllers\StationController;
use Modules\Inquiry\Http\Controllers\SummaryController;
use Modules\Inquiry\Http\Controllers\TransactionController;
use Modules\Loan\Http\Middleware\EnsurePortalNetwork;
use Modules\Loan\Http\Middleware\EnsurePortalSession;

// Loaded by the module RouteServiceProvider with prefix "api".

// Staff (IdentityAccess login)
Route::prefix('inquiry')
    ->middleware(['auth:sanctum', 'password.changed', 'can:inquiry.access'])
    ->group(function (): void {
        // Statement data
        Route::middleware('can:inquiry.statements.view')->group(function (): void {
            Route::get('summary', [SummaryController::class, 'show']);
            Route::get('balances', [BalanceController::class, 'index']);
            Route::get('transactions', [TransactionController::class, 'index']);
            Route::get('loans', [LoanBalanceController::class, 'index']);
        });

        // Excel imports (each one replaces the whole table for its type)
        Route::middleware('can:inquiry.statements.import')->prefix('imports')->group(function (): void {
            Route::get('/', [ImportController::class, 'index']);
            Route::get('{type}/template', [ImportController::class, 'template'])->whereIn('type', StatementType::values());
            Route::post('{type}', [ImportController::class, 'store'])->whereIn('type', StatementType::values());
        });

        // Inquiry station
        Route::post('station/lookup', [StationController::class, 'lookup'])
            ->middleware(['can:inquiry.station.use', 'throttle:60,1']);

        // Announcements
        Route::get('announcements', [AnnouncementController::class, 'index']);
        Route::middleware('can:inquiry.announcements.manage')->group(function (): void {
            Route::post('announcements', [AnnouncementController::class, 'store']);
            Route::post('announcements/{announcement}', [AnnouncementController::class, 'update']);
            Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy']);
        });
    });

// Member portal (member code + SMS OTP, from the Loan module). Only registered when that module is present.
if (class_exists(EnsurePortalSession::class)) {
    Route::prefix('inquiry-portal')
        ->middleware([EnsurePortalNetwork::class, EnsurePortalSession::class])
        ->group(function (): void {
            Route::get('statement', [PortalStatementController::class, 'show']);
        });
}
