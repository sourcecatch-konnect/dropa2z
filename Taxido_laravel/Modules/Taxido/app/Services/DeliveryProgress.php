<?php

namespace Modules\Taxido\Services;

use InvalidArgumentException;

/** Pure state transitions, shared by API writes and regression tests. */
final class DeliveryProgress
{
    public static function update(array $progress, int $count, int $index, string $action, int $driverId, string $now): array
    {
        if (! in_array($action, ['arrived', 'delivered'], true) || $index < 1 || $index > $count) {
            throw new InvalidArgumentException('This action or stop is not part of the booked itinerary.', 422);
        }
        $stops = $progress['stops'] ?? [];
        for ($i = 0; $i < $count; $i++) {
            $stops[$i] = $stops[$i] ?? ['stop_index' => $i + 1, 'status' => 'pending', 'arrived_at' => null, 'delivered_at' => null];
        }
        $progress['stops'] = array_values(array_slice($stops, 0, $count));
        for ($i = 0; $i < $index - 1; $i++) {
            if (($progress['stops'][$i]['status'] ?? 'pending') !== 'delivered') {
                throw new InvalidArgumentException('Complete the earlier parcel handoff first.', 409);
            }
        }
        $stop = $progress['stops'][$index - 1];
        if (($stop['status'] ?? 'pending') === 'delivered') {
            return $progress; // Repeated taps/retries must not rewrite proof or time.
        }
        if ($action === 'delivered' && empty($stop['arrived_at'])) {
            throw new InvalidArgumentException('Mark arrival at this drop before confirming parcel delivery.', 409);
        }
        $stop['arrived_at'] = $stop['arrived_at'] ?? $now;
        $stop['status'] = $action;
        if ($action === 'delivered') {
            $stop['delivered_at'] = $now;
            $stop['confirmed_by_driver_id'] = $driverId;
        }
        $progress['stops'][$index - 1] = $stop;
        return $progress;
    }
}
