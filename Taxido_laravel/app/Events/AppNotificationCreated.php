<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class AppNotificationCreated implements ShouldBroadcastNow
{
    public function __construct(public readonly int $userId, public readonly string $notificationId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.notifications.' . $this->userId)];
    }

    public function broadcastAs(): string { return 'notification.created'; }

    public function broadcastWith(): array
    {
        // Fetch content through the authenticated notification API.
        return ['notification_id' => $this->notificationId];
    }
}
