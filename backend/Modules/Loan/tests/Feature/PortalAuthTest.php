<?php

declare(strict_types=1);

namespace Modules\Loan\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Loan\Models\LoanSetting;
use Modules\Members\Models\Member;
use Tests\TestCase;

final class PortalAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        LoanSetting::current()->update(['portal_access_mode' => 'online']);

        Member::create(['member_code' => 'M-0001', 'name' => 'Juan Dela Cruz', 'mobile_number' => '+639171234567', 'status' => 'active', 'is_delinquent' => false]);
        Member::create(['member_code' => 'M-0002', 'name' => 'Inactive Member', 'mobile_number' => '+639171234568', 'status' => 'inactive', 'is_delinquent' => false]);
    }

    private function login(string $code)
    {
        return $this->postJson('/api/loan-portal/auth/login', ['member_code' => $code]);
    }

    public function test_a_valid_member_code_signs_in_and_me_works(): void
    {
        $res = $this->login('M-0001');
        $res->assertOk()->assertJsonPath('data.member_code', 'M-0001');

        $token = $res->getCookie('loan_portal_session', false)->getValue();

        $this->withUnencryptedCookie('loan_portal_session', $token)
            ->getJson('/api/loan-portal/me')
            ->assertOk()->assertJsonPath('data.name', 'Juan Dela Cruz');
    }

    public function test_unknown_and_inactive_codes_get_the_same_error(): void
    {
        $unknown = $this->login('NOPE');
        $inactive = $this->login('M-0002');

        $unknown->assertStatus(422);
        $inactive->assertStatus(422);
        $this->assertSame($unknown->json('errors.member_code'), $inactive->json('errors.member_code'));
    }

    public function test_repeated_wrong_codes_are_locked_out_even_for_the_right_code(): void
    {
        RateLimiter::clear('loan-portal:ip:127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $this->login('M-9999')->assertStatus(422);
        }

        $this->login('M-9999')->assertStatus(429);
    }

    public function test_one_ip_guessing_many_codes_is_locked_out(): void
    {
        RateLimiter::clear('loan-portal:ip:127.0.0.1');

        for ($i = 0; $i < 20; $i++) {
            $this->login('X-'.$i)->assertStatus(422);
        }

        // Even a real code is refused once the address has used up its guesses.
        $this->login('M-0001')->assertStatus(429);
    }

    public function test_me_requires_a_session(): void
    {
        $this->getJson('/api/loan-portal/me')->assertStatus(401);
    }

    public function test_network_only_blocks_other_networks(): void
    {
        LoanSetting::current()->update(['portal_access_mode' => 'network_only', 'allowed_networks' => ['10.0.0.0/8']]);

        $this->login('M-0001')->assertStatus(403);

        LoanSetting::current()->update(['allowed_networks' => ['127.0.0.1']]);

        $this->login('M-0001')->assertOk();
    }
}
