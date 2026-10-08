<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Member extends Model
{
    protected $table = 'election_members';

    protected $fillable = ['member_code', 'name', 'birth_date', 'address', 'is_delinquent'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'is_delinquent' => 'boolean',
        ];
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }
}
