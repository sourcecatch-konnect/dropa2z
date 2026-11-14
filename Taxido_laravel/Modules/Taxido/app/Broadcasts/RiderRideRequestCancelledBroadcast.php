<?php

namespace Modules\Taxido\Broadcasts;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Queue\SerializesModels;
use Modules\Taxido\Models\RideRequest;

class RiderRideRequestCancelledBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly RideRequest $rideRequest) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('rider.' . $this->rideRequest->rider_id)];
    }

    public function broadcastAs(): string
    {
        return 'ride.request.cancelled';
    }

    public function broadcastWith(): array
    {
        return [
            'ride_request_id' => $this->rideRequest->id,
            'ride_number' => $this->rideRequest->ride_number,
            'status' => 'cancelled',
            'message' => 'Your booking was declined by Admin.',
        ];
    }
}
