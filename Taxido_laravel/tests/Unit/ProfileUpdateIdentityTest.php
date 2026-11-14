<?php

namespace Tests\Unit;

use App\Http\Requests\Api\UpdateProfileRequest;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\DatabasePresenceVerifier;
use Illuminate\Validation\Factory;
use PHPUnit\Framework\TestCase;

class ProfileUpdateIdentityTest extends TestCase
{
    private function validateProfile(array $input, ?string $phone = null): \Illuminate\Validation\Validator
    {
        // Isolated database: never reads or writes production accounts.
        $db = new Capsule();
        $db->addConnection(['driver'=>'sqlite', 'database'=>':memory:']);
        $db->getConnection()->getSchemaBuilder()->create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->softDeletes();
        });
        $db->getConnection()->table('users')->insert([
            ['id'=>1, 'email'=>'same@example.test', 'phone'=>$phone],
            ['id'=>2, 'email'=>'same@example.test', 'phone'=>$phone],
            ['id'=>3, 'email'=>'taken@example.test', 'phone'=>'9123456789'],
        ]);
        $user = new class($phone) {
            public string $email = 'same@example.test';
            public function __construct(public ?string $phone) {}
            public function getKey(): int { return 1; }
        };
        $request = UpdateProfileRequest::create('/api/updateProfile', 'PUT', $input);
        $request->setUserResolver(fn () => $user);
        $factory = new Factory(new Translator(new ArrayLoader(), 'en'));
        $factory->setPresenceVerifier(new DatabasePresenceVerifier($db->getDatabaseManager()));
        return $factory->make($input, $request->rules());
    }

    public function test_existing_shared_email_does_not_block_a_photo_or_name_update(): void
    {
        $this->assertFalse($this->validateProfile(['name'=>'Customer', 'email'=>'same@example.test', 'phone'=>null])->fails());
        $this->assertFalse($this->validateProfile(['name'=>'Customer'])->fails());
    }

    public function test_unchanged_shared_phone_is_accepted(): void
    {
        $this->assertFalse($this->validateProfile(['email'=>'same@example.test', 'phone'=>'9876543210'], '9876543210')->fails());
    }

    public function test_email_only_legacy_phone_placeholder_does_not_block_a_photo_update(): void
    {
        $this->assertFalse($this->validateProfile(['email'=>'same@example.test', 'phone'=>'0'], '0')->fails());
        $this->assertFalse($this->validateProfile(['email'=>'same@example.test', 'phone'=>null], '0')->fails());
    }

    public function test_changed_email_still_rejects_a_duplicate_or_invalid_address(): void
    {
        $this->assertTrue($this->validateProfile(['email'=>'taken@example.test'])->errors()->has('email'));
        $this->assertTrue($this->validateProfile(['email'=>'invalid'])->errors()->has('email'));
        $this->assertFalse($this->validateProfile(['email'=>'new@example.test'])->fails());
    }

    public function test_changed_phone_still_requires_a_valid_unique_number(): void
    {
        $this->assertTrue($this->validateProfile(['phone'=>'9123456789'])->errors()->has('phone'));
        $this->assertTrue($this->validateProfile(['phone'=>'invalid'])->errors()->has('phone'));
        $this->assertTrue($this->validateProfile(['phone'=>null], '9876543210')->errors()->has('phone'));
        $this->assertFalse($this->validateProfile(['phone'=>'9876543201'])->fails());
    }
}
