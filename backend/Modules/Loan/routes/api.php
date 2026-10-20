<?php

use Illuminate\Support\Facades\Route;
use Modules\Loan\Http\Controllers\LoanAccountController;
use Modules\Loan\Http\Controllers\LoanApplicationController;
use Modules\Loan\Http\Controllers\LoanApprovalLevelController;
use Modules\Loan\Http\Controllers\LoanProductController;
use Modules\Loan\Http\Controllers\LoanSettingsController;
use Modules\Loan\Http\Controllers\PortalApplicationController;
use Modules\Loan\Http\Controllers\PortalAuthController;
use Modules\Loan\Http\Controllers\PortalLoanController;

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
    Route::get('applications/{application}/signature', [LoanApplicationController::class, 'signature'])->middleware('can:loan.applications.view');
    Route::post('applications/{application}/transition', [LoanApplicationController::class, 'transition'])->middleware('can:loan.applications.manage');
    Route::post('applications/{application}/agreement/preview', [LoanApplicationController::class, 'previewAgreement'])->middleware('can:loan.applications.manage');
    Route::post('applications/{application}/agreement', [LoanApplicationController::class, 'generateAgreement'])->middleware('can:loan.applications.manage');
    Route::post('applications/{application}/release', [LoanApplicationController::class, 'release'])->middleware('can:loan.release');
    Route::post('applications/{application}/evaluation', [LoanApplicationController::class, 'evaluate'])->middleware('can:loan.evaluate');
    Route::post('applications/{application}/decision', [LoanApplicationController::class, 'decide'])->middleware('can:loan.approve');

    Route::get('loans', [LoanAccountController::class, 'index'])->middleware('can:loan.payments.view');
    Route::get('loans/{loan}', [LoanAccountController::class, 'show'])->middleware('can:loan.payments.view');
    Route::post('loans/{loan}/payments', [LoanAccountController::class, 'recordPayment'])->middleware('can:loan.payments.record');
    Route::post('loans/{loan}/payments/{payment}/void', [LoanAccountController::class, 'voidPayment'])->middleware('can:loan.payments.void');

    Route::get('approval-levels', [LoanApprovalLevelController::class, 'show'])->middleware('can:loan.settings.manage');
    Route::put('approval-levels', [LoanApprovalLevelController::class, 'update'])->middleware('can:loan.settings.manage');
});

Route::middleware('portal.network')->prefix('loan-portal')->group(function (): void {
    Route::post('auth/login', [PortalAuthController::class, 'login'])->middleware('throttle:30,1');

    Route::middleware('portal.session')->group(function (): void {
        Route::post('auth/logout', [PortalAuthController::class, 'logout']);
        Route::get('me', [PortalAuthController::class, 'me']);
        Route::post('auth/password', [PortalAuthController::class, 'changePassword'])->middleware('throttle:10,1');

        Route::middleware('portal.password')->group(function (): void {
            Route::get('products', [PortalApplicationController::class, 'products']);
            Route::get('loans', [PortalLoanController::class, 'index']);
            Route::get('loans/{loan}', [PortalLoanController::class, 'show']);
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
            Route::post('applications/{application}/agreement/sign', [PortalApplicationController::class, 'signAgreement']);
        });
    });
});
