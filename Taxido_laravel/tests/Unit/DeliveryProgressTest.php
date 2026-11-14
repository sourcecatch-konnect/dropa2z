<?php

namespace Tests\Unit;

use InvalidArgumentException;
use Modules\Taxido\Services\DeliveryProgress;
use PHPUnit\Framework\TestCase;

class DeliveryProgressTest extends TestCase
{
    public function test_arrival_does_not_confirm_handoff(): void
    {
        $progress = DeliveryProgress::update([], 2, 1, 'arrived', 9, '2026-11-06T10:00:00Z');
        $this->assertSame('arrived', $progress['stops'][0]['status']);
        $this->assertNull($progress['stops'][0]['delivered_at']);
        $this->assertSame('pending', $progress['stops'][1]['status']);
    }

    public function test_delivery_requires_arrival(): void
    {
        $this->expectException(InvalidArgumentException::class);
        DeliveryProgress::update([], 1, 1, 'delivered', 9, 'now');
    }

    public function test_cannot_skip_an_earlier_stop(): void
    {
        $this->expectException(InvalidArgumentException::class);
        DeliveryProgress::update([], 2, 2, 'arrived', 9, 'now');
    }

    public function test_retries_preserve_original_handoff_and_confirmation(): void
    {
        $progress = ['pickup_vehicle_confirmed_at' => 'confirmed'];
        $progress = DeliveryProgress::update($progress, 1, 1, 'arrived', 9, 'arrival');
        $progress = DeliveryProgress::update($progress, 1, 1, 'arrived', 9, 'retry');
        $this->assertSame('arrival', $progress['stops'][0]['arrived_at']);
        $progress = DeliveryProgress::update($progress, 1, 1, 'delivered', 9, 'handoff');
        $this->assertSame($progress, DeliveryProgress::update($progress, 1, 1, 'delivered', 9, 'retry'));
        $this->assertSame($progress, DeliveryProgress::update($progress, 1, 1, 'arrived', 9, 'late arrival'));
        $this->assertSame('confirmed', $progress['pickup_vehicle_confirmed_at']);
    }

    public function test_each_drop_including_final_drop_is_tracked(): void
    {
        $progress = [];
        foreach ([1, 2, 3] as $index) {
            $progress = DeliveryProgress::update($progress, 3, $index, 'arrived', 9, 'arrival');
            $progress = DeliveryProgress::update($progress, 3, $index, 'delivered', 9, 'handoff');
        }
        $this->assertSame(['delivered', 'delivered', 'delivered'], array_column($progress['stops'], 'status'));
    }

    public function test_invalid_actions_and_indices_are_rejected(): void
    {
        foreach ([[0,'arrived'],[3,'arrived'],[1,'completed']] as [$index,$action]) {
            try {DeliveryProgress::update([], 2, $index, $action, 9, 'now'); $this->fail('Invalid transition accepted.');}
            catch (InvalidArgumentException $error) {$this->assertSame(422, $error->getCode());}
        }
    }
}
