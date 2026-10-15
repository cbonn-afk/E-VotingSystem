<?php

use Illuminate\Support\Facades\Route;
use Modules\Members\Http\Controllers\MembersController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('members', MembersController::class)->names('members');
});
