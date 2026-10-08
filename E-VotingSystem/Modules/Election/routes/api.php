<?php

use Illuminate\Support\Facades\Route;
use Modules\Election\Http\Controllers\AmendmentController;
use Modules\Election\Http\Controllers\AssemblyController;
use Modules\Election\Http\Controllers\CandidateController;
use Modules\Election\Http\Controllers\ExportController;
use Modules\Election\Http\Controllers\MemberController;
use Modules\Election\Http\Controllers\PositionController;
use Modules\Election\Http\Controllers\RegistrationController;
use Modules\Election\Http\Controllers\ResultsController;
use Modules\Election\Http\Controllers\SettingController;
use Modules\Election\Http\Controllers\TokenController;
use Modules\Election\Http\Controllers\VotingController;

Route::prefix('election')
    ->middleware(['auth:sanctum', 'password.changed', 'can:election.access'])
    ->group(function (): void {
        // Assemblies (one per year)
        Route::get('assemblies', [AssemblyController::class, 'index']);
        Route::get('assemblies/current', [AssemblyController::class, 'current']);
        Route::post('assemblies', [AssemblyController::class, 'store'])->middleware('can:election.assemblies.manage');
        Route::patch('assemblies/{assembly}', [AssemblyController::class, 'update'])->middleware('can:election.assemblies.manage');
        Route::patch('assemblies/{assembly}/status', [AssemblyController::class, 'status'])->middleware('can:election.assemblies.manage');
        Route::delete('assemblies/{assembly}', [AssemblyController::class, 'destroy'])->middleware('can:election.assemblies.manage');

        // Member master list
        Route::get('members', [MemberController::class, 'index'])->middleware('can:election.members.view');
        Route::post('members', [MemberController::class, 'store'])->middleware('can:election.members.manage');
        Route::post('members/import', [MemberController::class, 'import'])->middleware('can:election.members.manage');
        Route::patch('members/{member}', [MemberController::class, 'update'])->middleware('can:election.members.manage');
        Route::delete('members/{member}', [MemberController::class, 'destroy'])->middleware('can:election.members.manage');

        // Attendance registration
        Route::get('registrations', [RegistrationController::class, 'index'])->middleware('can:election.registration.view');
        Route::get('registrations/lookup/{memberCode}', [RegistrationController::class, 'lookup'])->middleware('can:election.registration.manage');
        Route::post('registrations', [RegistrationController::class, 'store'])->middleware('can:election.registration.manage');
        Route::delete('registrations/{registration}', [RegistrationController::class, 'destroy'])->middleware('can:election.registration.manage');

        // Ballot setup: positions, candidates, amendments
        Route::get('positions', [PositionController::class, 'index'])->middleware('can:election.ballot.view');
        Route::get('amendments', [AmendmentController::class, 'index'])->middleware('can:election.ballot.view');
        Route::middleware('can:election.ballot.manage')->group(function (): void {
            Route::post('positions', [PositionController::class, 'store']);
            Route::patch('positions/{position}', [PositionController::class, 'update']);
            Route::delete('positions/{position}', [PositionController::class, 'destroy']);
            Route::post('positions/{position}/candidates', [CandidateController::class, 'store']);
            Route::post('candidates/{candidate}', [CandidateController::class, 'update']);
            Route::delete('candidates/{candidate}', [CandidateController::class, 'destroy']);
            Route::post('amendments', [AmendmentController::class, 'store']);
            Route::patch('amendments/{amendment}', [AmendmentController::class, 'update']);
            Route::delete('amendments/{amendment}', [AmendmentController::class, 'destroy']);
        });

        // Voting station
        Route::middleware('can:election.voting.cast')->prefix('voting')->group(function (): void {
            Route::get('ballot', [VotingController::class, 'ballot']);
            Route::post('eligibility', [VotingController::class, 'eligibility']);
            Route::post('cast', [VotingController::class, 'cast'])->middleware('throttle:60,1');
        });

        // Results
        Route::get('results', [ResultsController::class, 'show'])->middleware('can:election.results.view');

        // Token / item distribution
        Route::get('tokens', [TokenController::class, 'index'])->middleware('can:election.tokens.manage');
        Route::post('tokens', [TokenController::class, 'store'])->middleware('can:election.tokens.manage');

        // Settings
        Route::get('settings', [SettingController::class, 'show']);
        Route::put('settings', [SettingController::class, 'update'])->middleware('can:election.settings.manage');

        // Excel exports
        Route::middleware('can:election.reports.export')->prefix('exports')->group(function (): void {
            Route::get('members', [ExportController::class, 'members']);
            Route::get('attendance', [ExportController::class, 'attendance']);
            Route::get('tokens', [ExportController::class, 'tokens']);
        });
    });
