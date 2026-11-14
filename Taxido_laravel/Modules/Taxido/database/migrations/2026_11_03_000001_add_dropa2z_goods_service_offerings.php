<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $offerings = [
            ['service' => 'parcel', 'vehicle' => ['bike'], 'slug' => 'ride-parcel-bike', 'name' => 'Bike Parcel', 'description' => 'Send a small packed item across Jalgaon.'],
            ['service' => 'parcel', 'vehicle' => ['auto-rickshaw', 'auto'], 'slug' => 'ride-parcel-auto', 'name' => 'Auto Parcel', 'description' => 'Send parcels or packed items that fit in an auto.'],
            ['service' => 'freight', 'vehicle' => ['bike'], 'slug' => 'ride-freight-bike', 'name' => 'Bike Freight', 'description' => 'Move compact shop stock, samples, or spare parts.'],
            ['service' => 'freight', 'vehicle' => ['auto-rickshaw', 'auto'], 'slug' => 'ride-freight-auto', 'name' => 'Auto Freight', 'description' => 'Move cartons or store supplies that fit in an auto.'],
        ];

        DB::transaction(function () use ($offerings) {
            foreach ($offerings as $offering) {
                $serviceId = DB::table('services')
                    ->where('type', $offering['service'])
                    ->whereNull('deleted_at')
                    ->value('id');
                // A fresh database may run migrations before its services are seeded.
                if (! $serviceId) {
                    continue;
                }

                $vehicleId = null;
                foreach ($offering['vehicle'] as $vehicleSlug) {
                    $vehicleId = DB::table('vehicle_types')
                        ->where('slug', $vehicleSlug)
                        ->where('status', 1)
                        ->whereNull('deleted_at')
                        ->value('id');
                    if ($vehicleId) {
                        break;
                    }
                }
                if (! $vehicleId) {
                    continue;
                }

                $categoryId = DB::table('service_categories')
                    ->where('service_id', $serviceId)
                    ->where('slug', $offering['slug'])
                    ->whereNull('deleted_at')
                    ->value('id');
                if (! $categoryId) {
                    $categoryId = DB::table('service_categories')->insertGetId([
                        'name' => json_encode(['en' => $offering['name']]),
                        'description' => json_encode(['en' => $offering['description']]),
                        'slug' => $offering['slug'],
                        'type' => 'ride',
                        'service_id' => $serviceId,
                        'status' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                foreach ([
                    ['table' => 'vehicle_services', 'fields' => ['vehicle_type_id' => $vehicleId, 'service_id' => $serviceId]],
                    ['table' => 'vehicle_categories', 'fields' => ['vehicle_type_id' => $vehicleId, 'service_category_id' => $categoryId]],
                    ['table' => 'categories_services', 'fields' => ['service_category_id' => $categoryId, 'service_id' => $serviceId]],
                ] as $link) {
                    if (! DB::table($link['table'])->where($link['fields'])->exists()) {
                        DB::table($link['table'])->insert($link['fields']);
                    }
                }
            }
        });
    }

    public function down(): void
    {
        // Keep service categories referenced by historical bookings.
    }
};
