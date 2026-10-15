<?php

declare(strict_types=1);

namespace Modules\Inquiry\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\IdentityAccess\Models\User;

class ImportBatch extends Model
{
    protected $table = 'inquiry_imports';

    protected $fillable = ['type', 'file_name', 'row_count', 'as_of_date', 'imported_by'];

    protected function casts(): array
    {
        return ['as_of_date' => 'date:Y-m-d'];
    }

    public function importer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}
