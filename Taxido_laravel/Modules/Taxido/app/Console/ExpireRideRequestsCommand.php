<?php

namespace Modules\Taxido\Console;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Taxido\Broadcasts\DriverRideRequestBroadcast;
use Modules\Taxido\Broadcasts\RideNoDriverFoundBroadcast;
use Modules\Taxido\Enums\RideStatusEnum;
use Modules\Taxido\Models\RideRequest;
use Modules\Taxido\Notifications\RiderRideStatusNotification;

class ExpireRideRequestsCommand extends Command
{
    protected $signature = 'taxido:expire-ride-requests';

    protected $description = 'Cancel ride requests that exceeded the configured driver search timeout';

    public function handle(): int
    {
        $settings = getTaxidoSettings();
        $timeoutMinutes = max(1, (int) ($settings['ride']['find_driver_time_limit'] ?? 3));
        $fallbackDeadline = now()->subMinutes($timeoutMinutes);

        RideRequest::query()
            ->where(function ($query) use ($fallbackDeadline) {
                $query->where('find_driver_expires_at', '<=', now())
                    ->orWhere(function ($legacy) use ($fallbackDeadline) {
                        $legacy->whereNull('find_driver_expires_at')
                            ->where('created_at', '<=', $fallbackDeadline);
                    });
            })
            ->whereDoesntHave('ride')
            ->whereHas('ride_status_activities', function ($query) {
                $query->whereIn('status', [RideStatusEnum::REQUESTED, RideStatusEnum::PENDING, RideStatusEnum::REJECTED])
                    ->whereRaw('ride_status_activities.id = (SELECT MAX(latest_activity.id) FROM ride_status_activities AS latest_activity WHERE latest_activity.ride_request_id = ride_requests.id)');
            })
            ->orderBy('id')
            ->chunkById(100, function ($candidates): void {
                foreach ($candidates as $candidate) {
                    $cancelled = DB::transaction(function () use ($candidate) {
                        $rideRequest = RideRequest::query()->whereKey($candidate->id)->lockForUpdate()->first();
                        if (! $rideRequest || $rideRequest->ride()->exists()) {
                            return null;
                        }

                        $latestStatus = $rideRequest->ride_status_activities()->latest('id')->value('status');
                        if (! in_array($latestStatus, [RideStatusEnum::REQUESTED, RideStatusEnum::PENDING, RideStatusEnum::REJECTED], true)) {
                            return null;
                        }

                        $driverIds = $rideRequest->drivers()->pluck('users.id')->map(fn ($id) => (int) $id)->all();
                        if ($rideRequest->current_driver_id) {
                            $driverIds[] = (int) $rideRequest->current_driver_id;
                        }

                        $rideRequest->ride_status_activities()->create([
                            'status' => RideStatusEnum::CANCELLED,
                            'changed_at' => now(),
                        ]);
                        $rideRequest->update([
                            'current_driver_id' => null,
                            'driver_acceptance_expires_at' => null,
                            'find_driver_expires_at' => null,
                        ]);

                        return [$rideRequest->fresh(), array_values(array_unique($driverIds))];
                    });

                    if (! $cancelled) {
                        continue;
                    }

                    [$rideRequest, $driverIds] = $cancelled;
                    try {
                        broadcast(new RideNoDriverFoundBroadcast($rideRequest));
                        $riderRecipient = \App\Models\User::query()->find($rideRequest->rider_id);
                        $riderRecipient?->notify(new RiderRideStatusNotification($rideRequest, 'cancelled'));
                        foreach ($driverIds as $driverId) {
                            event(new DriverRideRequestBroadcast($rideRequest, $driverId, 'cancelled'));
                        }
                    } catch (\Throwable $exception) {
                        Log::warning('ExpireRideRequestsCommand: cancellation notification failed', [
                            'ride_request_id' => $rideRequest->id,
                            'error' => $exception->getMessage(),
                        ]);
                    }

                    $this->info("Cancelled expired ride request #{$rideRequest->ride_number}.");
                }
            });

        return self::SUCCESS;
    }
}
