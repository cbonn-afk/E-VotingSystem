<?php

use Illuminate\Support\Facades\Route;
use Modules\Election\Http\Controllers\ElectionController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('elections', ElectionController::class)->names('election');
});
