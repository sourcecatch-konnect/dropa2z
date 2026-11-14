<?php

namespace Modules\Taxido\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Taxido\Enums\RoleEnum;
use Modules\Taxido\Models\Driver;
use Modules\Taxido\Services\DriverTrainingService;

class DriverTrainingController extends Controller
{
    private function driver(): Driver
    {
        abort_unless(auth()->user()?->hasRole(RoleEnum::DRIVER), 403, 'Driver access required.');
        return Driver::findOrFail(auth()->id());
    }

    public function show(): array
    {
        $driver = $this->driver();
        return DriverTrainingService::status((int) $driver->id) + ['verified' => (bool) $driver->is_verified];
    }

    public function advance(Request $request): array
    {
        $driver = $this->driver();
        abort_unless($driver->is_verified, 403, 'Admin must approve your documents before training.');
        $validated = $request->validate(['step' => 'required|integer|min:1|max:6', 'action' => 'required|string|max:40']);
        DriverTrainingService::status((int) $driver->id);
        return DB::transaction(function () use ($driver, $validated) {
            $progress = DB::table('driver_training_progress')->where('driver_id', $driver->id)->lockForUpdate()->first();
            $step = (int) $validated['step'];
            try {
                $next = DriverTrainingService::advanceCount((int) $progress->completed_steps, $step, $validated['action']);
            } catch (\DomainException $exception) {
                abort(409, $exception->getMessage());
            }
            if ($next > $progress->completed_steps) {
                DB::table('driver_training_progress')->where('driver_id', $driver->id)->update([
                    'completed_steps' => $step, 'completed_at' => $step === count(DriverTrainingService::ACTIONS) ? now() : null,
                    'updated_at' => now(),
                ]);
            }
            return DriverTrainingService::status((int) $driver->id);
        });
    }
}
