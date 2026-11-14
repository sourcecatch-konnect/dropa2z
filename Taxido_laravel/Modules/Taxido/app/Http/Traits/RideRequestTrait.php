<?php

namespace Modules\Taxido\Http\Traits;

use Carbon\Carbon;
use Exception;
use App\Exceptions\ExceptionHandler;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Taxido\Broadcasts\DriverRideRequestBroadcast;
use Modules\Taxido\Enums\RideStatusEnum;
use Modules\Taxido\Enums\RoleEnum;
use Modules\Taxido\Enums\RoleEnum as EnumsRoleEnum;
use Modules\Taxido\Enums\ServiceCategoryEnum;
use Modules\Taxido\Enums\ServicesEnum;
use Modules\Taxido\Events\RideRequestEvent;
use Modules\Taxido\Http\Resources\Drivers\RideRequestResource;
use Modules\Taxido\Jobs\AssignNextDriverJob;
use Modules\Taxido\Models\Driver;
use Modules\Taxido\Models\Ride;
use Modules\Taxido\Models\Rider;
use Modules\Taxido\Models\RideRequest;
use Modules\Taxido\Models\VehicleType;
use Modules\Taxido\Models\VehicleTypeZone;
use Illuminate\Http\Request;
use Modules\Taxido\Notifications\RideRequestNotification;
use Modules\Taxido\Notifications\RiderRideStatusNotification;

trait RideRequestTrait
{
    use BiddingTrait, RideTrait;

    public function verifyRideWalletBalance($rider_id, $paymentMethod = 'cash', $amount = 0)
    {
        // Previous wallet debt should not block cash or online bookings.
        if (strtolower(trim((string) $paymentMethod)) !== 'wallet') {
            return true;
        }

        $roleName = getCurrentRoleName();
        if ($roleName == EnumsRoleEnum::RIDER) {
            $rider_id = $rider_id ?? getCurrentUserId();
        }
        $rider = Rider::findOrFail($rider_id);
        $walletBalance = (float) ($rider?->wallet?->balance ?? 0);
        if ($walletBalance < (float) $amount) {
            throw new Exception(__('taxido::static.wallets.wallet_balance_not_sufficient'), 400);
        }

        return true;
    }

    public function getNoOfDaysAttribute($start_date, $end_date)
    {
        if ($start_date && $end_date) {
            return Carbon::parse($start_date)->diffInDays(Carbon::parse($end_date));
        }

        return 0;
    }

    public function verifyVehicleType($request)
    {
        $vehicleType = VehicleType::where('id', $request->vehicle_type_id)->where('status', 1)->first();
        if (! $vehicleType) {
            throw new Exception('This delivery vehicle is unavailable.', 422);
        }
        $service = getServiceById($request->service_id);
        $category = getServiceCategoryById($request->service_category_id);
        if (! $service || ! $service->status || ! $category || ! $category->status ||
            (int) $category->service_id !== (int) $service->id) {
            throw new Exception('This delivery service is unavailable.', 422);
        }
        $supportsService = (int) $vehicleType->service_id === (int) $request->service_id ||
            $vehicleType->services()->where('services.id', $request->service_id)->exists();
        if (! $supportsService) {
            throw new Exception(__('taxido::static.rides.service_not_allow_for_vehicle', ['vehicleType' => $vehicleType?->name]), 400);
        }
        $allowed = $vehicleType?->service_categories?->pluck('id')?->toArray();
        if (! in_array($request?->service_category_id, $allowed ?? [])) {
            throw new Exception(__('taxido::static.rides.category_not_allow_for_vehicle', ['vehicleType' => $vehicleType?->name]), 400);
        }

        return true;
    }

    public function getZoneRideDistance($locations)
    {
        $origin = head($locations);
        $zone = getZoneByPoint($origin['lat'], $origin['lng'])?->first();
        $rideDistance = calculateRideDistance($locations, $zone?->distance_type) ?? null;
        if ($zone && $rideDistance) {
            return (object) ['zone' => $zone, 'ride_distance' => $rideDistance];
        }

        return null;
    }

