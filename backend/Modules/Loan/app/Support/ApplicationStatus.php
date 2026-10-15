<?php

declare(strict_types=1);

namespace Modules\Loan\Support;

/**
 * Application stages. Later stages (evaluation, approval, release) are added when those screens are built;
 * this release covers submission and document review.
 */
final class ApplicationStatus
{
    public const DRAFT = 'draft';
    public const SUBMITTED = 'submitted';
    public const DOCUMENT_REVIEW = 'document_review';
    public const RETURNED = 'returned';
    public const FOR_EVALUATION = 'for_evaluation';
    public const REJECTED = 'rejected';
    public const CANCELLED = 'cancelled';

    public const ALL = [
        self::DRAFT, self::SUBMITTED, self::DOCUMENT_REVIEW, self::RETURNED,
        self::FOR_EVALUATION, self::REJECTED, self::CANCELLED,
    ];

    public const MEMBER_EDITABLE = [self::DRAFT, self::RETURNED];

    /**
     * Staff actions: where they may start, where they lead, and whether a reason is mandatory.
     *
     * @var array<string, array{from: list<string>, to: string, remarks: bool}>
     */
    public const ACTIONS = [
        'start_review' => ['from' => [self::SUBMITTED], 'to' => self::DOCUMENT_REVIEW, 'remarks' => false],
        'return' => ['from' => [self::DOCUMENT_REVIEW], 'to' => self::RETURNED, 'remarks' => true],
        'accept_documents' => ['from' => [self::DOCUMENT_REVIEW], 'to' => self::FOR_EVALUATION, 'remarks' => false],
        'reject' => ['from' => [self::SUBMITTED, self::DOCUMENT_REVIEW], 'to' => self::REJECTED, 'remarks' => true],
    ];
}
