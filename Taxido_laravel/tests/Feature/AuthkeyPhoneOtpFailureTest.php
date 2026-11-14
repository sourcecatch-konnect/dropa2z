<?php

namespace Tests\Feature;

use App\Services\AuthkeySms;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use RuntimeException;

class AuthkeyPhoneOtpFailureTest extends TestCase
{
    public static function controllers(): array
    {
        return [
            [\Modules\Taxido\Http\Controllers\Api\AuthController::class],
            [\Modules\Taxido\Http\Controllers\Api\DriverAuthController::class],
            [\Modules\Taxido\Http\Controllers\Api\FleetAuthController::class],
        ];
    }

    #[DataProvider('controllers')]
    public function test_rejected_sms_does_not_leave_usable_login_token(string $controller): void
    {
        $oldConfig = config('authkey');
        $oldDemo = config('app.demo');
        DB::beginTransaction();
        try {
            $setting = DB::table('settings')->first();
            $values = json_decode($setting->values, true);
            $values['general']['default_sms_gateway'] = 'authkey';
            DB::table('settings')->where('id', $setting->id)->update(['values' => json_encode($values)]);
            config(['app.demo' => false, 'authkey.enabled' => true, 'authkey.api_key' => 'test-only', 'authkey.otp_sid' => '1001', 'authkey.otp_variable' => 'otp']);
            $before = DB::table('auth_tokens')->where('phone', '+919876543210')->count();
            Http::preventStrayRequests();
            Http::fake([AuthkeySms::ENDPOINT => Http::response(['Message' => 'Template not approved'], 200)]);
            $method = new ReflectionMethod($controller, 'sendPhoneToken');
            $method->setAccessible(true);
            try {
                $method->invoke(app($controller), '91', '9876543210');
                $this->fail('SMS rejection must not report OTP sent.');
            } catch (RuntimeException $e) {
                $this->assertSame(503, $e->getCode());
            } catch (\App\Exceptions\ExceptionHandler $e) {
                $this->assertSame(503, $e->getCode());
            }
            $this->assertSame($before, DB::table('auth_tokens')->where('phone', '+919876543210')->count());
            Http::assertSentCount(1);
        } finally {
            DB::rollBack();
            config(['authkey' => $oldConfig, 'app.demo' => $oldDemo]);
            Http::clearResolvedInstance(\Illuminate\Http\Client\Factory::class);
            app()->forgetInstance(\Illuminate\Http\Client\Factory::class);
        }
    }
}
