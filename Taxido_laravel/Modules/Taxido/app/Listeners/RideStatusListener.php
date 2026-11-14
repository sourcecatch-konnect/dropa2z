<?php

namespace Modules\Taxido\Listeners;

use Exception;
use App\Enums\RoleEnum;
use Illuminate\Support\Facades\Log;
use Modules\Taxido\Events\RideStatusEvent;
use Modules\Taxido\Notifications\RideOtpNotification;
use Modules\Taxido\Services\NotificationService;

class RideStatusListener
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the event.
     */
    public function handle(RideStatusEvent $event): void
    {
        try {
            $ride = $event->ride;
            $rideStatusSlug = $ride?->ride_status?->slug;

            // Use relationship to get the Model instead of conflicting attribute
            $rider = $ride->rider_id ? \Modules\Taxido\Models\Rider::find($ride->rider_id) : null;
            $driver = $ride->driver;

            $placeholders = [
                'ride_number' => $ride->ride_number,
                'status' => strtoupper($rideStatusSlug),
                'driver_name' => $driver ? ($driver->name ?? 'N/A') : 'N/A',
                'rider_name' => $rider ? ($rider->name ?? 'User') : 'N/A',
            ];

            // Completion emails to either side include the same safe trip summary.
            if ($rideStatusSlug === 'completed') {
                $locations = is_array($ride->locations) ? $ride->locations : [];
                $placeholders = array_merge($placeholders, [
                    'pickup_location' => data_get($locations, '0', ''),
                    'dropoff_location' => data_get($locations, '1', ''),
                    'total_fare' => $ride->total !== null
                        ? ($ride->currency_symbol ?? '') . number_format((float) $ride->total, 2)
                        : '',
                    'payment_method' => $ride->payment_method
                        ? ucfirst(str_replace('_', ' ', (string) $ride->payment_method))
                        : '',
                    'payment_status' => $ride->payment_status
                        ? ucfirst(strtolower((string) $ride->payment_status))
                        : '',
                ]);
            }

            // Notify Driver
            if ($driver) {
                $this->notificationService->send(
                    $driver,
                    "ride-status-driver-{$rideStatusSlug}",
                    $placeholders,
                    ['type' => 'ride_status', 'ride_id' => (string) $ride->id]
                );
            }

            // Notify Rider
            if ($rider) {
                $channels = $rideStatusSlug === 'accepted'
                    ? ['push']
                    : ['push', 'sms', 'email'];

                $this->notificationService->send(
                    $rider,
                    "ride-status-rider-{$rideStatusSlug}",
                    $placeholders,
                    ['type' => 'ride_status', 'ride_id' => (string)$ride->id, 'ride_number' => (string)$ride->ride_number, 'status' => (string)$rideStatusSlug],
                    $channels
                );

                if ($rideStatusSlug === 'accepted' && $ride->otp && $rider->email) {
                    try {
                        $rider->notify(new RideOtpNotification($ride));
                    } catch (Exception $mailException) {
                        Log::error(
                            'Ride OTP email failed for ride ' . $ride->id . ': ' . $mailException->getMessage()
                        );
                    }
                }
            }

        } catch (Exception $e) {
            Log::error('RideStatusListener: ' . $e->getMessage());
        }
    }
}
