<?php

namespace Modules\Taxido\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Modules\Taxido\Models\Ride;
use Modules\Taxido\Tables\RideTable;
use App\Http\Controllers\Controller;
use Modules\Taxido\Repositories\Admin\RideRepository;

class RideController extends Controller
{
    private $repository;

    public function __construct(RideRepository $repository)
    {
        $this->authorizeResource(Ride::class, 'ride');
        $this->repository = $repository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(RideTable $rideTable)
    {
        return $this->repository->index($rideTable->generate());
    }

    public function getRidesByStatus(RideTable $rideTable)
    {
        return $this->repository->index($rideTable->generate());
    }

    public function details(Request $request)
    {
        return $this->repository->details($request->ride_number);
    }

    public function cancel(Request $request, Ride $ride)
    {
        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ]);

        $this->repository->cancel($ride->id, $validated['cancellation_reason']);

        return redirect()
            ->route('admin.ride.details', ['ride_number' => $ride->id])
            ->with('success', 'Ride cancelled successfully.');
    }

    public function export(Request $request)
    {
        return $this->repository->export($request);
    }
}
