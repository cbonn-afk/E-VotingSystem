<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row of Loan settings.
        Schema::create('loan_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('portal_access_mode')->default('network_only'); // network_only | online
            $table->json('allowed_networks')->nullable();                   // IPs / CIDR ranges
            $table->unsignedSmallInteger('session_idle_minutes')->default(20);
            $table->boolean('signature_required')->default(false);
            $table->timestamps();
        });

        Schema::create('loan_portal_otps', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('purpose')->default('login'); // login | submit
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['member_id', 'purpose', 'created_at']);
        });

        Schema::create('loan_portal_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('token_hash')->unique();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('last_activity_at');
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_portal_sessions');
        Schema::dropIfExists('loan_portal_otps');
        Schema::dropIfExists('loan_settings');
    }
};
