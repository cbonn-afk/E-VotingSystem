<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Members no longer sign the agreement, so loans that were waiting for a signature are ready for release. */
    public function up(): void
    {
        DB::table('loan_applications')->where('status', 'for_agreement')->update(['status' => 'for_release']);
    }

    public function down(): void
    {
        // Nothing to undo: the earlier status carried no information that is lost.
    }
};
