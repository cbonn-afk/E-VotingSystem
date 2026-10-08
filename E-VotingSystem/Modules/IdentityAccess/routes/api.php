<?php

use Modules\IdentityAccess\Http\Controllers\Api\AuditLogController;
use Modules\IdentityAccess\Http\Controllers\Api\AuthController;
use Modules\IdentityAccess\Http\Controllers\Api\NotificationController;
use Modules\IdentityAccess\Http\Controllers\Api\RoleController;
use Modules\IdentityAccess\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware(['auth:sanctum', 'password.changed'])->group(function (): void {
    // Any signed-in user
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::patch('auth/password', [AuthController::class, 'changePassword']);
    Route::post('auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'read']);

    // Users
    Route::get('users', [UserController::class, 'index'])->middleware('can:settings.users.view');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('can:settings.users.view');
    Route::post('users', [UserController::class, 'store'])->middleware('can:settings.users.manage');
    Route::patch('users/{user}', [UserController::class, 'update'])->middleware('can:settings.users.manage');
    Route::patch('users/{user}/status', [UserController::class, 'status'])->middleware('can:settings.users.manage');
    Route::put('users/{user}/roles', [UserController::class, 'roles'])->middleware('can:settings.users.manage');
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('can:settings.users.manage');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('can:settings.users.manage');

    // Roles
    Route::get('roles', [RoleController::class, 'index'])->middleware('can:settings.roles.view');
    Route::post('roles', [RoleController::class, 'store'])->middleware('can:settings.roles.manage');
    Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('can:settings.roles.manage');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('can:settings.roles.manage');

    // Audit log
    Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('can:settings.audit.view');
});
