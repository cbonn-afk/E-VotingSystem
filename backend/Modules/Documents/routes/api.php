<?php

use Illuminate\Support\Facades\Route;
use Modules\Documents\Http\Controllers\DocumentSettingsController;

// Loaded by the module RouteServiceProvider with prefix "api".

Route::middleware(['auth:sanctum', 'password.changed'])->prefix('documents')->group(function (): void {
    // Every signed-in user needs to read the branding so any printable can render it.
    Route::get('settings', [DocumentSettingsController::class, 'show']);

    Route::patch('settings', [DocumentSettingsController::class, 'update'])->middleware('can:settings.documents.manage');
    Route::post('settings/logo', [DocumentSettingsController::class, 'logo'])->middleware('can:settings.documents.manage');
});
