<?php

namespace Modules\Taxido\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Taxido\Broadcasts\DriverRideRequestBroadcast;
use Modules\Taxido\Broadcasts\RiderRideRequestCancelledBroadcast;
use Modules\Taxido\Enums\RideStatusEnum;
use Modules\Taxido\Jobs\CheckDriverTimeoutJob;
use Modules\Taxido\Models\Driver;
use Modules\Taxido\Models\RideRequest;
use Modules\Taxido\Notifications\RiderRideStatusNotification;

class RideRequestNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $requests = RideRequest::query()
            ->whereDoesntHave('ride')
            ->whereHas('ride_status_activities', function ($query) {
                $query->whereIn('status', [RideStatusEnum::REQUESTED, RideStatusEnum::PENDING])
                    ->whereRaw('ride_status_activities.id = (SELECT MAX(latest_activity.id) FROM ride_status_activities AS latest_activity WHERE latest_activity.ride_request_id = ride_requests.id)');
            })
            ->with(['service:id,name', 'service_category:id,name', 'vehicle_type:id,name'])
            ->latest('created_at')
            ->take(8)
            ->get([
                'id', 'ride_number', 'rider', 'locations', 'total', 'currency_symbol',
                'service_id', 'service_category_id', 'vehicle_type_id', 'created_at',
            ])
            ->map(function (RideRequest $request) {
                $rider = is_array($request->rider) ? $request->rider : [];
                $locations = is_array($request->locations) ? $request->locations : [];
                $routeLocations = array_values(array_filter(array_map(function ($location) {
                    if (is_array($location)) {
                        $location = $location['address']
                            ?? $location['location_name']
                            ?? $location['name']
                            ?? $location['formatted_address']
                            ?? null;
                    }

                    return is_string($location) && trim($location) !== ''
                        ? trim($location)
                        : null;
                }, $locations)));

                return [
                    'id' => $request->id,
                    'ride_number' => $request->ride_number,
                    'rider_name' => $rider['name'] ?? 'Rider',
                    'pickup' => $routeLocations[0] ?? 'Pickup location unavailable',
                    'destination' => count($routeLocations) > 1 ? end($routeLocations) : 'Destination unavailable',
                    'stops' => count($routeLocations) > 2 ? array_slice($routeLocations, 1, -1) : [],
                    'service' => $request->service?->name,
                    'category' => $request->service_category?->name,
                    'vehicle' => $request->vehicle_type?->name,
                    'total' => $request->currency_symbol . number_format((float) $request->total, 2),
                    'created_at' => $request->created_at?->toIso8601String(),
                    'details_url' => route('admin.ride-request.details', $request->id),
                    'drivers' => $request->drivers()
                        ->where('users.is_online', true)
                        ->where('users.is_on_ride', false)
                        ->where('users.is_verified', true)
                        ->where('users.status', true)
                        ->whereNull('users.deleted_at')
                        ->whereNotIn('users.id', $request->rejected_driver_ids ?? [])
                        ->with('vehicle_info')
                        ->get(['users.id', 'users.name'])
                        ->map(fn (Driver $driver) => [
                            'id' => $driver->id,
                            'name' => $driver->name,
                            'vehicle' => $driver->vehicle_info?->model,
                            'plate' => $driver->vehicle_info?->plate_number,
                        ])
                        ->values(),
                ];
            })
            ->values();

        return response()->json([
            'count' => $requests->count(),
            'requests' => $requests,
        ]);
    }

    public function assign(Request $request, int $rideRequestId): JsonResponse
    {
        $data = $request->validate(['driver_id' => ['required', 'integer']]);

        [$rideRequest, $driver, $previousDriverId, $deadline] = DB::transaction(function () use ($data, $rideRequestId) {
            $rideRequest = RideRequest::query()->lockForUpdate()->findOrFail($rideRequestId);
            $status = $rideRequest->ride_status_activities()->latest('changed_at')->value('status');
            if (!in_array($status, [RideStatusEnum::REQUESTED, RideStatusEnum::PENDING], true) || $rideRequest->ride()->exists()) {
                abort(409, 'This booking is no longer waiting for a driver.');
            }

            $driver = $rideRequest->drivers()
                ->where('users.id', $data['driver_id'])
                ->where('users.is_online', true)
                ->where('users.is_on_ride', false)
                ->where('users.is_verified', true)
                ->where('users.status', true)
                ->whereNull('users.deleted_at')
                ->first();

            $rejectedIds = array_map('intval', $rideRequest->rejected_driver_ids ?? []);
            if (!$driver || in_array((int) $driver->id, $rejectedIds, true)) {
                abort(422, 'Choose an eligible online driver who has not declined this booking.');
            }

            $previousDriverId = $rideRequest->current_driver_id;
            $acceptanceSeconds = max(15, (int) (getTaxidoSettings()['ride']['ride_request_time_driver'] ?? 30));
            $deadline = now()->addSeconds($acceptanceSeconds);
            $rideRequest->update([
                'current_driver_id' => $driver->id,
                'driver_acceptance_expires_at' => $deadline,
                'find_driver_expires_at' => null,
            ]);

            return [$rideRequest->fresh(), $driver, $previousDriverId, $deadline];
        });

        try {
            if ($previousDriverId && (int) $previousDriverId !== (int) $driver->id) {
                event(new DriverRideRequestBroadcast($rideRequest, (int) $previousDriverId, 'cancelled'));
            }
            event(new DriverRideRequestBroadcast($rideRequest, (int) $driver->id, 'request'));
        } catch (\Throwable $exception) {
            Log::warning('Admin assigned ride request but real-time dispatch failed.', [
                'ride_request_id' => $rideRequest->id,
                'driver_id' => $driver->id,
                'error' => $exception->getMessage(),
            ]);
        }

        CheckDriverTimeoutJob::dispatch((int) $rideRequest->id, (int) $driver->id)->delay($deadline);

        return response()->json([
            'success' => true,
            'message' => 'Booking sent to ' . $driver->name . ' in the Driver app.',
            'ride_request_id' => $rideRequest->id,
        ]);
    }

    public function decline(int $rideRequestId): JsonResponse
    {
        [$rideRequest, $driverIds] = DB::transaction(function () use ($rideRequestId) {
            $rideRequest = RideRequest::query()->lockForUpdate()->findOrFail($rideRequestId);
            $status = $rideRequest->ride_status_activities()->latest('changed_at')->value('status');
            if (!in_array($status, [RideStatusEnum::REQUESTED, RideStatusEnum::PENDING], true) || $rideRequest->ride()->exists()) {
                abort(409, 'This booking is no longer waiting for a driver.');
            }

            $driverIds = $rideRequest->drivers()->pluck('users.id')->map(fn ($id) => (int) $id)->all();
            $rideRequest->ride_status_activities()->create([
                'status' => RideStatusEnum::CANCELLED,
                'changed_at' => now(),
            ]);
            $rideRequest->update([
                'current_driver_id' => null,
                'driver_acceptance_expires_at' => null,
                'find_driver_expires_at' => null,
            ]);

            return [$rideRequest->fresh(), $driverIds];
        });

        foreach ($driverIds as $driverId) {
            try {
                event(new DriverRideRequestBroadcast($rideRequest, $driverId, 'cancelled'));
            } catch (\Throwable $exception) {
                Log::warning('Could not notify a driver that Admin declined a booking.', [
                    'ride_request_id' => $rideRequest->id,
                    'driver_id' => $driverId,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        try {
            event(new RiderRideRequestCancelledBroadcast($rideRequest));
        } catch (\Throwable $exception) {
            Log::warning('Could not send Admin decline to Rider app in real time.', [
                'ride_request_id' => $rideRequest->id,
                'rider_id' => $rideRequest->rider_id,
                'error' => $exception->getMessage(),
            ]);
        }

        try {
            User::find($rideRequest->rider_id)?->notify(new RiderRideStatusNotification($rideRequest, 'cancelled'));
        } catch (\Throwable $exception) {
            Log::warning('Could not notify rider that Admin declined a booking.', [
                'ride_request_id' => $rideRequest->id,
                'rider_id' => $rideRequest->rider_id,
                'error' => $exception->getMessage(),
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Booking declined.']);
    }
}
