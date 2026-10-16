<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The approval chain is configurable: a level is required when the loan amount reaches its "from" amount.
        Schema::create('loan_approval_levels', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('sequence')->unique();
            $table->string('name', 80);
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete(); // null = anyone with loan.approve
            $table->decimal('min_amount', 14, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('loan_application_evaluations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained('loan_applications')->cascadeOnDelete();
            $table->foreignId('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('evaluator_name');
            $table->string('recommendation', 20);               // approve | approve_lower | reject
            $table->decimal('recommended_amount', 14, 2)->nullable();
            $table->decimal('verified_income', 14, 2)->nullable();
            $table->decimal('existing_obligations', 14, 2)->nullable();
            $table->text('notes');
            $table->timestamps();
        });

        Schema::create('loan_application_approvals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('loan_applications')->cascadeOnDelete();
            $table->unsignedSmallInteger('sequence');
            $table->string('level_name', 80);                   // snapshot, so renaming a level never rewrites history
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('approver_name');
            $table->string('decision', 10);                     // approved | rejected
            $table->decimal('approved_amount', 14, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('decided_at');
            $table->timestamps();

            $table->unique(['application_id', 'sequence']);
        });

        Schema::table('loan_applications', function (Blueprint $table): void {
            $table->decimal('approved_amount', 14, 2)->nullable()->after('amount');
            $table->json('approval_chain')->nullable()->after('product_snapshot'); // levels required, fixed at evaluation
        });

        // Starting point from the cooperative's lending policy; editable under Loan > Approval levels.
        $now = now();
        DB::table('loan_approval_levels')->insert([
            ['sequence' => 1, 'name' => 'Loan Officer', 'role_id' => null, 'min_amount' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['sequence' => 2, 'name' => 'Credit Committee', 'role_id' => null, 'min_amount' => 50000, 'created_at' => $now, 'updated_at' => $now],
            ['sequence' => 3, 'name' => 'Management / Board', 'role_id' => null, 'min_amount' => 200000, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table): void {
            $table->dropColumn(['approved_amount', 'approval_chain']);
        });
        Schema::dropIfExists('loan_application_approvals');
        Schema::dropIfExists('loan_application_evaluations');
        Schema::dropIfExists('loan_approval_levels');
    }
};
