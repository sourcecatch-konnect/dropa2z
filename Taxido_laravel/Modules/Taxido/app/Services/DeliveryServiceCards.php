<?php

namespace Modules\Taxido\Services;

use Modules\Taxido\Models\VehicleType;
use Modules\Taxido\Models\VehicleTypeZone;

class DeliveryServiceCards
{
    public static function maxWeight(string $slug): ?int
    {
        return match ($slug) {'bike'=>20, 'auto-rickshaw'=>90, default=>null};
    }

    public static function catalog(?int $zoneId = null): array
    {
        $result=[];
        foreach (VehicleType::where('status',1)->whereIn('slug',['bike','auto-rickshaw'])->get() as $vehicle) {
            $rates=VehicleTypeZone::where('vehicle_type_id',$vehicle->id);
            if ($zoneId) $rates->where('zone_id',$zoneId);
            $rate=$rates->orderBy('per_distance_charge')->first();
            $result[$vehicle->slug==='bike'?'bike':'auto']=[
                'vehicle_id'=>$vehicle->id, 'per_km'=>$rate?(float)$rate->per_distance_charge:null,
                'base_fare'=>$rate?(float)$rate->base_fare_charge:null,
                'base_distance'=>$rate?(float)$rate->base_distance:null,
                'max_weight_kg'=>self::maxWeight($vehicle->slug),
                'timing'=>'ETA after route selection',
            ];
        }
        return $result;
    }
}
