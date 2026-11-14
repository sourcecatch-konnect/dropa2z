<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class AdminRouteSecurityTest extends TestCase
{
    private function adminRouteFiles(): array
    {
        $projectRoot = dirname(__DIR__, 2);

        return [
            $projectRoot . '/routes/admin.php',
            $projectRoot . '/Modules/Taxido/routes/admin.php',
            $projectRoot . '/Modules/Ticket/routes/admin.php',
        ];
    }

    public function test_destructive_and_restore_admin_routes_do_not_use_get(): void
    {
        $unsafeRoutePattern = "/Route::get\\((?='[^']+\\/(?:destroy|force-delete|restore)\\/)/";

        foreach ($this->adminRouteFiles() as $routeFile) {
            $contents = file_get_contents($routeFile);

            self::assertNotFalse($contents);
            self::assertSame(0, preg_match_all($unsafeRoutePattern, $contents));
        }
    }

    public function test_legacy_withdrawal_status_get_routes_are_not_registered(): void
    {
        $contents = file_get_contents(dirname(__DIR__, 2) . '/Modules/Taxido/routes/admin.php');

        self::assertNotFalse($contents);
        self::assertStringNotContainsString("Route::get('withdraw-request/status/{id}'", $contents);
        self::assertStringNotContainsString("Route::get('fleet-withdraw-request/status/{id}'", $contents);
    }
}
