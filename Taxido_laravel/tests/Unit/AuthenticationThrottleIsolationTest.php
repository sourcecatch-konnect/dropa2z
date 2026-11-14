<?php

namespace Tests\Unit;

use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\RateLimiter;
use Illuminate\Cache\Repository;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Routing\Route;
use PHPUnit\Framework\TestCase;

class AuthenticationThrottleIsolationTest extends TestCase
{
    private function request(ThrottleRequests $middleware, string $endpoint, string $prefix): Response
    {
        $request = Request::create('https://example.test/api/'.$endpoint, 'POST', [], [], [], ['REMOTE_ADDR' => '192.0.2.25']);
        $request->setUserResolver(fn () => null);
        $request->setRouteResolver(fn () => new Route('POST', 'api/'.$endpoint, []));

        return $middleware->handle($request, fn () => new Response('ok'), 5, 1, $prefix);
    }

    public function test_driver_login_attempts_do_not_block_verification_or_registration(): void
    {
        $middleware = new ThrottleRequests(new RateLimiter(new Repository(new ArrayStore())));
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->assertSame(200, $this->request($middleware, 'driver/login', 'dropa2z.auth.driver.login.')->getStatusCode());
        }
        $this->assertSame(200, $this->request($middleware, 'driver/verify-token', 'dropa2z.auth.driver.verify-token.')->getStatusCode());
        $this->assertSame(200, $this->request($middleware, 'driver/register', 'dropa2z.auth.driver.register.')->getStatusCode());
        $this->assertSame(200, $this->request($middleware, 'rider/login', 'dropa2z.auth.rider.login.')->getStatusCode());
    }

    public function test_sixth_attempt_on_the_same_step_is_still_blocked(): void
    {
        $middleware = new ThrottleRequests(new RateLimiter(new Repository(new ArrayStore())));
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->request($middleware, 'driver/register', 'dropa2z.auth.driver.register.');
        }
        try {
            $this->request($middleware, 'driver/register', 'dropa2z.auth.driver.register.');
            $this->fail('The sixth request must still be rate limited.');
        } catch (ThrottleRequestsException $exception) {
            $this->assertSame(429, $exception->getStatusCode());
            $this->assertGreaterThan(0, $exception->getHeaders()['Retry-After']);
            $this->assertLessThanOrEqual(60, $exception->getHeaders()['Retry-After']);
        }
    }

    public function test_all_limited_authentication_routes_have_distinct_prefixes(): void
    {
        $source = file_get_contents(getenv('DROPA2Z_AUTH_ROUTES_FILE') ?: dirname(__DIR__, 2).'/Modules/Taxido/routes/api/api.php');
        preg_match_all("/throttle:5,1,([^']+)/", $source, $matches);
        $this->assertCount(18, $matches[1]);
        $this->assertCount(18, array_unique($matches[1]));
        $this->assertStringNotContainsString("middleware('throttle:5,1')", $source);
    }
}
