<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Loan\Models\LoanSetting;
use Modules\Loan\Models\PortalSession;
use Modules\Members\Models\Member;
use Tests\TestCase;

final class PortalAuthTest extends TestCase
{
    use RefreshDatabase;

    private const AJAX = ['X-Requested-With' => 'XMLHttpRequest'];

    protected function setUp(): void
    {
        parent::setUp();

        LoanSetting::current()->update(['portal_access_mode' => 'online']);

        Member::create(['member_code' => 'M-0001', 'name' => 'Juan Dela Cruz', 'mobile_number' => '+639171234567', 'status' => 'active', 'is_delinquent' => false]);
        Member::create(['member_code' => 'M-0002', 'name' => 'Inactive Member', 'mobile_number' => '+639171234568', 'status' => 'inactive', 'is_delinquent' => false]);
    }

    private function login(string $code, string $password = Member::DEFAULT_PASSWORD)
    {
        return $this->postJson('/api/loan-portal/auth/login', ['member_code' => $code, 'password' => $password]);
    }

    /** Signs in and keeps the session cookie for the following requests. */
    private function signIn(string $code = 'M-0001', string $password = Member::DEFAULT_PASSWORD): void
    {
        $res = $this->login($code, $password)->assertOk();

        $this->withCredentials()->withUnencryptedCookie('loan_portal_session', $res->getCookie('loan_portal_session', false)->getValue());
    }

    public function test_new_members_get_the_default_password_and_must_change_it(): void
    {
        $member = Member::where('member_code', 'M-0001')->first();

        $this->assertTrue(Hash::check('Password123', $member->password));
        $this->assertNotSame('Password123', $member->getRawOriginal('password'));
        $this->assertTrue($member->require_password_change);
        $this->assertArrayNotHasKey('password', $member->toArray());
    }

    public function test_the_default_password_signs_in_and_flags_the_required_change(): void
    {
        $this->login('M-0001')
            ->assertOk()
            ->assertJsonPath('data.member_code', 'M-0001')
            ->assertJsonPath('data.require_password_change', true);
    }

    public function test_a_wrong_password_unknown_code_and_inactive_member_get_the_same_error(): void
    {
        $wrong = $this->login('M-0001', 'nope-nope');
        $unknown = $this->login('NOPE');
        $inactive = $this->login('M-0002');

        foreach ([$wrong, $unknown, $inactive] as $res) {
            $res->assertStatus(422);
        }

        $this->assertSame($unknown->json('errors.member_code'), $wrong->json('errors.member_code'));
        $this->assertSame($unknown->json('errors.member_code'), $inactive->json('errors.member_code'));
    }

    public function test_the_member_code_alone_no_longer_signs_in(): void
    {
        $this->postJson('/api/loan-portal/auth/login', ['member_code' => 'M-0001'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_repeated_wrong_passwords_are_locked_out_even_for_the_right_one(): void
    {
        RateLimiter::clear('loan-portal:ip:127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $this->login('M-0001', 'wrong-'.$i)->assertStatus(422);
        }

        $this->login('M-0001')->assertStatus(429);
    }

    public function test_one_ip_guessing_many_codes_is_locked_out(): void
    {
        RateLimiter::clear('loan-portal:ip:127.0.0.1');

        for ($i = 0; $i < 20; $i++) {
            $this->login('X-'.$i)->assertStatus(422);
        }

        $this->login('M-0001')->assertStatus(429);
    }

    public function test_me_requires_a_session(): void
    {
        $this->getJson('/api/loan-portal/me')->assertStatus(401);
    }

    public function test_until_the_password_is_changed_only_me_logout_and_password_work(): void
    {
        $this->signIn();

        $this->getJson('/api/loan-portal/me')->assertOk()->assertJsonPath('data.require_password_change', true);
        $this->getJson('/api/loan-portal/applications')->assertStatus(428);
        $this->getJson('/api/loan-portal/products')->assertStatus(428);
    }

    public function test_changing_the_password_unlocks_the_portal_and_the_new_password_is_used(): void
    {
        $this->signIn();

        $this->postJson('/api/loan-portal/auth/password', [
            'current_password' => 'Password123',
            'password' => 'Brand-new-pass1',
            'password_confirmation' => 'Brand-new-pass1',
        ], self::AJAX)->assertOk()->assertJsonPath('data.require_password_change', false);

        $this->getJson('/api/loan-portal/applications')->assertOk();
        $this->getJson('/api/loan-portal/me')->assertJsonPath('data.require_password_change', false);

        $member = Member::where('member_code', 'M-0001')->first();
        $this->assertFalse($member->require_password_change);
        $this->assertTrue(Hash::check('Brand-new-pass1', $member->password));

        $this->login('M-0001', 'Password123')->assertStatus(422);
        $this->login('M-0001', 'Brand-new-pass1')->assertOk()->assertJsonPath('data.require_password_change', false);
    }

    public function test_change_password_is_validated(): void
    {
        $this->signIn();

        $change = fn (array $body) => $this->postJson('/api/loan-portal/auth/password', $body, self::AJAX);

        $change(['current_password' => 'wrong', 'password' => 'Brand-new-pass1', 'password_confirmation' => 'Brand-new-pass1'])
            ->assertStatus(422)->assertJsonValidationErrors('current_password');
        $change(['current_password' => 'Password123', 'password' => 'Password123', 'password_confirmation' => 'Password123'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $change(['current_password' => 'Password123', 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $change(['current_password' => 'Password123', 'password' => 'Brand-new-pass1', 'password_confirmation' => 'different'])
            ->assertStatus(422)->assertJsonValidationErrors('password');

        $this->assertTrue(Member::where('member_code', 'M-0001')->first()->require_password_change);
    }

    public function test_changing_the_password_signs_out_the_members_other_sessions(): void
    {
        $this->login('M-0001')->assertOk(); // an older session on another device
        $this->signIn();

        $this->assertSame(2, PortalSession::count());

        $this->postJson('/api/loan-portal/auth/password', [
            'current_password' => 'Password123', 'password' => 'Brand-new-pass1', 'password_confirmation' => 'Brand-new-pass1',
        ], self::AJAX)->assertOk();

        $this->assertSame(1, PortalSession::count());
    }

    public function test_resetting_the_password_restores_the_default_and_forces_a_change(): void
    {
        $member = Member::where('member_code', 'M-0001')->first();
        $member->forceFill(['password' => 'Changed-pass-99', 'require_password_change' => false])->save();

        $member->resetPassword();

        $this->login('M-0001', 'Changed-pass-99')->assertStatus(422);
        $this->login('M-0001')->assertOk()->assertJsonPath('data.require_password_change', true);
    }

    public function test_network_only_blocks_other_networks(): void
    {
        LoanSetting::current()->update(['portal_access_mode' => 'network_only', 'allowed_networks' => ['10.0.0.0/8']]);

        $this->login('M-0001')->assertStatus(403);

        LoanSetting::current()->update(['allowed_networks' => ['127.0.0.1']]);

        $this->login('M-0001')->assertOk();
    }
}
