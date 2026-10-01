<?php

declare(strict_types=1);

namespace Modules\IdentityAccess\Notifications;

use Modules\IdentityAccess\User;
use Illuminate\Notifications\Notification;

final class UserRolesUpdatedNotification extends Notification
{
    /** @param list<string> $roles */
    public function __construct(private readonly User $actor, private readonly array $roles) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Your roles were updated',
            'message' => "{$this->actor->name} updated your roles.",
            'roles' => $this->roles,
        ];
    }
}
