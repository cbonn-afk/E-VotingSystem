<?php

declare(strict_types=1);

namespace Modules\Election\Models;

use Illuminate\Database\Eloquent\Model;

final class Setting extends Model
{
    protected $table = 'election_settings';

    protected $fillable = ['company_title', 'document_title', 'document_sub_title'];

    /** There is only ever one settings row. */
    public static function current(): self
    {
        return self::query()->first() ?? self::query()->create([]);
    }
}
