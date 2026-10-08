<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;

/** Anonymous: no voter reference, no timestamps. */
final class CandidateVote extends Model
{
    public $timestamps = false;

    protected $table = 'election_candidate_votes';

    protected $fillable = ['assembly_id', 'position_id', 'candidate_id'];
}
