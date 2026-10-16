<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Money rules the cooperative may change later. Defaults are the most common practice.
        Schema::table('loan_settings', function (Blueprint $table): void {
            $table->string('diminishing_method', 30)->default('equal_installment');   // equal_installment | fixed_principal
            $table->string('fee_handling', 30)->default('deduct_from_proceeds');      // deduct_from_proceeds | collect_separately
            $table->string('payment_allocation', 40)->default('penalty_interest_principal'); // used when payments are recorded
            $table->string('penalty_basis', 20)->default('installment');              // installment | principal_balance (used by penalties)
            $table->text('agreement_terms')->nullable();                              // null = the built-in default text
        });

        Schema::create('loan_agreements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained('loan_applications')->cascadeOnDelete();
            $table->string('agreement_no', 30)->nullable()->unique();

            // Terms frozen when the agreement is generated.
            $table->decimal('principal', 14, 2);
            $table->decimal('interest_rate', 6, 3);
            $table->string('interest_method', 20);
            $table->string('diminishing_method', 30);
            $table->string('payment_frequency', 20);
            $table->unsignedSmallInteger('term_months');
            $table->unsignedSmallInteger('installments_count');
            $table->decimal('installment_amount', 14, 2);
            $table->decimal('total_interest', 14, 2);
            $table->decimal('processing_fee', 14, 2);
            $table->decimal('service_fee', 14, 2);
            $table->decimal('net_proceeds', 14, 2);
            $table->string('fee_handling', 30);
            $table->decimal('penalty_rate_percent', 6, 3);
            $table->unsignedSmallInteger('grace_period_days');
            $table->date('first_due_date');
            $table->date('maturity_date');
            $table->json('schedule');
            $table->text('terms_text');

            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at');
            $table->timestamp('signed_at')->nullable();
            $table->string('signed_method', 10)->nullable();   // portal | paper
            $table->string('signature_path')->nullable();
            $table->string('paper_path')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('loans', function (Blueprint $table): void {
            $table->id();
            $table->string('loan_no', 30)->nullable()->unique();
            $table->foreignId('application_id')->unique()->constrained('loan_applications')->restrictOnDelete();
            $table->foreignId('member_id')->constrained('members')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('loan_products')->restrictOnDelete();
            $table->decimal('principal', 14, 2);
            $table->decimal('total_interest', 14, 2);
            $table->decimal('outstanding_balance', 14, 2);       // principal + interest still unpaid
            $table->unsignedSmallInteger('installments_count');
            $table->date('first_due_date');
            $table->date('maturity_date');
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('released_at');
            $table->timestamps();
        });

        Schema::create('loan_schedule_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->date('due_date');
            $table->decimal('principal', 14, 2);
            $table->decimal('interest', 14, 2);
            $table->decimal('total', 14, 2);
            $table->decimal('balance_after', 14, 2);
            $table->timestamps();

            $table->unique(['loan_id', 'number']);
        });

        Schema::create('loan_releases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_id')->unique()->constrained('loans')->cascadeOnDelete();
            $table->string('receipt_no', 30)->nullable()->unique();
            $table->string('method', 20);                       // cash | check | bank_transfer | savings_credit
            $table->string('reference_no', 80)->nullable();
            $table->decimal('amount_released', 14, 2);          // what the member actually received
            $table->decimal('fees_total', 14, 2);
            $table->string('fee_handling', 30);
            $table->text('remarks')->nullable();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('released_by_name');
            $table->timestamp('released_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_releases');
        Schema::dropIfExists('loan_schedule_items');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('loan_agreements');
        Schema::table('loan_settings', function (Blueprint $table): void {
            $table->dropColumn(['diminishing_method', 'fee_handling', 'payment_allocation', 'penalty_basis', 'agreement_terms']);
        });
    }
};
