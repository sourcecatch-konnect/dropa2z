<?php

namespace Modules\Taxido\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class IndiaLocalDeliveryPolicy
{
    public function identify($lat, $lng): array
    {
        if (!is_numeric($lat) || !is_numeric($lng) || $lat < 6 || $lat > 38 || $lng < 68 || $lng > 98) {
            throw new \RuntimeException('Choose a location in India.', 422);
        }
        // Bounds are a cheap prefilter, not a country boundary. Google country
        // components below distinguish India from neighbouring countries.
        // v2 prevents stale cached location records from the former same-city policy.
        $key = 'dropa2z-india-local-v2:'.number_format((float)$lat, 5, '.', '').','.number_format((float)$lng, 5, '.', '');
        return Cache::remember($key, now()->addDays(7), function () use ($lat, $lng) {
            $apiKey = config('services.google.geocoding_key');
            if (!$apiKey) throw new \RuntimeException('Location verification is unavailable. Please try again later.', 503);
            $response = Http::timeout(8)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'latlng' => $lat.','.$lng, 'key' => $apiKey, 'language' => 'en',
            ]);
            $data = $response->json();
            if (!$response->successful() || ($data['status'] ?? '') !== 'OK') {
                throw new \RuntimeException('Could not verify this location. Please select a nearby address and try again.', 422);
            }
            return self::cityInfo($data['results'] ?? []);
        });
    }

    public static function cityInfo(array $results): array
    {
        $components = [];
        foreach ($results as $result) {
            foreach ($result['address_components'] ?? [] as $component) {
                foreach ($component['types'] ?? [] as $type) {
                    $components[$type] ??= $component;
                }
            }
        }
        $country = strtoupper($components['country']['short_name'] ?? '');
        $city = $components['locality']['long_name'] ?? $components['postal_town']['long_name'] ?? null;
        $state = $components['administrative_area_level_1']['short_name'] ?? '';
        $normalize = fn ($value) => mb_strtolower(trim(preg_replace('/\s+/', ' ', (string)$value)));
        $cityKey = $normalize($city);
        $cityKey = ['new delhi' => 'delhi', 'bangalore' => 'bengaluru', 'bombay' => 'mumbai', 'madras' => 'chennai', 'calcutta' => 'kolkata'][$cityKey] ?? $cityKey;
        return ['country' => $country, 'state' => $normalize($state), 'city' => $city, 'city_key' => $cityKey ? $normalize($state).':'.$cityKey : null];
    }

    public function assertIndianPoint($lat, $lng): void
    {
        if ($this->identify($lat, $lng)['country'] !== 'IN') {
            throw new \RuntimeException('Dropa2z currently accepts locations in India only.', 422);
        }
    }

    public function assertLocalRoute($locations): void
    {
        if (is_string($locations)) $locations = json_decode($locations, true);
        if (!is_array($locations) || count($locations) < 2) {
            throw new \RuntimeException('Choose a pickup and delivery destination.', 422);
        }
        foreach ($locations as $point) {
            $lat = $point['lat'] ?? $point['latitude'] ?? null;
            $lng = $point['lng'] ?? $point['longitude'] ?? null;
            $place = $this->identify($lat, $lng);
            if ($place['country'] !== 'IN') throw new \RuntimeException('Pickup and every drop must be in India.', 422);
        }
    }
}
