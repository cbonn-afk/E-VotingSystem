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
        // The cooperative's penalty policy. Starts at the common rule: 2% a month on the overdue installment.
        Schema::table('loan_settings', function (Blueprint $table): void {
            $table->string('penalty_rate_source', 20)->default('coop_default');   // coop_default | product
            $table->decimal('default_penalty_rate_percent', 6, 3)->default(2);    // percent per month
            $table->string('penalty_calculation', 30)->default('per_month_or_fraction'); // per_month_or_fraction | daily_prorated
        });

        // Each agreement freezes the rules it was signed under; the loan copies them at release.
        Schema::table('loan_agreements', function (Blueprint $table): void {
            $table->string('penalty_basis', 20)->default('installment');
            $table->string('penalty_calculation', 30)->default('per_month_or_fraction');
            $table->string('payment_allocation', 40)->default('penalty_interest_principal');
        });

        Schema::table('loans', function (Blueprint $table): void {
            $table->decimal('penalty_rate_percent', 6, 3)->default(0);
            $table->unsignedSmallInteger('grace_period_days')->default(0);
            $table->string('penalty_basis', 20)->default('installment');
            $table->string('penalty_calculation', 30)->default('per_month_or_fraction');
            $table->string('payment_allocation', 40)->default('penalty_interest_principal');
            $table->timestamp('fully_paid_at')->nullable();
        });

        Schema::table('loan_schedule_items', function (Blueprint $table): void {
            $table->decimal('paid_principal', 14, 2)->default(0);
            $table->decimal('paid_interest', 14, 2)->default(0);
            $table->decimal('paid_penalty', 14, 2)->default(0);
            $table->decimal('penalty_accrued', 14, 2)->default(0);
            $table->date('penalty_through')->nullable();   // penalties have been accrued up to this date
        });

        Schema::create('loan_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->restrictOnDelete();
            $table->string('receipt_no', 30)->nullable()->unique();
            $table->date('paid_on');
            $table->decimal('amount', 14, 2);
            $table->string('method', 20);                       // cash | check | bank_transfer | savings_deduction
            $table->string('reference_no', 80)->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 10)->default('posted')->index(); // posted | voided
            $table->decimal('balance_after', 14, 2);            // unpaid principal and interest after this payment
            $table->decimal('penalty_after', 14, 2);            // unpaid penalties after this payment
            $table->json('accrual_before');                     // per installment, so a void can restore it exactly
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('received_by_name');
            $table->timestamp('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('voided_by_name')->nullable();
            $table->text('void_reason')->nullable();
            $table->timestamps();

            $table->index(['loan_id', 'status']);
        });

        Schema::create('loan_payment_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('payment_id')->constrained('loan_payments')->cascadeOnDelete();
            $table->foreignId('schedule_item_id')->constrained('loan_schedule_items')->cascadeOnDelete();
            $table->string('component', 10);                    // penalty | interest | principal
            $table->decimal('amount', 14, 2);
        });

        // Loans released before this update carry the penalty terms of their agreement.
        foreach (DB::table('loans')->get() as $loan) {
            $agreement = DB::table('loan_agreements')->where('application_id', $loan->application_id)->first();

            if ($agreement !== null) {
                DB::table('loans')->where('id', $loan->id)->update([
                    'penalty_rate_percent' => $agreement->penalty_rate_percent,
                    'grace_period_days' => $agreement->grace_period_days,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_payment_allocations');
        Schema::dropIfExists('loan_payments');
        Schema::table('loan_schedule_items', function (Blueprint $table): void {
            $table->dropColumn(['paid_principal', 'paid_interest', 'paid_penalty', 'penalty_accrued', 'penalty_through']);
        });
        Schema::table('loans', function (Blueprint $table): void {
            $table->dropColumn(['penalty_rate_percent', 'grace_period_days', 'penalty_basis', 'penalty_calculation', 'payment_allocation', 'fully_paid_at']);
        });
        Schema::table('loan_agreements', function (Blueprint $table): void {
            $table->dropColumn(['penalty_basis', 'penalty_calculation', 'payment_allocation']);
        });
        Schema::table('loan_settings', function (Blueprint $table): void {
            $table->dropColumn(['penalty_rate_source', 'default_penalty_rate_percent', 'penalty_calculation']);
        });
    }
};
