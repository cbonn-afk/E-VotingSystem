<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_applications', function (Blueprint $table): void {
            $table->id();
            $table->string('reference_no', 30)->nullable()->unique(); // LN-2026-000001, set right after insert
            $table->foreignId('member_id')->constrained('members')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('loan_products')->restrictOnDelete();
            $table->string('status', 30)->default('draft')->index();

            $table->decimal('amount', 14, 2);
            $table->unsignedSmallInteger('term_months');
            $table->text('purpose');
            $table->decimal('monthly_income', 14, 2)->nullable();
            $table->string('employer_business', 160)->nullable();
            $table->string('collateral_description', 500)->nullable();
            $table->decimal('collateral_value', 14, 2)->nullable();

            $table->string('signature_path')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->json('product_snapshot')->nullable(); // the product's terms as they were at submission
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('status_remarks')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'status']);
        });

        Schema::create('loan_application_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('loan_applications')->cascadeOnDelete();
            $table->string('requirement', 120);            // matches a product document name
            $table->string('path');                         // private disk
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedInteger('size');
            $table->string('status', 20)->default('pending'); // pending | accepted | rejected
            $table->text('remarks')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['application_id', 'requirement']);
        });

        Schema::create('loan_application_guarantors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('loan_applications')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['application_id', 'member_id']);
        });

        Schema::create('loan_application_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('loan_applications')->cascadeOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->string('actor_type', 10);               // member | staff
            $table->string('actor_name')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_application_events');
        Schema::dropIfExists('loan_application_guarantors');
        Schema::dropIfExists('loan_application_documents');
        Schema::dropIfExists('loan_applications');
    }
};
