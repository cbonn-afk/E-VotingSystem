<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Members\Models\Member as SharedMember;

/**
 * Election no longer keeps its own member list. This is the Members module's `members` table
 * (one list for Election, Loan and Inquiry); Election only adds its attendance relation.
 */
class Member extends SharedMember
{
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }
}
