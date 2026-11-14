<?php

namespace Tests\Unit;

use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory;
use Modules\Taxido\Http\Requests\Api\CreateRideRequest;
use Modules\Taxido\Models\Ride;
use Modules\Taxido\Models\RideRequest;
use Modules\Taxido\Services\DeliveryBookingDetails;
use PHPUnit\Framework\TestCase;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;

class DeliveryBookingDetailsTest extends TestCase
{
    public function test_gstin_checksum_rejects_invalid_numbers(): void
    {
        $this->assertTrue(DeliveryBookingDetails::validGstin('27AAPFU0939F1ZV'));
        $this->assertFalse(DeliveryBookingDetails::validGstin('27AAPFU0939F1ZA'));
        $this->assertFalse(DeliveryBookingDetails::validGstin('invalid'));
    }

    private function validator(array $details): \Illuminate\Validation\Validator
    {
        $rules = array_filter((new CreateRideRequest())->rules(), fn ($key) => str_starts_with($key, 'delivery_details'), ARRAY_FILTER_USE_KEY);
        return (new Factory(new Translator(new ArrayLoader(), 'en')))->make($details, $rules);
    }

    public function test_legacy_request_remains_valid_but_new_details_require_valid_goods_and_confirmation(): void
    {
        $this->assertFalse($this->validator([])->fails());
        $this->assertFalse($this->validator(['delivery_details'=>['goods_type'=>'documents','restricted_items_confirmed'=>1]])->fails());
        $this->assertTrue($this->validator(['delivery_details'=>['goods_type'=>'unknown','restricted_items_confirmed'=>1]])->fails());
        $this->assertTrue($this->validator(['delivery_details'=>['goods_type'=>'documents','restricted_items_confirmed'=>0]])->fails());
        $this->assertTrue($this->validator(['delivery_details'=>['goods_type'=>'documents','restricted_items_confirmed'=>1,'price'=>1]])->fails());
    }

    public function test_gst_requires_registered_business_name_and_is_preserved_by_both_booking_models(): void
    {
        $details=['goods_type'=>'electronics','restricted_items_confirmed'=>1,'gstin'=>'27AAPFU0939F1ZV'];
        $this->assertTrue($this->validator(['delivery_details'=>$details])->fails());
        $details['business_name']='Sample business';
        $this->assertFalse($this->validator(['delivery_details'=>$details])->fails());
        foreach ([new RideRequest(),new Ride()] as $model) {
            $model->fill(['delivery_details'=>$details]);
            $this->assertSame($details,$model->delivery_details);
        }
    }

    public function test_request_and_accepted_delivery_retain_goods_and_gst_in_a_database(): void
    {
        $resolver=Model::getConnectionResolver();
        $dispatcher=Model::getEventDispatcher();
        $capsule=new Capsule();
        $capsule->addConnection(['driver'=>'sqlite','database'=>':memory:']);
        $capsule->bootEloquent();
        Model::unsetEventDispatcher();
        try {
            foreach (['ride_requests','rides'] as $tableName) {
                $capsule->getConnection()->getSchemaBuilder()->create($tableName,function(Blueprint $table){$table->increments('id');$table->json('delivery_details')->nullable();$table->timestamps();$table->softDeletes();});
            }
            $details=['goods_type'=>'electronics','restricted_items_confirmed'=>true,'gstin'=>'27AAPFU0939F1ZV','business_name'=>'Example business'];
            $request=new RideRequest(['delivery_details'=>$details]);
            $request->save();
            $request=$request->fresh();
            $ride=new Ride(['delivery_details'=>$request->delivery_details]);
            $ride->save();
            $this->assertSame($details,$ride->fresh()->delivery_details);
        } finally {
            if($resolver)Model::setConnectionResolver($resolver);
            if($dispatcher)Model::setEventDispatcher($dispatcher);
        }
    }
}
