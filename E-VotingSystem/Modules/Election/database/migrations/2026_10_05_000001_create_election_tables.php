<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master list of members (replaces `members`).
        Schema::create('election_members', function (Blueprint $table): void {
            $table->id();
            $table->string('member_code')->unique();
            $table->string('name')->index();
            $table->date('birth_date')->nullable();
            $table->string('address')->nullable();
            $table->boolean('is_delinquent')->default(false);
            $table->timestamps();
        });

        // One general assembly per year (replaces the `ga_code = year` convention).
        Schema::create('election_assemblies', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('year')->unique();
            $table->string('name');
            $table->string('status')->default('draft')->index();
            $table->timestamps();
        });

        // Attendance + "has this member voted" flags (replaces `gen_assembly_registered_members`).
        Schema::create('election_registrations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assembly_id')->constrained('election_assemblies')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('election_members')->restrictOnDelete();
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('registered_at');
            $table->timestamp('election_voted_at')->nullable();
            $table->timestamp('amendments_voted_at')->nullable();
            $table->timestamps();

            $table->unique(['assembly_id', 'member_id']);
        });

        // Positions (replaces `..._aspirant_titles`).
        Schema::create('election_positions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assembly_id')->constrained('election_assemblies')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedTinyInteger('seats')->default(1);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Candidates (replaces `..._aspirants`).
        Schema::create('election_candidates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('position_id')->constrained('election_positions')->cascadeOnDelete();
            $table->string('name');
            $table->string('photo_path')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Proposed amendments (replaces `cbl_ammendment_lists`).
        Schema::create('election_amendments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assembly_id')->constrained('election_assemblies')->cascadeOnDelete();
            $table->string('title');
            $table->string('proposed_by')->nullable();
            $table->text('original_content');
            $table->text('proposed_content');
            $table->text('effect')->nullable();
            $table->timestamps();
        });

        // Anonymous votes: NO member reference and NO timestamps, so a ballot
        // can never be traced back to the person who cast it.
        Schema::create('election_candidate_votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assembly_id')->constrained('election_assemblies')->cascadeOnDelete();
            $table->foreignId('position_id')->constrained('election_positions');
            $table->foreignId('candidate_id')->constrained('election_candidates');

            $table->index(['position_id', 'candidate_id']);
        });

        Schema::create('election_amendment_votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assembly_id')->constrained('election_assemblies')->cascadeOnDelete();
            $table->foreignId('amendment_id')->constrained('election_amendments');
            $table->string('choice');

            $table->index(['amendment_id', 'choice']);
        });

        // Token / item distribution (replaces `token_logs`).
        Schema::create('election_token_distributions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('assembly_id')->constrained('election_assemblies')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('election_members')->restrictOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('issued_at');
            $table->timestamps();

            $table->unique(['assembly_id', 'member_id']);
        });

        // Print titles (replaces `settings`; open/close is now the assembly status).
        Schema::create('election_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('company_title')->nullable();
            $table->string('document_title')->nullable();
            $table->string('document_sub_title')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'election_settings',
            'election_token_distributions',
            'election_amendment_votes',
            'election_candidate_votes',
            'election_amendments',
            'election_candidates',
            'election_positions',
            'election_registrations',
            'election_assemblies',
            'election_members',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
