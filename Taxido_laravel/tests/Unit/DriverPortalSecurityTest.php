<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class DriverPortalSecurityTest extends TestCase
{
    public function test_portal_routes_use_the_driver_only_middleware(): void
    {
        $routes = file_get_contents(dirname(__DIR__, 2) . '/Modules/Taxido/routes/web.php');

        self::assertNotFalse($routes);
        self::assertStringContainsString("'driver.portal.auth'", $routes);
        self::assertStringContainsString("'throttle:5,1'", $routes);
    }

    public function test_ride_request_responses_require_current_assignment_and_unexpired_window(): void
    {
        $repository = file_get_contents(dirname(__DIR__, 2) . '/Modules/Taxido/app/Repositories/Api/RideRequestRepository.php');

        self::assertNotFalse($repository);
        self::assertStringContainsString("where('current_driver_id', \$driverId)", $repository);
        self::assertStringContainsString("where('driver_acceptance_expires_at', '>', now())", $repository);
        self::assertStringContainsString('ensureDriverCanRespond', $repository);
    }
}
