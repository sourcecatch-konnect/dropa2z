<?php

namespace Tests\Unit;

use Illuminate\Http\Request;
use Modules\Taxido\Http\Resources\RideResource;
use PHPUnit\Framework\TestCase;

class RideResourcePickupResponseTest extends TestCase
{
    private function response(?string $snapshotPhoto, ?string $accountPhoto): array
    {
        // No database or application boot: reproduce the JSON rider attribute
        // which shadows the Eloquent rider relation in real deliveries.
        $ride = new class($snapshotPhoto, $accountPhoto) {
            public array $rider;
            public int $id = 74;
            public int $otp = 9876;
            public object $ride_status;
            public function __construct(?string $snapshotPhoto, private ?string $accountPhoto)
            {
                $this->rider = ['id'=>279, 'name'=>'Test customer', 'profile_image_url'=>$snapshotPhoto];
                $this->ride_status = (object) ['name'=>'Started', 'slug'=>'started'];
            }
            public function __get(string $name): mixed { return null; }
            public function rider(): object
            {
                return new class($this->accountPhoto) {
                    public function __construct(private ?string $photo) {}
                    public function first(): object
                    {
                        return (object) ['profile_image'=>$this->photo ? (object) ['original_url'=>$this->photo] : null];
                    }
                };
            }
        };
        return (new RideResource($ride))->toArray(Request::create('/api/ride', 'GET'));
    }

    public function test_pickup_start_and_active_list_serialize_a_json_rider_without_error(): void
    {
        $result = $this->response(null, 'https://example.test/photo.png');
        $this->assertSame(74, $result['id']);
        $this->assertSame(9876, $result['otp']);
        $this->assertSame('started', $result['ride_status']['slug']);
        $this->assertSame('https://example.test/photo.png', $result['rider']['profile_image_url']);
    }

    public function test_snapshot_photo_and_missing_photo_are_both_supported(): void
    {
        $this->assertSame('https://example.test/snapshot.png', $this->response('https://example.test/snapshot.png', null)['rider']['profile_image_url']);
        $this->assertNull($this->response(null, null)['rider']['profile_image_url']);
    }
}
