<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Objects\Polygon;
use Modules\Taxido\Models\Zone;
use Modules\Taxido\Models\VehicleTypeZone;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('zones', 'is_india_local_default')) {
            Schema::table('zones', fn(Blueprint $table) => $table->boolean('is_india_local_default')->default(false));
        }
        DB::transaction(function () {
            if (Zone::where('is_india_local_default', true)->exists()) return;
            $vehicleIds = DB::table('vehicle_types')->whereNull('deleted_at')->where('status', 1)
                ->whereIn('slug', ['bike', 'auto', 'auto-rickshaw'])->pluck('id');
            $sourceRates = VehicleTypeZone::whereIn('vehicle_type_id', $vehicleIds)->orderBy('zone_id')->get();
            $source = Zone::where('status', 1)->whereIn('id', $sourceRates->pluck('zone_id'))->first();
            if (!$source) throw new RuntimeException('An active Bike/Auto rate zone is required before enabling India coverage.');
            $locations = [['lat'=>6, 'lng'=>68], ['lat'=>6, 'lng'=>98], ['lat'=>38, 'lng'=>98], ['lat'=>38, 'lng'=>68], ['lat'=>6, 'lng'=>68]];
            $zone = $source->replicate();
            $zone->name = ['en' => 'India Local Deliveries'];
            $zone->locations = $locations;
            $zone->place_points = new Polygon([new LineString(array_map(fn($p) => new Point($p['lat'], $p['lng']), $locations))]);
            $zone->is_india_local_default = true;
            // Enable in Admin after deploying the country/same-city guards.
            $zone->status = 0;
            $zone->save();
            foreach ($sourceRates->where('zone_id', $source->id) as $rate) {
                $newRate = $rate->replicate();
                $newRate->zone_id = $zone->id;
                $newRate->save();
                foreach ($rate->preferences as $preference) {
                    $newRate->preferences()->attach($preference->id, ['price' => $preference->pivot->price]);
                }
            }
        });
    }

    public function down(): void
    {
        // Preserve zones/rates referenced by deliveries; disable coverage in Admin if required.
        Zone::where('is_india_local_default', true)->update(['status' => 0]);
    }
};
