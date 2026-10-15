<?php

declare(strict_types=1);

namespace Modules\Election\Enums;

enum AssemblyStatus: string
{
    case Draft = 'draft';
    case Registration = 'registration';
    case Voting = 'voting';
    case Closed = 'closed';

    public function canTransitionTo(self $to): bool
    {
        $allowed = match ($this) {
            self::Draft => [self::Registration],
            self::Registration => [self::Draft, self::Voting],
            self::Voting => [self::Registration, self::Closed],
            self::Closed => [],
        };

        return in_array($to, $allowed, true);
    }

    /** Positions, candidates and amendments can only change before voting. */
    public function allowsSetupChanges(): bool
    {
        return in_array($this, [self::Draft, self::Registration], true);
    }

    public function allowsRegistration(): bool
    {
        return in_array($this, [self::Registration, self::Voting], true);
    }

    public function allowsVoting(): bool
    {
        return $this === self::Voting;
    }

    public function isOpen(): bool
    {
        return in_array($this, [self::Registration, self::Voting], true);
    }
}