    public function findIdleDrivers($rideRequest)
    {
        try {

            $drivers = [];
            if (count($rideRequest->location_coordinates ?? [])) {
                if (! in_array($rideRequest?->service_category?->type, [ServiceCategoryEnum::RENTAL, ServiceCategoryEnum::SCHEDULE])) {
                    $coordinate = head($rideRequest->location_coordinates);
                    $zones = getDriverZoneByPoint($coordinate['lat'], $coordinate['lng'])?->pluck('id')?->toArray();
                    if (! count($zones)) {
                        throw new Exception(__('taxido::static.rides.ride_requests_not_accepted'), 400);
                    }
                    $rideRequest?->zones()?->attach($zones);

                    $vehicleTypeId = $rideRequest->vehicle_type_id;
                    $driverIds = Driver::whereNull('deleted_at')->where('is_verified', true)->where('status', true);
                    if (\Illuminate\Support\Facades\Schema::hasTable('driver_training_progress')) {
                        $driverIds->whereNotIn('id', \Illuminate\Support\Facades\DB::table('driver_training_progress')
                            ->where('is_required', true)->whereNull('completed_at')->select('driver_id'));
                    }
                    // Parcel and Freight share the same verified Bike/Auto pool.
                    // The selected vehicle has already been checked against the
                    // service/category, so an old cab service_id must not hide it.
                    if (! in_array($rideRequest->service?->type, [ServicesEnum::PARCEL, ServicesEnum::FREIGHT], true)) {
                        $driverIds->where('service_id', $rideRequest->service_id);
                    }
                    $driverIds = $driverIds->whereHas('vehicle_info', function (Builder $vehicleInfo) use ($vehicleTypeId) {
                        $vehicleInfo->where('vehicle_type_id', $vehicleTypeId);
                    });

                    if (! $rideRequest->preferences?->isEmpty()) {
                        $preferenceIds = $rideRequest->preferences()->pluck('preference_id')->toArray();
                        $driverIds = $driverIds->whereRelation('preferences', function ($driver) use ($preferenceIds) {
                            $driver->WhereIn('preference_id', $preferenceIds);
                        });
                    }

                    $taxidoSettings = getTaxidoSettings();
                    $minWalletBalance = \Modules\Taxido\Services\DriverWalletPolicy::minimumRequired($taxidoSettings);
                    $driverIds = $driverIds->whereHas('wallet', function (Builder $wallet) use ($minWalletBalance) {
                        if ($minWalletBalance !== null) {
                            $wallet->where('balance', '>=', $minWalletBalance);
                        }
                    });

                    if (in_array(getServiceCategoryTyeById($rideRequest->service_category_id), [ServiceCategoryEnum::RENTAL, ServiceCategoryEnum::PACKAGE, ServiceCategoryEnum::OUTSTATION, ServiceCategoryEnum::DAILY, ServiceCategoryEnum::ONEWAY, ServiceCategoryEnum::ROUNDTRIP])) {
                        $driverIds = $driverIds?->where('service_category_id', $rideRequest->service_category_id);
                    }

                    $driverIds = $driverIds?->pluck('id')?->toArray() ?? [];
                    $drivers = null;

                    $drivers = $this->findNearestDrivers($coordinate['lat'], $coordinate['lng'], $driverIds);
                    $isBidding = (bool) (int) ($taxidoSettings['activation']['bidding'] ?? 0);
                    if (! count($drivers) && $isBidding) {
                        throw new Exception(__('taxido::static.rides.no_driver_available'), 400);
                    }

                    if (count($drivers)) {
                        $rideRequest?->drivers()?->attach($drivers);
                    }
                }
            }
            return $drivers ?? [];

        } catch (Exception $e) {
            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    public function getSyncCurrentRideData(int $driverId, $request)
    {
        $rideRequest = null;
        $activeStatuses = [RideStatusEnum::REQUESTED, RideStatusEnum::PENDING];
        $taxidoAppSettings = getTaxidoSettings();
        if($taxidoAppSettings['activation']['bidding']) {

            $biddingRideRequests = RideRequest::where('ride_type', 'bidding')
            ->whereHas('drivers', function ($q) use ($driverId) {
                $q->where('driver_id', $driverId);
            })
            ->whereDoesntHave('bids', function ($q) use ($driverId) {
                $q->where('driver_id', $driverId);
            })
            ->whereHas('ride_status_activities', function ($q) use ($activeStatuses) {
                $q->whereIn('status', $activeStatuses)->latest('changed_at')->limit(1);
            })
            ->get();

            $biddingData = $biddingRideRequests->map(function ($rideRequest) use ($request, $driverId) {
                $data              = (new RideRequestResource($rideRequest))->toArray($request);
                $data['type']      = 'request';
                $data['driver_id'] = $driverId;
                return $data;
            })->values()->toArray();

            $rideRequest  = $biddingData;

        } else {
            $instantRideRequest = RideRequest::where('ride_type', 'instant')
                ->where('current_driver_id', $driverId)
                ->where('driver_acceptance_expires_at', '>', now())
                ->whereHas('drivers', function ($q) use ($driverId) {
                    $q->where('driver_id', $driverId);
                })
                ->where(function ($q) use ($driverId) {
                    $q->whereNull('rejected_driver_ids')
                      ->orWhereRaw('JSON_CONTAINS(rejected_driver_ids, ?) = 0', [json_encode($driverId)]);
                })
                ->whereHas('ride_status_activities', function ($q) use ($activeStatuses) {
                    $q->whereIn('status', $activeStatuses)->latest('changed_at')->limit(1);
                })
                ->latest('created_at')
                ->first();

            if ($instantRideRequest) {
                $data                                 = (new RideRequestResource($instantRideRequest))->toArray($request);
                $data['type']                         = 'request';
                $data['driver_id']                    = $driverId;
                $data['driver_acceptance_expires_at'] = $instantRideRequest->driver_acceptance_expires_at?->toISOString();
                $rideRequest                          = $data;
            }
        }

        return response()->json($rideRequest ?? []);
    }

    public function createCabRideRequest($request)
    {
        try {

            $serviceCategory = getServiceCategoryById($request->service_category_id);
            $service = getServiceById($request->service_id);
            if (in_array($service?->type, [ServicesEnum::PARCEL, ServicesEnum::FREIGHT], true)) {
                app(\Modules\Taxido\Services\IndiaLocalDeliveryPolicy::class)->assertLocalRoute($request->location_coordinates);
            }
            if ($serviceCategory?->type == ServiceCategoryEnum::SCHEDULE && $request->start_time) {
                $hours = (int) (getTaxidoSettings()['ride']['schedule_min_hour_limit'] ?? 0);
                if ($hours > 0 && Carbon::parse($request->start_time)->lte(now()->addHours($hours))) {
                    throw new Exception("Scheduled rides must be at least {$hours} hours from now.", 422);
                }
            }

            if ($this->verifyVehicleType($request)) {
                $zoneRideDistance = $this->getZoneRideDistance($request->location_coordinates);
                if (! $zoneRideDistance) {
                    throw new Exception('Ride distance not calculate, please try again.', 422);
                }

                $peakZone = null;
                if ($service != ServicesEnum::FINDDRIVER) {
                    $peakZone = $this->getPeakZones($request->location_coordinates);
                    if ($peakZone) {
                        $peakZone->refresh();
                        if (! $peakZone->isActiveNow()) {
                            $peakZone = null;
                        }
                    }
                }

                DB::beginTransaction();
                try {

                    $vehicleTypeZone = VehicleTypeZone::where('vehicle_type_id', $request->vehicle_type_id)
                        ->where('zone_id', $zoneRideDistance?->zone?->id)
                        ->first();

                    $isPeakZone = $peakZone?->zone_id == $zoneRideDistance?->zone?->id;
                    if ($serviceCategory?->type == ServiceCategoryEnum::PACKAGE && $request->hourly_package_id) {
                        $charges = $this->calHourlyPackageVehicleTypePrice($request->hourly_package_id, $request->vehicle_type_id, $zoneRideDistance?->zone?->id);
                    } else {
                        $charges = $this->calVehicleTypeZonePrice($zoneRideDistance?->ride_distance, $vehicleTypeZone, $request);
                        if ($isPeakZone) {
                            $peakZoneCharge = (($zoneRideDistance?->zone?->peak_price_increase_percentage ?? 0) * $charges['base_fare_charge']) / 100;
                            $charges['base_fare_charge'] += $peakZoneCharge;
                            $charges['peak_zone_charge'] = $peakZoneCharge;
                        } else {
                            $charges['peak_zone_charge'] = 0;
                        }
                    }

                    $total = $charges['total'];
                    if ((int) getTaxidoSettings()['activation']['bidding'] && (int) $request->ride_fare >= $total) {
                        $total = $request->ride_fare;
                    }

                    $roleName = getCurrentRoleName();
                    $authenticatedRider = getCurrentRider();
                    $rider = $request->new_rider ?? $authenticatedRider;
                    $rider_id = $authenticatedRider?->id ?? $request->rider_id ?? ($rider instanceof Rider ? $rider->id : null);
                    if ($roleName != RoleEnum::RIDER && $roleName != RoleEnum::DRIVER) {
                        $rider = Rider::where('id', $request->rider_id)?->whereNull('deleted_at')->first();
                        $rider_id = $rider?->id;
                    }

                    if (!$rider) {
                        throw new Exception('Rider not found!', 404);
                    }

                    $this->verifyRideWalletBalance($rider_id, $request->payment_method ?? 'cash', $total);
                        $taxidoSettings = getTaxidoSettings();
                        $isBiddingEnabled = (bool) (int) ($taxidoSettings['activation']['bidding'] ?? 0);
                        $findDriverLimit = max(1, (int) ($taxidoSettings['ride']['find_driver_time_limit'] ?? 3));
                        $rideRequest = RideRequest::create([
                            'ride_number' => 100000 + ((RideRequest::max('id') + 1) + Ride::max('id') + 1),
                            'rider_id' => $rider_id,
                            'payment_method' => $request->payment_method ?? 'cash',
                            'vehicle_type_id' => $request->vehicle_type_id,
                            'service_id' => $request->service_id,
                            'service_category_id' => $request->service_category_id,
                            'rider' => $rider,
                            'description' => $request->description,
                            'delivery_details' => $request->input('delivery_details'),
                            'duration' => $zoneRideDistance?->ride_distance['duration'] ?? $request?->duration,
                            'distance' => $zoneRideDistance?->ride_distance['distance_value'] ?? $request?->distance,
                            'distance_unit' => $zoneRideDistance?->ride_distance['distance_unit'] ?? $request?->distance_unit,
                            'ride_fare' => $charges['base_fare_charge'] ?? 0,
                            'additional_distance_charge' => $charges['additional_distance_charge'] ?? 0,
                            'additional_minute_charge' => $charges['additional_minute_charge'] ?? 0,
                            'additional_weight_charge' => $charges['additional_weight_charge'] ?? 0,
                            'tax' => $charges['tax'] ?? 0,
                            'commission' => $charges['commission'] ?? 0,
                            'driver_commission' => $charges['driver_commission'] ?? 0,
                            'platform_fee' => $charges['platform_fee'] ?? 0,
                            'preference_charge' => $charges['preference_charge'] ?? 0,
                            'sub_total' => $charges['sub_total'] ?? 0,
                            'total' => $total,
                            'locations' => $request->locations,
                            'currency_symbol' => $zoneRideDistance?->zone?->currency?->symbol,
                            'location_coordinates' => $request->location_coordinates,
                            'hourly_package_id' => $request->hourly_package_id,
                            'weight' => $request->weight,
                            'parcel_receiver' => $request->parcel_receiver,
                            'start_time' => $request->start_time,
                            'bid_extra_amount' => $total - $charges['total'],
                            'no_of_days' => $this->getNoOfDaysAttribute($request?->start_time, $request?->end_time),
                            'is_peak_zone' => $isPeakZone,
                            'peak_zone_id' => $peakZone?->id ?? null,
                            'peak_zone_charge' => $charges['peak_zone_charge'] ?? 0,
                            'driver_id' => $request->drivers ?? $request->driver_id,
                            'ride_type'=> $request->ride_type ?? ($isBiddingEnabled ? 'bidding' : 'instant'),
                            'find_driver_expires_at' => now()->addMinutes($findDriverLimit),
                        ]);

                        if ($request->hasFile('cargo_image')) {
                            $attachment = createAttachment();
                            $attachment_id = addMedia($attachment, $request->file('cargo_image'))?->id;
                            $rideRequest->cargo_image_id = $attachment_id;
                            $rideRequest->save();
                        }

                        if ($service?->type != ServicesEnum::FINDDRIVER) {
                            if ($request->preferences && is_array($request->preferences)) {
                                $rideRequest->preferences()->attach(array_filter($request->preferences));
                            }
                        }

                        if (!empty($request->preferences) && is_array($request->preferences)) {
                            $request->preferences()->sync($request->preferences ?? []);
                        }

                        DB::commit();

                        $rideRequest = $rideRequest->refresh();
                        $taxidoSettings   = getTaxidoSettings();
                        $isBidding        = (bool) (int) ($taxidoSettings['activation']['bidding'] ?? 0);
                        $isManualAssign   = $request->driver_assign === 'manual' && $request->driver;
                        $isFindDriver     = $service?->type === ServicesEnum::FINDDRIVER;
                        $drivers = [];

                        if ($isManualAssign) {
                            $drivers = [$request->driver];
                        } elseif ($isFindDriver && ($request->drivers || $request->driver_id)) {
                            $drivers = [$request->drivers ?? $request->driver_id];
                            $coordinate = head($rideRequest->location_coordinates);
                            $zones = getDriverZoneByPoint($coordinate['lat'], $coordinate['lng'])?->pluck('id')?->toArray();
                            if (! count($zones)) {
                                throw new Exception(__('taxido::static.rides.ride_requests_not_accepted'), 400);
                            }
                            $rideRequest?->zones()?->attach($zones);
                        } else {
                            $drivers = $this->findIdleDrivers($rideRequest);
                        }

                        $isScheduled = in_array($serviceCategory?->type, [
                            ServiceCategoryEnum::SCHEDULE,
                            ServiceCategoryEnum::OUTSTATION,
                            ServiceCategoryEnum::DAILY,
                            ServiceCategoryEnum::ONEWAY,
                            ServiceCategoryEnum::ROUNDTRIP,
                        ]) && $request->start_time && Carbon::parse($request->start_time)->gt(now());

                        $rideRequest->ride_status_activities()->create([
                            'status'     => $isScheduled ? RideStatusEnum::SCHEDULED : RideStatusEnum::REQUESTED,
                            'changed_at' => now(),
                        ]);

                        if (!empty($drivers)) {
                            if ($isBidding || $isManualAssign || $isFindDriver) {
                                foreach ($drivers as $driverId) {
                                    $driverModel = Driver::find((int) $driverId);
                                    if ($driverModel) {
                                        event(new DriverRideRequestBroadcast($rideRequest, (int) $driverId, 'request'));
                                        try {
                                            Log::info('Ride request notification', ['ride_request_id' => $rideRequest->id, 'driver_id' => $driverId]);
                                           
                                            $driverModel->notify(new RideRequestNotification($driverModel, $rideRequest));
                                        } catch (Exception $notifyEx) {
                                            Log::warning("RideRequestTrait: Bidding notification failed for driver #{$driverId}: " . $notifyEx->getMessage());
                                        }
                                    }
                                }
                            } else {

                                AssignNextDriverJob::dispatch($rideRequest->id);
                            }
                        }
   
                        Log::info('Ride request created', ['ride_request_id' => $rideRequest->id]);
                        // The passenger/contact snapshot can be an array. Always
                        // notify the persisted rider account, and do not fail an
                        // already-created ride request if notification storage fails.
                        try {
                            $notificationRider = Rider::find($rider_id);
                            $notificationRider?->notify(new RiderRideStatusNotification($rideRequest, 'requested'));
                        } catch (\Throwable $notifyEx) {
                            Log::warning('RideRequestTrait: rider request notification failed', [
                                'ride_request_id' => $rideRequest->id,
                                'rider_id' => $rider_id,
                                'error' => $notifyEx->getMessage(),
                            ]);
                        }
                        event(new RideRequestEvent($rideRequest));
                        $resource = new RideRequestResource($rideRequest);

                        return [
                            'id'      => $rideRequest->id,
                            'data'    => $resource,
                            'drivers' => $drivers,
                            'preferences' => $request->preferences,
                        ];
                } catch (Exception $e) {
                    DB::rollback();
                    throw new ExceptionHandler($e->getMessage(), $e->getCode());
                }
            }

            throw new Exception('Selected vehicle type not valid.', 404);

        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }
}
