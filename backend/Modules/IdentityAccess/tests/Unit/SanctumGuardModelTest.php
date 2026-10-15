<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Tests\Unit;

use Modules\IdentityAccess\Models\User;
use Spatie\Permission\Guard;
use Tests\TestCase;

/**
 * Regression: `auth:sanctum` switches the default guard to "sanctum". Spatie's
 * Role::users() (used by withCount('users') on the roles list) resolves the
 * User model from that guard, and used to get null -> "Class name must be a
 * valid object or a string".
 */
class SanctumGuardModelTest extends TestCase
{
    public function test_sanctum_guard_resolves_the_user_model(): void
    {
        $this->assertSame(User::class, Guard::getModelForGuard('sanctum'));
        $this->assertSame(User::class, Guard::getModelForGuard('web'));
    }
}
