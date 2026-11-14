<?php
namespace Tests\Unit;

use Modules\Taxido\Services\DriverTrainingService;
use PHPUnit\Framework\TestCase;

class DriverTrainingProgressTest extends TestCase
{
    public function test_full_practice_is_sequential_and_retries_are_idempotent(): void
    {
        $completed = 0;
        foreach (DriverTrainingService::ACTIONS as $index => $action) {
            $completed = DriverTrainingService::advanceCount($completed, $index + 1, $action);
            $this->assertSame($index + 1, $completed);
            $this->assertSame($completed, DriverTrainingService::advanceCount($completed, $index + 1, $action));
        }
        $this->assertSame(6, $completed);
        $this->assertSame(6, DriverTrainingService::advanceCount(6, 1, 'accept_request'));
    }
    public function test_cannot_skip_to_the_pro_driver_badge(): void
    {
        $this->expectException(\DomainException::class);
        DriverTrainingService::advanceCount(0, 6, 'payment_recorded');
    }
    public function test_cannot_use_an_action_for_a_different_step(): void
    {
        $this->expectException(\DomainException::class);
        DriverTrainingService::advanceCount(2, 3, 'payment_recorded');
    }
}
