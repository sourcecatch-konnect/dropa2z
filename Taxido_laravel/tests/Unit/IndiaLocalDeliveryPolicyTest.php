<?php

namespace Tests\Unit;

use Modules\Taxido\Services\IndiaLocalDeliveryPolicy;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class IndiaLocalDeliveryPolicyTest extends TestCase
{
    private function policy(): IndiaLocalDeliveryPolicy
    {
        return new class extends IndiaLocalDeliveryPolicy {
            public function identify($lat, $lng): array
            {
                return match ((int)$lat) {
                    1, 2 => ['country' => 'IN', 'city' => 'Jalgaon', 'city_key' => 'mh:jalgaon'],
                    3 => ['country' => 'IN', 'city' => 'Mumbai', 'city_key' => 'mh:mumbai'],
                    4 => ['country' => 'NP', 'city' => 'Kathmandu', 'city_key' => 'np:kathmandu'],
                    default => ['country' => 'IN', 'city' => null, 'city_key' => null],
                };
            }
        };
    }

    public function test_same_city_stops_and_swapped_endpoints_are_accepted(): void
    {
        $points = [['lat'=>1,'lng'=>1], ['lat'=>2,'lng'=>1], ['lat'=>1,'lng'=>1]];
        $this->policy()->assertLocalRoute($points);
        $this->policy()->assertLocalRoute(array_reverse($points));
        $this->addToAssertionCount(2);
    }

    public function test_an_intercity_middle_stop_is_rejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('same city');
        $this->policy()->assertLocalRoute([['lat'=>1,'lng'=>1], ['lat'=>3,'lng'=>1], ['lat'=>2,'lng'=>1]]);
    }

    public function test_non_indian_destinations_are_rejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('in India');
        $this->policy()->assertLocalRoute([['lat'=>1,'lng'=>1], ['lat'=>4,'lng'=>1]]);
    }

    public function test_unknown_cities_are_not_silently_accepted(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('identify this city');
        $this->policy()->assertLocalRoute([['lat'=>1,'lng'=>1], ['lat'=>5,'lng'=>1]]);
    }

    public function test_missing_destinations_are_rejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->policy()->assertLocalRoute([['lat'=>1,'lng'=>1]]);
    }

    public function test_locality_is_used_instead_of_the_larger_district(): void
    {
        $info = IndiaLocalDeliveryPolicy::cityInfo([['address_components'=>[
            ['types'=>['country'],'short_name'=>'IN'],
            ['types'=>['administrative_area_level_1'],'short_name'=>'MH'],
            ['types'=>['administrative_area_level_2'],'long_name'=>'Pune District'],
            ['types'=>['locality'],'long_name'=>'Pune'],
        ]]]);
        $this->assertSame('IN', $info['country']);
        $this->assertSame('mh:pune', $info['city_key']);
    }
}
