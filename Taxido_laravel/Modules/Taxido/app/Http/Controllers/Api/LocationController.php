<?php

namespace Modules\Taxido\Http\Controllers\Api;

use Exception;
use App\Enums\RoleEnum;
use Illuminate\Http\Request;
use Modules\Taxido\Models\Location;
use App\Exceptions\ExceptionHandler;
use App\Http\Controllers\Controller;
use Modules\Taxido\Repositories\Api\LocationRepository;

class LocationController extends Controller
{
    public $repository;

    public function  __construct(LocationRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {

            $locations = $this->filter($this->repository, $request);
            return $locations->latest()->paginate($request->paginate ?? $locations->count() ?: null);

        } catch (Exception $e) {

            throw new ExceptionHandler($e->getMessage(), $e->getCode());
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->validateLocation($request);
        return $this->repository->store($request);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function show(Location $location)
    {
        $this->authorizeLocation($location);
        return $location;
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Location $location)
    {
        $this->authorizeLocation($location);
        return $this->repository->update($this->validateLocation($request), $location?->id);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Location $location)
    {
        $this->authorizeLocation($location);
        return $this->repository->destroy($location?->id);
    }

    private function authorizeLocation(Location $location): void
    {
        abort_unless(getCurrentRoleName() === RoleEnum::ADMIN ||
            (int) $location->rider_id === (int) getCurrentUserId(), 403);
    }

    private function validateLocation(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:2000',
            'type' => 'required|string|max:50',
            'location_coordinates' => 'required|array',
            'location_coordinates.lat' => 'required|numeric|between:-90,90',
            'location_coordinates.lng' => 'required|numeric|between:-180,180',
        ]);
    }

    public function filter($locations)
    {
        $roleName = getCurrentRoleName();
        if ($roleName != RoleEnum::ADMIN) {
            $locations = $locations->where('rider_id', getCurrentUserId());
        }

        return $locations;
    }
}
