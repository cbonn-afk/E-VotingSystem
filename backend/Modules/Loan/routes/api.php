<?php

use Illuminate\Support\Facades\Route;
use Modules\Loan\Http\Controllers\LoanApplicationController;
use Modules\Loan\Http\Controllers\LoanProductController;
use Modules\Loan\Http\Controllers\LoanSettingsController;
use Modules\Loan\Http\Controllers\PortalApplicationController;
use Modules\Loan\Http\Controllers\PortalAuthController;

// Loaded by the module RouteServiceProvider with prefix "api".

// Staff (IdentityAccess login)
Route::middleware(['auth:sanctum', 'password.changed'])->prefix('loan')->group(function (): void {
    Route::get('settings', [LoanSettingsController::class, 'show'])->middleware('can:loan.settings.manage');
    Route::patch('settings', [LoanSettingsController::class, 'update'])->middleware('can:loan.settings.manage');

    Route::get('products', [LoanProductController::class, 'index'])->middleware('can:loan.products.manage');
    Route::get('products/{product}', [LoanProductController::class, 'show'])->middleware('can:loan.products.manage');
    Route::post('products', [LoanProductController::class, 'store'])->middleware('can:loan.products.manage');
    Route::patch('products/{product}', [LoanProductController::class, 'update'])->middleware('can:loan.products.manage');

    Route::get('applications', [LoanApplicationController::class, 'index'])->middleware('can:loan.applications.view');
    Route::get('applications/{application}', [LoanApplicationController::class, 'show'])->middleware('can:loan.applications.view');
    Route::get('applications/{application}/documents/{document}/download', [LoanApplicationController::class, 'downloadDocument'])->middleware('can:loan.applications.view');
    Route::get('applications/{application}/signature', [LoanApplicationController::class, 'signature'])->middleware('can:loan.applications.view');
    Route::post('applications/{application}/transition', [LoanApplicationController::class, 'transition'])->middleware('can:loan.applications.manage');
    Route::patch('applications/{application}/documents/{document}', [LoanApplicationController::class, 'reviewDocument'])->middleware('can:loan.applications.manage');
});

// Member portal (member code only, no accounts)
Route::middleware('portal.network')->prefix('loan-portal')->group(function (): void {
    Route::post('auth/login', [PortalAuthController::class, 'login'])->middleware('throttle:30,1');

    Route::middleware('portal.session')->group(function (): void {
        Route::post('auth/logout', [PortalAuthController::class, 'logout']);
        Route::get('me', [PortalAuthController::class, 'me']);

        Route::get('products', [PortalApplicationController::class, 'products']);
        Route::get('applications', [PortalApplicationController::class, 'index']);
        Route::post('applications', [PortalApplicationController::class, 'store']);
        Route::get('applications/{application}', [PortalApplicationController::class, 'show']);
        Route::patch('applications/{application}', [PortalApplicationController::class, 'update']);
        Route::delete('applications/{application}', [PortalApplicationController::class, 'destroy']);
        Route::post('applications/{application}/documents', [PortalApplicationController::class, 'uploadDocument']);
        Route::delete('applications/{application}/documents/{document}', [PortalApplicationController::class, 'deleteDocument']);
        Route::get('applications/{application}/documents/{document}/download', [PortalApplicationController::class, 'downloadDocument']);
        Route::put('applications/{application}/guarantors', [PortalApplicationController::class, 'setGuarantors']);
        Route::post('applications/{application}/signature', [PortalApplicationController::class, 'saveSignature']);
        Route::post('applications/{application}/submit', [PortalApplicationController::class, 'submit']);
    });
});
