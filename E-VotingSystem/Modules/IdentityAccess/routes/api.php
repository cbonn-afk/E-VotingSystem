<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function (): void {
    // Any signed-in user
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'read']);

    // Users — each route needs its permission (`can:` = Laravel Gate + Spatie)
    Route::get('users', [UserController::class, 'index'])->middleware('can:users.view');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('can:users.view');
    Route::post('users', [UserController::class, 'store'])->middleware('can:users.create');
    Route::patch('users/{user}', [UserController::class, 'update'])->middleware('can:users.update');
    Route::patch('users/{user}/status', [UserController::class, 'status'])->middleware('can:users.update');
    Route::put('users/{user}/roles', [UserController::class, 'roles'])->middleware('can:users.roles.manage');
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('can:users.password.reset');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('can:users.delete');

    // Roles
    Route::get('roles', [RoleController::class, 'index'])->middleware('can:roles.view');
    Route::post('roles', [RoleController::class, 'store'])->middleware('can:roles.manage');
    Route::patch('roles/{role}', [RoleController::class, 'update'])->middleware('can:roles.manage');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('can:roles.manage');

    // Audit log
    Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('can:audit.view');
});
