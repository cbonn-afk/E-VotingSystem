<?php

declare(strict_types=1);

namespace Modules\Inquiry\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\IdentityAccess\Models\User;
use Modules\Inquiry\Models\Announcement;

/** Notices for the inquiry station screen. Matched by title, so re-running does not duplicate them. */
final class InquiryAnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->role('Inquiry Officer')->orderBy('id')->first()
            ?? User::query()->orderBy('id')->first();

        $notices = [
            [
                'title' => 'Annual General Assembly',
                'body' => 'Our General Assembly will be held at the cooperative hall. Please register at the front desk with your member code. Only members in good standing may vote.',
                'is_published' => true,
            ],
            [
                'title' => 'Dividends are now available',
                'body' => 'The dividend to share capital and savings for the year has been posted. Check your statement here, or ask the cashier about your credit.',
                'is_published' => true,
            ],
            [
                'title' => 'Office hours during the holiday season',
                'body' => 'The cooperative office will close at noon on December 24 and December 31. Regular hours resume on the next working day.',
                'is_published' => true,
            ],
            [
                'title' => 'Draft: Loan amnesty program',
                'body' => 'Waiver of penalties for members who settle past-due loans before the cut-off date. Details to be confirmed by the board.',
                'is_published' => false,
            ],
        ];

        foreach ($notices as $notice) {
            Announcement::query()->firstOrCreate(
                ['title' => $notice['title']],
                $notice + ['created_by' => $author?->id],
            );
        }
    }
}
