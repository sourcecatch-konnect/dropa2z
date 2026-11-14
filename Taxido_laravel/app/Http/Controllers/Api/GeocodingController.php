<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeocodingController extends Controller
{
    public function reverse(Request $request): JsonResponse
    {
        $coordinates = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $key = config('services.google.geocoding_key');
        if (! $key) {
            return response()->json([
                'status' => 'CONFIGURATION_ERROR',
                'message' => 'Server geocoding is not configured.',
            ], 503);
        }

        $response = Http::timeout(10)->get('https://maps.googleapis.com/maps/api/geocode/json', [
            'latlng' => $coordinates['lat'].','.$coordinates['lng'],
            'key' => $key,
        ]);

        return response()->json($response->json(), $response->status());
    }
}
