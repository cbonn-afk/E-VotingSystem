<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The SMS code step was removed; the member code is now the only sign-in. */
    public function up(): void
    {
        Schema::dropIfExists('loan_portal_otps');
    }

    public function down(): void
    {
        Schema::create('loan_portal_otps', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('purpose')->default('login');
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['member_id', 'purpose', 'created_at']);
        });
    }
};
