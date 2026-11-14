<?php

namespace Modules\Taxido\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Notification;
use Modules\Taxido\Models\RideRequest;

class NewRideRequestNotification extends Notification implements ShouldBroadcastNow
{
    use Queueable;

    public function __construct(private readonly RideRequest $rideRequest)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $riderName = data_get($this->rideRequest->rider, 'name', 'A rider');

        return [
            'title' => 'New ride request',
            'message' => sprintf('%s requested ride #%s.', $riderName, $this->rideRequest->ride_number),
            'type' => 'ride_request',
            'ride_request_id' => $this->rideRequest->id,
            'url' => route('admin.ride-request.index'),
        ];
    }
}
