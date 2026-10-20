<?php

declare(strict_types=1);

namespace Modules\Members\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Modules\Members\Models\Member;
use Modules\Members\Support\MemberImporter;
use Tests\TestCase;

final class MemberDefaultPasswordTest extends TestCase
{
    use RefreshDatabase;

    private function csv(string $body): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'members').'.csv';
        file_put_contents($path, $body);

        return new UploadedFile($path, 'members.csv', 'text/csv', null, true);
    }

    public function test_imported_members_get_the_default_password_and_must_change_it(): void
    {
        $result = (new MemberImporter)->run($this->csv("member_code,name,mobile_number\nM-1,Ana,09171234567\nM-2,Ben,09171234568\n"), true);

        $this->assertSame(2, $result['created']);

        foreach (['M-1', 'M-2'] as $code) {
            $member = Member::where('member_code', $code)->first();
            $this->assertTrue(Hash::check('Password123', $member->password));
            $this->assertTrue($member->require_password_change);
        }
    }

    public function test_re_importing_does_not_reset_a_password_the_member_already_changed(): void
    {
        (new MemberImporter)->run($this->csv("member_code,name,mobile_number\nM-1,Ana,09171234567\n"), true);
        Member::where('member_code', 'M-1')->first()->forceFill(['password' => 'Mine-now-123', 'require_password_change' => false])->save();

        $result = (new MemberImporter)->run($this->csv("member_code,name,mobile_number\nM-1,Ana Updated,09171234567\n"), true);

        $this->assertSame(1, $result['updated']);
        $member = Member::where('member_code', 'M-1')->first();
        $this->assertSame('Ana Updated', $member->name);
        $this->assertTrue(Hash::check('Mine-now-123', $member->password));
        $this->assertFalse($member->require_password_change);
    }

    public function test_the_members_api_never_exposes_the_password(): void
    {
        $member = Member::create(['member_code' => 'M-9', 'name' => 'Zed', 'mobile_number' => '+639171234569', 'status' => 'active', 'is_delinquent' => false]);

        $this->assertArrayNotHasKey('password', (new \Modules\Members\Http\Resources\MemberResource($member))->toArray(request()));
    }
}
