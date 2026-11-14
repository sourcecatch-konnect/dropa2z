<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\SMSGatewayController;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Artisan;
use Jackiedo\DotenvEditor\Facades\DotenvEditor;
use Mockery;
use PHPUnit\Framework\TestCase;

class AuthkeyGatewaySettingsTest extends TestCase
{
    private array $oldConfig;
    private Store $testSession;
    private $originalArtisan;
    private $originalEditor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->oldConfig = config('authkey', []);
        $this->originalArtisan = Artisan::getFacadeRoot();
        $this->originalEditor = DotenvEditor::getFacadeRoot();
        config(['authkey' => [
            'enabled' => false, 'api_key' => 'test-saved-key', 'otp_sid' => '1001',
            'otp_variable' => 'otp', 'notification_sid' => '', 'message_variable' => 'message',
        ]]);
        $this->testSession = new Store('authkey-tests', new ArraySessionHandler(120));
        app('redirect')->setSession($this->testSession);
    }

    protected function tearDown(): void
    {
        config(['authkey' => $this->oldConfig]);
        Mockery::close();
        Artisan::swap($this->originalArtisan);
        DotenvEditor::swap($this->originalEditor);
        parent::tearDown();
    }

    public function test_blank_api_key_keeps_saved_secret_and_never_writes_blank_key(): void
    {
        DotenvEditor::shouldReceive('setKey')->once()->with('AUTHKEY_OTP_SID', '1001');
        DotenvEditor::shouldReceive('setKey')->once()->with('AUTHKEY_OTP_VARIABLE', 'otp');
        DotenvEditor::shouldReceive('setKey')->once()->with('AUTHKEY_NOTIFICATION_SID', '');
        DotenvEditor::shouldReceive('setKey')->once()->with('AUTHKEY_MESSAGE_VARIABLE', 'message');
        DotenvEditor::shouldReceive('save')->once();
        Artisan::shouldReceive('call')->once()->with('config:clear');
        Artisan::shouldReceive('call')->once()->with('queue:restart');
        $request = Request::create('/admin/sms-gateways/authkey', 'POST', [
            'authkey_api_key' => '', 'authkey_otp_sid' => '1001',
            'authkey_otp_variable' => 'otp', 'authkey_message_variable' => 'message',
        ]);
        $response = (new SMSGatewayController())->update($request, 'authkey');
        $this->assertSame(302, $response->getStatusCode());
        $this->assertSame('test-saved-key', config('authkey.api_key'));
        $this->assertNull($this->testSession->get('error'));
    }

    public function test_invalid_settings_do_not_flash_api_key_or_write_environment(): void
    {
        DotenvEditor::shouldReceive('setKey')->never();
        DotenvEditor::shouldReceive('save')->never();
        $request = Request::create('/admin/sms-gateways/authkey', 'POST', [
            'authkey_api_key' => 'new-private-key', 'authkey_otp_sid' => '1001',
            'authkey_otp_variable' => 'mobile', 'authkey_message_variable' => 'message',
        ]);
        (new SMSGatewayController())->update($request, 'authkey');
        $this->assertNull($this->testSession->get('_old_input.authkey_api_key'));
        $this->assertTrue($this->testSession->get('errors')->has('authkey_otp_variable'));
    }

    public function test_gateway_cannot_be_enabled_without_approved_template_configuration(): void
    {
        config(['authkey.api_key' => '', 'authkey.otp_sid' => '']);
        DotenvEditor::shouldReceive('setKey')->never();
        $response = (new SMSGatewayController())->status(Request::create('/', 'POST', ['status' => 1]), 'authkey');
        $this->assertSame(422, $response->getStatusCode());
        $this->assertArrayHasKey('error', $response->getData(true));
    }

    public function test_configured_gateway_enable_uses_existing_permission_protected_action(): void
    {
        DotenvEditor::shouldReceive('setKey')->once()->with('AUTHKEY_SMS_ENABLED', 'true');
        DotenvEditor::shouldReceive('save')->once();
        Artisan::shouldReceive('call')->once()->with('config:clear');
        Artisan::shouldReceive('call')->once()->with('queue:restart');
        $response = (new SMSGatewayController())->status(Request::create('/', 'POST', ['status' => 1]), 'authkey');
        $this->assertTrue($response->getData(true)['success']);
    }
}
