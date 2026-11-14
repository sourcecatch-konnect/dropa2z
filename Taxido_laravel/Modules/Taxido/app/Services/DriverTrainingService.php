<?php

namespace Modules\Taxido\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class DriverTrainingService
{
    public const ACTIONS = ['accept_request', 'pickup_arrived', 'pickup_pin_verified', 'drop_arrived', 'parcel_delivered', 'payment_recorded'];

    public static function advanceCount(int $completed, int $step, string $action): int
    {
        if ($step < 1 || $step > count(self::ACTIONS) || self::ACTIONS[$step - 1] !== $action) {
            throw new \DomainException('Complete the displayed practice action.');
        }
        if ($step > $completed + 1) throw new \DomainException('Complete the previous practice step first.');
        return max($completed, $step);
    }

    public static function status(int $driverId): array
    {
        if (!Schema::hasTable('driver_training_progress')) return ['required' => false, 'available' => false, 'pro_driver' => false];
        DB::table('driver_training_progress')->insertOrIgnore([
            'driver_id' => $driverId, 'version' => 1, 'is_required' => true, 'completed_steps' => 0,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $progress = DB::table('driver_training_progress')->where('driver_id', $driverId)->first();
        return [
            'available' => true, 'version' => 1, 'required' => (bool) $progress->is_required && !$progress->completed_at,
            'completed_steps' => (int) $progress->completed_steps, 'total_steps' => count(self::ACTIONS),
            'completed_at' => $progress->completed_at, 'pro_driver' => (bool) $progress->completed_at,
        ];
    }

    public static function assertCanGoOnline($driver): void
    {
        if (self::status((int) $driver->id)['required']) {
            throw new \Exception('Complete the Dropa2z practice delivery after document approval before going online.', 409);
        }
    }
}
