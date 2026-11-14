<?php

namespace Modules\Taxido\Notifications;

use Illuminate\Notifications\Notification;
use Modules\Taxido\Models\RideRequest;

class RiderRideStatusNotification extends Notification
{
    public function __construct(
        private readonly RideRequest $rideRequest,
        private readonly string $status,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $messages = [
            'requested' => ['Ride request placed', 'We are finding a driver for your ride.'],
            'accepted' => ['Ride accepted', 'A driver has accepted your ride request.'],
            'cancelled' => ['Ride cancelled', 'Your ride request has been cancelled.'],
        ];
        [$title, $message] = $messages[$this->status] ?? ['Ride update', 'Your ride status has changed.'];

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'ride',
            'ride_request_id' => $this->rideRequest->id,
            'ride_number' => $this->rideRequest->ride_number,
        ];
    }
}
