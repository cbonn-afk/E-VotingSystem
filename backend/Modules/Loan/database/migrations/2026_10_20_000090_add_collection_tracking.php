<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // When a loan counts as delinquent or in default, by days past due.
        Schema::table('loan_settings', function (Blueprint $table): void {
            $table->unsignedSmallInteger('delinquent_after_days')->default(30);
            $table->unsignedSmallInteger('default_after_days')->default(90);
        });

        // Saved by the daily job (and refreshed whenever a payment is recorded) so lists can be sorted and filtered.
        Schema::table('loans', function (Blueprint $table): void {
            $table->string('collection_status', 15)->default('current')->index(); // current | due | overdue | delinquent | default | paid
            $table->unsignedSmallInteger('days_past_due')->default(0)->index();
            $table->decimal('overdue_amount', 14, 2)->default(0);                  // unpaid principal and interest of installments already late
            $table->date('oldest_due_date')->nullable();
            $table->date('status_checked_on')->nullable();
        });

        Schema::create('loan_status_history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->string('from_status', 15)->nullable();
            $table->string('to_status', 15);
            $table->unsignedSmallInteger('days_past_due');
            $table->date('changed_on');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['loan_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_status_history');
        Schema::table('loans', function (Blueprint $table): void {
            $table->dropColumn(['collection_status', 'days_past_due', 'overdue_amount', 'oldest_due_date', 'status_checked_on']);
        });
        Schema::table('loan_settings', function (Blueprint $table): void {
            $table->dropColumn(['delinquent_after_days', 'default_after_days']);
        });
    }
};
