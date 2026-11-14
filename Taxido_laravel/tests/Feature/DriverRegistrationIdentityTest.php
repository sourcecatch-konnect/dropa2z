<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Modules\Taxido\Http\Controllers\Api\DriverAuthController;
use Modules\Taxido\Models\Driver;
use Modules\Taxido\Models\Rider;
use PHPUnit\Framework\TestCase;

/** Transactional diagnostics: no fixture account or token may be committed. */
class DriverRegistrationIdentityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! app()->bound('db')) {
            throw new \RuntimeException('Bootstrap Laravel before running this diagnostic.');
        }
        Event::fake();
        Mail::fake();
        Notification::fake();
        Queue::fake();
        Http::preventStrayRequests();
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        while (DB::transactionLevel() > 0) {
            DB::rollBack();
        }
        parent::tearDown();
    }

    private function user(string $role, ?string $email = null): User
    {
        $user = new User();
        $user->forceFill([
            'name' => 'Parcel Test',
            'email' => $email ?? 'driver-reg-'.Str::uuid().'@example.invalid',
            'status' => 1,
            'password' => password_hash('Preserve-existing-password', PASSWORD_BCRYPT),
        ])->save();
        $user->assignRole($role);
        return $user;
    }

    private function resolve(string $email): ?User
    {
        $method = new \ReflectionMethod(DriverAuthController::class, 'resolveDriverLoginIdentity');
        return $method->invoke(new DriverAuthController(), $email);
    }

    private function proof(string $email): string
    {
        $token = (string) random_int(100000, 999999);
        DB::table('auth_tokens')->insert(['email'=>$email, 'phone'=>'+', 'token'=>$token, 'created_at'=>now()]);
        return $token;
    }

    private function registration(string $email, string $proof): Request
    {
        $service = DB::table('services')->where('slug', 'parcel')->whereNull('deleted_at')->first()
            ?? DB::table('services')->where('type', 'parcel')->whereNull('deleted_at')->first();
        if (! $service) {
            throw new \RuntimeException('Parcel service fixture is required.');
        }
        return Request::create('/api/driver/register', 'POST', [
            'name'=>'Parcel Test', 'email'=>$email, 'verification_type'=>'email',
            'verification_token'=>$proof, 'service_id'=>$service->id,
        ]);
    }

    public function test_existing_rider_is_selected_ahead_of_staff_with_the_same_email(): void
    {
        $admin = $this->user('admin');
        $rider = $this->user('rider', $admin->email);
        $this->assertSame($rider->id, $this->resolve(strtoupper($rider->email))->id);
        $this->assertFalse($rider->hasRole('driver'));
        $this->assertFalse($admin->hasRole('driver'));
    }

    public function test_verified_existing_rider_can_add_driver_without_duplicate_email_or_losing_customer_data(): void
    {
        $admin = $this->user('admin');
        $rider = $this->user('rider', $admin->email);
        $password = $rider->getRawOriginal('password');
        Rider::findOrFail($rider->id)->wallet()->create(['balance'=>37]);
        $proof = $this->proof($rider->email);
        $count = User::where('email', $rider->email)->count();

        $response = (new DriverAuthController())->driverRegister($this->registration($rider->email, $proof));
        $data = $response->getData(true);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame($rider->id, $data['id']);
        $this->assertSame($count, User::where('email', $rider->email)->count());
        $this->assertTrue(User::findOrFail($rider->id)->hasAllRoles(['rider','driver']));
        $this->assertFalse(User::findOrFail($admin->id)->hasRole('driver'));
        $this->assertSame($password, User::findOrFail($rider->id)->getRawOriginal('password'));
        $this->assertSame(37.0, (float) Rider::findOrFail($rider->id)->wallet->balance);
        $this->assertNotNull(Driver::findOrFail($rider->id)->wallet);
        $this->assertSame(0, DB::table('auth_tokens')->where('email', $rider->email)->where('token',$proof)->count());
        $this->assertSame('driver', DB::table('personal_access_tokens')->where('tokenable_id',$rider->id)->orderByDesc('id')->value('role_type'));
    }

    public function test_existing_driver_otp_goes_to_login_instead_of_registration(): void
    {
        $admin = $this->user('admin');
        $driver = $this->user('driver', $admin->email);
        $request = Request::create('/api/driver/verify-token', 'POST', [
            'email_or_phone'=>$driver->email, 'token'=>$this->proof($driver->email),
        ]);
        $data = (new DriverAuthController())->verifyDriverToken($request)->getData(true);
        $this->assertTrue($data['is_registered']);
        $this->assertSame($driver->id, $data['id']);
        $this->assertSame('driver', $data['role']);
    }

    public function test_an_invalid_email_proof_cannot_add_driver_access(): void
    {
        $rider = $this->user('rider');
        try {
            (new DriverAuthController())->driverRegister($this->registration($rider->email, 'not-a-valid-otp'));
            $this->fail('Email ownership proof must still be required.');
        } catch (\App\Exceptions\ExceptionHandler $exception) {
            $this->assertSame(422, $exception->getCode());
            $this->assertStringContainsString('verify your email', $exception->getMessage());
        }
        $this->assertFalse(User::findOrFail($rider->id)->hasRole('driver'));
    }

    public function test_staff_and_disabled_accounts_are_not_sent_into_registration(): void
    {
        $admin = $this->user('admin');
        try {
            $this->resolve($admin->email);
            $this->fail('A staff-only identity must not be linked.');
        } catch (\Exception $exception) {
            $this->assertSame(403, $exception->getCode());
        }
        $rider = $this->user('rider');
        $rider->status = 0;
        $rider->save();
        try {
            $this->resolve($rider->email);
            $this->fail('Disabled identities must remain blocked.');
        } catch (\Exception $exception) {
            $this->assertSame(403, $exception->getCode());
        }
    }
}
