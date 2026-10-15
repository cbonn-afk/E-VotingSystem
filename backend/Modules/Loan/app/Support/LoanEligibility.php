<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

use Modules\Loan\Models\LoanApplication;
use Modules\Loan\Models\LoanSetting;

/** Plain-language reasons why an application cannot be submitted yet. An empty list means it can. */
final class LoanEligibility
{
    /** @return list<string> */
    public function problems(LoanApplication $application): array
    {
        $application->loadMissing(['member', 'product.documents', 'documents', 'guarantors.member']);

        $member = $application->member;
        $product = $application->product;
        $problems = [];

        if ($product->status !== 'active') {
            $problems[] = 'This loan product is no longer open for applications.';
        }

        if ($member->status !== 'active') {
            $problems[] = 'Your membership is not active.';
        }

        if ($member->is_delinquent) {
            $problems[] = 'Your account has an overdue balance. Settle it with the cooperative first.';
        }

        if ($product->min_membership_months > 0) {
            if ($member->membership_date === null) {
                $problems[] = 'Your membership date is not on file. Ask the cooperative to update it.';
            } elseif ((int) floor($member->membership_date->diffInMonths(now())) < $product->min_membership_months) {
                $problems[] = "You need at least {$product->min_membership_months} months of membership for this loan.";
            }
        }

        $amount = (float) $application->amount;

        if ($amount < (float) $product->min_amount || $amount > (float) $product->max_amount) {
            $problems[] = sprintf(
                'The amount must be between %s and %s.',
                number_format((float) $product->min_amount, 2),
                number_format((float) $product->max_amount, 2),
            );
        }

        if ($application->term_months < $product->term_min_months || $application->term_months > $product->term_max_months) {
            $problems[] = "The term must be between {$product->term_min_months} and {$product->term_max_months} months.";
        }

        if (trim((string) $application->purpose) === '') {
            $problems[] = 'Describe the purpose of the loan.';
        }

        if ($product->requires_collateral && (blank($application->collateral_description) || blank($application->collateral_value))) {
            $problems[] = 'Describe the collateral and its estimated value.';
        }

        if ($product->requires_guarantor && $application->guarantors->count() < $product->guarantor_count) {
            $problems[] = "Add {$product->guarantor_count} guarantor(s).";
        }

        $uploaded = $application->documents->keyBy('requirement');

        foreach ($product->documents->where('is_required', true) as $required) {
            $document = $uploaded->get($required->name);

            if ($document === null) {
                $problems[] = "Upload the required document: {$required->name}.";
            } elseif ($document->status === 'rejected') {
                $problems[] = "Replace the rejected document: {$required->name}.";
            }
        }

        if (LoanSetting::current()->signature_required && blank($application->signature_path)) {
            $problems[] = 'Sign the application.';
        }

        return $problems;
    }
}
