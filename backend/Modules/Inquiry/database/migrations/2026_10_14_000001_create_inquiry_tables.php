<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Current balance snapshot, one row per member (replaces `account_balances`).
        // Money is decimal, not double. Dividend columns replace the misnamed
        // `credit_to_share_capital_percentage` / `credit_to_bank_savings` (they hold amounts).
        Schema::create('inquiry_balances', function (Blueprint $table): void {
            $table->id();
            $table->string('member_code', 50)->unique();   // always stored UPPERCASE
            $table->string('rf_id', 100)->nullable()->unique(); // RFID card number, optional
            $table->string('member_name')->index();
            $table->decimal('share_capital', 15, 2)->default(0);
            $table->decimal('savings_bonus', 15, 2)->default(0);
            $table->decimal('regular_savings', 15, 2)->default(0);
            $table->decimal('time_deposit', 15, 2)->default(0);
            $table->decimal('dividend_to_share_capital', 15, 2)->default(0);
            $table->decimal('dividend_to_savings', 15, 2)->default(0);
            $table->date('as_of_date')->nullable();
            $table->timestamps();
        });

        // Savings / share capital / time deposit movements (replaces `account_transactions`).
        Schema::create('inquiry_transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('member_code', 50);
            $table->string('account_type', 10);            // RS | TD | SC (see config/config.php)
            $table->string('mode', 1);                      // D deposit | W withdrawal
            $table->decimal('amount', 15, 2);
            $table->decimal('running_balance', 15, 2);
            $table->date('transacted_on');
            $table->timestamps();

            $table->index(['member_code', 'transacted_on']);
        });

        // Loan balances (replaces `inquiry_loan_balances`; `loan_mortuary_date` was a typo for maturity).
        Schema::create('inquiry_loans', function (Blueprint $table): void {
            $table->id();
            $table->string('member_code', 50)->index();
            $table->string('loan_code', 50);
            $table->string('loan_number', 50);
            $table->string('loan_type');
            $table->decimal('principal', 15, 2)->default(0);
            $table->decimal('interest', 15, 2)->default(0);
            $table->decimal('principal_paid', 15, 2)->default(0);
            $table->decimal('interest_paid', 15, 2)->default(0);
            $table->decimal('principal_balance', 15, 2)->default(0);
            $table->decimal('interest_balance', 15, 2)->default(0);
            $table->date('released_on')->nullable();
            $table->date('start_on')->nullable();
            $table->date('maturity_on')->nullable();
            $table->timestamps();
        });

        // One row per successful Excel import, so staff can see what is loaded and who loaded it.
        Schema::create('inquiry_imports', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 20)->index();            // balances | transactions | loans
            $table->string('file_name');
            $table->unsignedInteger('row_count');
            $table->date('as_of_date')->nullable();
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Notices shown on the inquiry station (replaces `announcements`).
        Schema::create('inquiry_announcements', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->string('image_path')->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiry_announcements');
        Schema::dropIfExists('inquiry_imports');
        Schema::dropIfExists('inquiry_loans');
        Schema::dropIfExists('inquiry_transactions');
        Schema::dropIfExists('inquiry_balances');
    }
};
