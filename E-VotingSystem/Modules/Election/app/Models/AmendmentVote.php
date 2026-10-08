<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Election\Enums\AmendmentChoice;

/** Anonymous: no voter reference, no timestamps. */
final class AmendmentVote extends Model
{
    public $timestamps = false;

    protected $table = 'election_amendment_votes';

    protected $fillable = ['assembly_id', 'amendment_id', 'choice'];

    protected function casts(): array
    {
        return ['choice' => AmendmentChoice::class];
    }
}
