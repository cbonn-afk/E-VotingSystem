<?php

declare(strict_types=1);

namespace Modules\Inquiry\Tests\Feature;

use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Models\ImportBatch;
use Modules\Inquiry\Models\LoanBalance;

final class StatementImportTest extends InquiryTestCase
{
    public function test_checking_a_file_reports_rows_and_writes_nothing(): void
    {
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.import']));

        $file = $this->balancesCsv([
            ['R1', 'b0092', 'Juan Dela Cruz', '1000', '250', '6000', '120', '280', '2026-09-30', ''],
        ]);

        $this->post('/api/inquiry/imports/balances', ['file' => $file, 'commit' => '0'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.importable', 1)
            ->assertJsonPath('data.committed', false)
            ->assertJsonPath('data.as_of_date', '2026-09-30');

        $this->assertDatabaseCount('inquiry_balances', 0);
    }

    public function test_committing_replaces_existing_rows_and_logs_the_import(): void
    {
        $user = $this->staff(['inquiry.access', 'inquiry.statements.import']);
        $this->actingAs($user);

        AccountBalance::query()->create(['member_code' => 'OLD1', 'member_name' => 'Old Member']);

        $file = $this->balancesCsv([
            ['R1', 'b0092', 'Juan Dela Cruz', '1,000.50', '250', '6000', '120', '280', '2026-09-30', ''],
            ['', 'a0046', 'Ana Reyes', '500', '0', '100', '0', '0', '09-30-2026', ''],
        ]);

        $this->post('/api/inquiry/imports/balances', ['file' => $file, 'commit' => '1'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.committed', true)
            ->assertJsonPath('data.existing', 1);

        $this->assertDatabaseMissing('inquiry_balances', ['member_code' => 'OLD1']);
        $this->assertDatabaseHas('inquiry_balances', ['member_code' => 'B0092', 'share_capital' => '1000.50']);
        $this->assertDatabaseHas('inquiry_balances', ['member_code' => 'A0046', 'as_of_date' => '2026-09-30']);
        $this->assertSame(1, ImportBatch::query()->where('type', 'balances')->where('row_count', 2)->where('imported_by', $user->id)->count());
    }

    public function test_a_file_with_errors_is_refused_and_leaves_data_untouched(): void
    {
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.import']));
        AccountBalance::query()->create(['member_code' => 'KEEP', 'member_name' => 'Keep Me']);

        $file = $this->balancesCsv([
            ['', 'B1', 'Good Row', '1', '1', '1', '1', '1', '2026-09-30', ''],
            ['', 'B2', 'Bad Date', '1', '1', '1', '1', '1', 'not a date', ''],
            ['', 'B1', 'Repeated Code', '1', '1', '1', '1', '1', '2026-09-30', ''],
        ]);

        // Check step lists the problems (HTTP 200).
        $this->post('/api/inquiry/imports/balances', ['file' => $file, 'commit' => '0'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonCount(2, 'data.errors');

        // Commit step refuses.
        $this->post('/api/inquiry/imports/balances', ['file' => $this->balancesCsv([
            ['', 'B2', 'Bad Date', '1', '1', '1', '1', '1', 'not a date', ''],
        ]), 'commit' => '1'], ['Accept' => 'application/json'])->assertStatus(422);

        $this->assertDatabaseHas('inquiry_balances', ['member_code' => 'KEEP']);
        $this->assertDatabaseCount('inquiry_balances', 1);
    }

    public function test_transactions_and_loans_import(): void
    {
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.import']));

        $tx = $this->csv('tx.csv', [
            ['member_code', 'type', 'mode', 'amount', 'balance', 'date'],
            ['b0092', 'rs', 'w', '50', '950', '2026-06-26'],
            ['b0092', 'RS', 'Deposit', '1000', '1000', '06-25-2026'],
        ]);
        $this->post('/api/inquiry/imports/transactions', ['file' => $tx, 'commit' => '1'], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.committed', true);
        $this->assertSame(2, AccountTransaction::query()->where('member_code', 'B0092')->count());

        $loans = $this->csv('loans.csv', [
            ['member_code', 'loan_code', 'loan_number', 'loan_type', 'principal', 'interest', 'pp', 'ip', 'pb', 'ib', 'rel', 'start', 'mat'],
            ['b0092', 'reg', 'l-1', 'regular loan', '50000', '6000', '10000', '1200', '40000', '4800', '2026-01-15', '2026-02-01', ''],
        ]);
        $this->post('/api/inquiry/imports/loans', ['file' => $loans, 'commit' => '1'], ['Accept' => 'application/json'])
            ->assertOk();
        $this->assertDatabaseHas('inquiry_loans', ['loan_number' => 'L-1', 'principal_balance' => '40000.00']);
        $this->assertSame(1, LoanBalance::query()->count());
    }

    public function test_importing_needs_the_import_permission(): void
    {
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.view']));

        $this->post('/api/inquiry/imports/balances', ['file' => $this->balancesCsv([]), 'commit' => '0'], ['Accept' => 'application/json'])
            ->assertForbidden();
    }

    public function test_unknown_import_type_is_not_found(): void
    {
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.import']));

        $this->post('/api/inquiry/imports/members', ['file' => $this->balancesCsv([])], ['Accept' => 'application/json'])
            ->assertNotFound();
    }
}
