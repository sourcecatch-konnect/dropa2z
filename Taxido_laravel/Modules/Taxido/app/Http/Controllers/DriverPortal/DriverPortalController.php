<?php

namespace Modules\Taxido\Http\Controllers\DriverPortal;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use Modules\Taxido\Enums\RideStatusEnum;
use Modules\Taxido\Models\Driver;
use Modules\Taxido\Models\Ride;
use Modules\Taxido\Models\RideRequest;
use Modules\Taxido\Repositories\Api\DriverRepository;
use Modules\Taxido\Repositories\Api\RideRepository;
use Modules\Taxido\Repositories\Api\RideRequestRepository;

class DriverPortalController extends Controller
{
    public function __construct(
        private readonly DriverRepository $drivers,
        private readonly RideRequestRepository $rideRequests,
        private readonly RideRepository $rides,
    ) {
    }

    public function login()
    {
        if (Auth::check() && Auth::user()?->role?->name === 'driver') {
            return redirect()->route('driver.portal.dashboard');
        }

        return view('taxido::driver-portal.login');
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $driver = Driver::where('email', strtolower($credentials['email']))->first();

        if (! $driver || ! $driver->status || ! $driver->is_verified || ! Hash::check($credentials['password'], $driver->password)) {
            return back()
                ->withInput($request->only('email'))
                ->withErrors(['email' => 'These driver sign-in details are not valid.']);
        }

        Auth::login($driver);
        $request->session()->regenerate();

        return redirect()->intended(route('driver.portal.dashboard'));
    }

    public function dashboard()
    {
        $driver = $this->driver();
        $activeRide = Ride::with(['ride_status', 'rider', 'vehicle_type'])
            ->where('driver_id', $driver->id)
            ->whereHas('ride_status', fn ($query) => $query->whereIn('slug', [RideStatusEnum::ACCEPTED, RideStatusEnum::STARTED]))
            ->latest('updated_at')
            ->first();

        return view('taxido::driver-portal.dashboard', compact('driver', 'activeRide'));
    }

    public function availability(Request $request): JsonResponse
    {
        $data = $request->validate([
            'is_online' => ['required', 'boolean'],
            'location' => ['nullable', 'array'],
            'location.lat' => ['nullable', 'numeric', 'between:-90,90'],
            'location.lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        if ($data['is_online'] && (! isset($data['location']['lat'], $data['location']['lng']))) {
            throw ValidationException::withMessages([
                'location' => 'Location permission is required to go online.',
            ]);
        }

        $request->merge($data);
        $result = $this->drivers->updateLocation($request);

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function location(Request $request): JsonResponse
    {
        $data = $request->validate([
            'location' => ['required', 'array'],
            'location.lat' => ['required', 'numeric', 'between:-90,90'],
            'location.lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $request->merge(array_merge($data, ['is_online' => true]));
        $result = $this->drivers->updateLocation($request);

        return response()->json($result, ($result['success'] ?? false) ? 200 : 422);
    }

    public function currentRideRequest(Request $request)
    {
        return $this->rideRequests->syncCurrentRideRequest($request);
    }

    public function acceptRideRequest(Request $request)
    {
        $rideRequest = $this->responseableRideRequest($request);
        $request->merge(['ride_request_id' => $rideRequest->id]);

        return $this->rideRequests->accept($request);
    }

    public function rejectRideRequest(Request $request)
    {
        $rideRequest = $this->responseableRideRequest($request);
        $request->merge(['ride_request_id' => $rideRequest->id]);

        return $this->rideRequests->reject($request);
    }

    public function startRide(Request $request)
    {
        $data = $request->validate([
            'ride_id' => ['required', 'integer'],
            'otp' => ['required', 'string', 'max:12'],
            'start_ride_locations' => ['required', 'array', 'min:1'],
            'start_ride_coordinates' => ['required', 'array', 'min:1'],
        ]);

        $this->ownedRide($data['ride_id'], [RideStatusEnum::ACCEPTED]);
        $request->merge(array_merge($data, ['start_time' => now()->toDateTimeString()]));

        return $this->rides->startRide($request);
    }

    public function completeRide(Request $request)
    {
        $data = $request->validate(['ride_id' => ['required', 'integer']]);
        $ride = $this->ownedRide($data['ride_id'], [RideStatusEnum::STARTED]);

        return $this->rides->update(['status' => RideStatusEnum::COMPLETED], $ride->id);
    }

    public function logout(Request $request)
    {
        try {
            $request->merge(['is_online' => false]);
            $this->drivers->updateLocation($request);
        } catch (Exception) {
            // Logout must still succeed if a location update is temporarily unavailable.
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('driver.portal.login')->with('success', 'You have been signed out.');
    }

    private function driver(): Driver
    {
        return Driver::findOrFail(Auth::id());
    }

    private function responseableRideRequest(Request $request): RideRequest
    {
        $data = $request->validate(['ride_request_id' => ['required', 'integer']]);
        $driver = $this->driver();

        return RideRequest::whereKey($data['ride_request_id'])
            ->where('current_driver_id', $driver->id)
            ->where('driver_acceptance_expires_at', '>', now())
            ->whereHas('drivers', fn ($query) => $query->where('driver_id', $driver->id))
            ->firstOrFail();
    }

    private function ownedRide(int $rideId, array $allowedStatuses): Ride
    {
        $driver = $this->driver();

        return Ride::whereKey($rideId)
            ->where('driver_id', $driver->id)
            ->whereHas('ride_status', fn ($query) => $query->whereIn('slug', $allowedStatuses))
            ->firstOrFail();
    }
}
