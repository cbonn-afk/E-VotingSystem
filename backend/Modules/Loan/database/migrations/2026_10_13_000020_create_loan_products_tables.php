<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_products', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 120);
            $table->string('description', 500)->nullable();

            $table->decimal('min_amount', 14, 2);
            $table->decimal('max_amount', 14, 2);
            $table->decimal('interest_rate', 6, 3);            // percent per year
            $table->string('interest_method');                   // diminishing | flat
            $table->unsignedSmallInteger('term_min_months');
            $table->unsignedSmallInteger('term_max_months');
            $table->string('payment_frequency');                 // weekly | semi_monthly | monthly

            $table->decimal('processing_fee_percent', 6, 3)->default(0);
            $table->decimal('service_fee_percent', 6, 3)->default(0);
            $table->decimal('penalty_rate_percent', 6, 3)->default(0); // percent per month overdue
            $table->unsignedSmallInteger('grace_period_days')->default(0);

            $table->boolean('requires_guarantor')->default(false);
            $table->unsignedTinyInteger('guarantor_count')->default(0);
            $table->boolean('requires_collateral')->default(false);
            $table->unsignedSmallInteger('min_membership_months')->default(0);

            $table->string('status')->default('active')->index(); // active | inactive
            $table->timestamps();
        });

        Schema::create('loan_product_documents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained('loan_products')->cascadeOnDelete();
            $table->string('name', 120);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_product_documents');
        Schema::dropIfExists('loan_products');
    }
};
