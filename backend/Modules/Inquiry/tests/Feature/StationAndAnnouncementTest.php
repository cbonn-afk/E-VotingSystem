<?php

declare(strict_types=1);

namespace Modules\Inquiry\Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Inquiry\Models\AccountBalance;
use Modules\Inquiry\Models\AccountTransaction;
use Modules\Inquiry\Models\Announcement;
use Modules\Inquiry\Models\LoanBalance;
use Modules\Members\Models\Member;

final class StationAndAnnouncementTest extends InquiryTestCase
{
    private function seedMember(): void
    {
        AccountBalance::query()->create([
            'member_code' => 'B0092', 'rf_id' => '0012345678', 'member_name' => 'Juan Dela Cruz',
            'share_capital' => '1000.00', 'regular_savings' => '6000.00', 'as_of_date' => '2026-09-30',
        ]);
        LoanBalance::query()->create([
            'member_code' => 'B0092', 'loan_code' => 'REG', 'loan_number' => 'L-1', 'loan_type' => 'REGULAR LOAN',
            'principal_balance' => '40000.00',
        ]);
        AccountTransaction::query()->create([
            'member_code' => 'B0092', 'account_type' => 'RS', 'mode' => 'D', 'amount' => '1000.00',
            'running_balance' => '1000.00', 'transacted_on' => '2026-06-25',
        ]);
    }

    public function test_station_finds_a_member_by_badge_number_or_card(): void
    {
        $this->seedMember();
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.station.use']));

        foreach (['b0092', ' B0092 ', '0012345678'] as $scan) {
            $this->postJson('/api/inquiry/station/lookup', ['code' => $scan])
                ->assertOk()
                ->assertJsonPath('data.member.member_name', 'Juan Dela Cruz')
                ->assertJsonPath('data.member.regular_savings', '6000.00')
                ->assertJsonPath('data.has_statement', true)
                ->assertJsonPath('data.loans.0.loan_number', 'L-1')
                ->assertJsonPath('data.transactions.0.account_type', 'RS')
                ->assertJsonMissingPath('data.member.rf_id');
        }
    }

    public function test_unknown_badge_is_a_validation_error(): void
    {
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.station.use']));

        $this->postJson('/api/inquiry/station/lookup', ['code' => 'NOPE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_station_needs_its_permission(): void
    {
        $this->seedMember();
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.view']));

        $this->postJson('/api/inquiry/station/lookup', ['code' => 'B0092'])->assertForbidden();
    }

    public function test_statement_lists_are_searchable(): void
    {
        $this->seedMember();
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.statements.view']));

        $this->getJson('/api/inquiry/balances?search=juan')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonMissingPath('data.0.rf_id');
        $this->getJson('/api/inquiry/balances?search=zzz')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/inquiry/transactions?type=RS&search=B0092')->assertOk()->assertJsonPath('data.0.member_name', 'Juan Dela Cruz');
        $this->getJson('/api/inquiry/transactions?type=XX')->assertStatus(422);
        $this->getJson('/api/inquiry/loans?search=L-1')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/inquiry/summary')->assertOk()->assertJsonPath('data.balances.members', 1)->assertJsonPath('data.loans.principal_balance', '40000.00');
    }

    public function test_managers_create_announcements_and_others_only_see_published_ones(): void
    {
        Storage::fake('public');

        $this->actingAs($this->staff(['inquiry.access', 'inquiry.announcements.manage']));
        $this->post('/api/inquiry/announcements', [
            'title' => 'Office closed', 'body' => 'Closed on Friday.', 'is_published' => '1',
            'image' => UploadedFile::fake()->image('notice.png'),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.title', 'Office closed');
        $this->post('/api/inquiry/announcements', ['title' => 'Draft', 'body' => 'Not yet.', 'is_published' => '0'], ['Accept' => 'application/json'])->assertCreated();

        $this->getJson('/api/inquiry/announcements')->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame(1, Announcement::query()->whereNotNull('image_path')->count());

        $this->actingAs($this->staff(['inquiry.access', 'inquiry.station.use']));
        $this->getJson('/api/inquiry/announcements')->assertOk()->assertJsonCount(1, 'data');
        $this->post('/api/inquiry/announcements', ['title' => 'x', 'body' => 'y'], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_the_members_list_is_the_source_of_names_and_status(): void
    {
        $this->seedMember();
        Member::query()->create([
            'member_code' => 'b0092', // Members keeps codes as typed; Inquiry matches ignoring case
            'name' => 'JUAN M. DELA CRUZ',
            'mobile_number' => '+639171234567',
            'status' => 'inactive',
        ]);
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.station.use', 'inquiry.statements.view']));

        $this->postJson('/api/inquiry/station/lookup', ['code' => 'B0092'])
            ->assertOk()
            ->assertJsonPath('data.member.member_name', 'JUAN M. DELA CRUZ');

        $this->getJson('/api/inquiry/balances?search=m. dela')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.member_name', 'JUAN M. DELA CRUZ')
            ->assertJsonPath('data.0.member_status', 'inactive');
        $this->getJson('/api/inquiry/loans')->assertOk()->assertJsonPath('data.0.member_name', 'JUAN M. DELA CRUZ');
    }

    public function test_a_member_in_the_members_list_works_before_any_balance_file_is_imported(): void
    {
        Member::query()->create(['member_code' => 'M-0001', 'name' => 'Juan Dela Cruz', 'mobile_number' => '+639502134081']);
        $this->actingAs($this->staff(['inquiry.access', 'inquiry.station.use']));

        $this->postJson('/api/inquiry/station/lookup', ['code' => 'm-0001'])
            ->assertOk()
            ->assertJsonPath('data.member.member_name', 'Juan Dela Cruz')
            ->assertJsonPath('data.member.member_code', 'M-0001')
            ->assertJsonPath('data.member.share_capital', '0.00')
            ->assertJsonPath('data.has_statement', false)
            ->assertJsonPath('data.loans', []);

        $this->postJson('/api/inquiry/station/lookup', ['code' => 'M-9999'])->assertStatus(422)->assertJsonValidationErrors('code');
    }
}
