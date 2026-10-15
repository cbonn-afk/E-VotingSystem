<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table): void {
            $table->id();
            $table->string('member_code')->unique();
            $table->string('name')->index();
            $table->string('mobile_number')->nullable()->index(); // stored as +639XXXXXXXXX
            $table->date('birth_date')->nullable();
            $table->string('address')->nullable();
            $table->date('membership_date')->nullable();
            $table->string('status')->default('active')->index(); // active | inactive
            $table->boolean('is_delinquent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
