<?php

namespace Tests\Unit;

use App\Services\AuthkeySms;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory;
use Illuminate\Routing\RouteCollection;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class AuthkeySmsTest extends TestCase
{
    private $previousApp;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousApp = Facade::getFacadeApplication();
        $app = new Container();
        Container::setInstance($app);
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($app);
        $app->instance('config', new Repository(['authkey' => [
            'enabled' => true, 'api_key' => 'test-secret-not-real', 'otp_sid' => '1001',
            'otp_variable' => 'otp', 'notification_sid' => '', 'message_variable' => 'message',
        ]]));
        $app->instance(Factory::class, new Factory());
        $app->instance('url', new UrlGenerator(new RouteCollection(), Request::create('https://dropa2z.com')));
        $app->alias('url', \Illuminate\Contracts\Routing\UrlGenerator::class);
        $app->instance('log', new \Psr\Log\NullLogger());
        Http::preventStrayRequests();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        Facade::clearResolvedInstances();
        Facade::setFacadeApplication($this->previousApp);
        Container::setInstance($this->previousApp);
        parent::tearDown();
    }

    public static function phones(): array
    {
        return [['+919876543210'], ['919876543210'], ['9876543210'], ['+91 98765-43210']];
    }

    #[DataProvider('phones')]
    public function test_phone_otp_uses_approved_template_and_secret_header(string $phone): void
    {
        Http::fake([AuthkeySms::ENDPOINT => Http::response(['LogID' => 'test-receipt', 'Message' => 'Submitted Successfully'])]);
        $this->assertSame(['success' => true, 'message_id' => 'test-receipt'], (new AuthkeySms())->send($phone, '012345'));
        Http::assertSent(fn ($request) => $request->method() === 'POST'
            && $request->url() === AuthkeySms::ENDPOINT
            && $request->hasHeader('Authorization', 'Basic test-secret-not-real')
            && $request->data() === ['country_code' => '91', 'mobile' => '9876543210', 'sid' => '1001', 'otp' => '012345']);
        Http::assertSentCount(1);
    }

    public function test_missing_configuration_does_not_send_or_report_success(): void
    {
        config(['authkey.otp_sid' => '']);
        try {
            (new AuthkeySms())->send('+919876543210', '123456');
            $this->fail('Unconfigured SMS must fail.');
        } catch (RuntimeException $e) {
            $this->assertSame(503, $e->getCode());
        }
        Http::assertNothingSent();
    }

    public function test_disabled_gateway_does_not_send(): void
    {
        config(['authkey.enabled' => false]);
        $this->expectExceptionCode(503);
        (new AuthkeySms())->send('+919876543210', '123456');
    }

    public static function invalidPhones(): array
    {
        return [['+15551234567'], ['1234567890'], ['+919876543210,9876543211'], ['98765abc10'], ['+9109876543210']];
    }

    #[DataProvider('invalidPhones')]
    public function test_invalid_or_multiple_recipients_are_rejected_before_transport(string $phone): void
    {
        $this->expectExceptionCode(422);
        (new AuthkeySms())->send($phone, '123456');
    }

    public static function providerFailures(): array
    {
        return [
            [200, ['Message' => 'Invalid Authkey']],
            [200, ['LogID' => '', 'Message' => 'Submitted Successfully']],
            [200, ['LogID' => 'receipt', 'Message' => 'Rejected', 'error' => 'invalid template']],
            [200, ['LogID' => 'receipt', 'Message' => 'Submitted Successfully', 'status' => false]],
            [200, '<html>Login required</html>'],
            [401, ['Message' => 'Invalid Authkey']],
            [500, ['Message' => 'Server error']],
            [302, ''],
        ];
    }

    #[DataProvider('providerFailures')]
    public function test_provider_rejection_including_http_200_is_not_success(int $status, $body): void
    {
        Http::fake([AuthkeySms::ENDPOINT => Http::response($body, $status)]);
        try {
            (new AuthkeySms())->send('+919876543210', '123456');
            $this->fail('A rejected request must fail.');
        } catch (RuntimeException $e) {
            $this->assertSame(503, $e->getCode());
            $this->assertStringNotContainsString('test-secret', $e->getMessage());
        }
        Http::assertSentCount(1);
    }

    public function test_timeout_does_not_leak_request_or_retry(): void
    {
        $attempts = 0;
        Http::fake(function () use (&$attempts) {
            ++$attempts;
            throw new ConnectionException('Private test-secret-not-real request with OTP 012345');
        });
        try {
            (new AuthkeySms())->send('+919876543210', '012345');
            $this->fail('Timeout must not report success.');
        } catch (RuntimeException $e) {
            $this->assertSame(503, $e->getCode());
            $this->assertNull($e->getPrevious());
            $this->assertStringNotContainsString('test-secret', $e->getMessage());
            $this->assertStringNotContainsString('012345', $e->getMessage());
        }
        $this->assertSame(1, $attempts);
    }

    public function test_general_notifications_require_their_own_approved_template(): void
    {
        $this->expectExceptionCode(503);
        (new AuthkeySms())->send('+919876543210', 'Your parcel has arrived.');
    }

    public function test_notification_cannot_accidentally_use_otp_template(): void
    {
        config(['authkey.notification_sid' => '2002']);
        Http::fake([AuthkeySms::ENDPOINT => Http::response(['LogID' => 'receipt', 'Message' => 'Submitted Successfully'])]);
        (new AuthkeySms())->send('9876543210', 'Your parcel has arrived.');
        Http::assertSent(fn ($request) => $request['sid'] === '2002' && $request['message'] === 'Your parcel has arrived.' && !isset($request['otp']));
    }

    public function test_variable_cannot_overwrite_recipient_or_authentication(): void
    {
        config(['authkey.otp_variable' => 'mobile']);
        $this->expectExceptionCode(503);
        (new AuthkeySms())->send('9876543210', '123456');
    }

    public function test_gateway_description_contains_no_secret_values(): void
    {
        $gateway = AuthkeySms::gateway();
        $this->assertSame('authkey', $gateway['slug']);
        $this->assertStringNotContainsString('test-secret-not-real', json_encode($gateway));
        $this->assertSame([], $gateway['configs']);
    }
}
