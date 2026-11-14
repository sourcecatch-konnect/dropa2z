<?php
namespace Tests\Unit;
use Illuminate\Container\Container;
use Illuminate\Config\Repository;
use Illuminate\Database\Capsule\Manager;
use Illuminate\Support\Facades\Facade;
use Modules\Taxido\Services\RiderDeletionPolicy;
use Modules\Taxido\Services\DeliveryServiceCards;
use PHPUnit\Framework\TestCase;

class RiderDeletionPolicyTest extends TestCase
{
    private Manager $db;
    protected function setUp(): void
    {
        parent::setUp();
        $container=new Container(); Container::setInstance($container);
        $container->instance('config',new Repository(['app'=>['key'=>'isolated-test-key']]));
        $this->db=new Manager($container);
        $this->db->addConnection(['driver'=>'sqlite','database'=>':memory:']);
        $this->db->setAsGlobal(); $this->db->bootEloquent();
        $container->instance('db',$this->db->getDatabaseManager());
        $container->bind('db.schema',fn()=>$this->db->schema());
        Facade::clearResolvedInstances(); Facade::setFacadeApplication($container);
        $migration=require __DIR__.'/../../Modules/Taxido/database/migrations/2026_11_11_130000_create_rider_deletion_restrictions.php';
        $migration->up();
    }
    protected function tearDown(): void
    {
        $this->db->getDatabaseManager()->disconnect();
        Facade::clearResolvedInstances(); Facade::setFacadeApplication(null);
        parent::tearDown();
    }
    private function user(): object {return (object)['email'=>'Fresh@example.test','phone'=>'9876543210','country_code'=>'91'];}
    private function record(): void {$this->db->getConnection()->transaction(fn()=>RiderDeletionPolicy::record($this->user()));}
    public function test_first_deletion_allows_registration_but_second_requires_admin(): void
    {
        $this->assertSame(0,RiderDeletionPolicy::preview($this->user())['completed_deletions']);
        $this->record(); RiderDeletionPolicy::assertRegistrationAllowed(' fresh@example.test ');
        $this->assertTrue(RiderDeletionPolicy::preview($this->user())['requires_admin_after_deletion']);
        $this->record();
        $this->expectExceptionCode(403); RiderDeletionPolicy::assertRegistrationAllowed('FRESH@EXAMPLE.TEST');
    }
    public function test_phone_format_alias_is_blocked_and_admin_unlocks_linked_contacts(): void
    {
        $this->record(); $this->record();
        $this->assertTrue(RiderDeletionPolicy::lookup('+91 98765 43210')['blocked']);
        $this->assertSame(2,RiderDeletionPolicy::unlock('fresh@example.test',7));
        RiderDeletionPolicy::assertRegistrationAllowed(null,'+91 98765 43210');
        $this->assertFalse(RiderDeletionPolicy::lookup('fresh@example.test')['blocked']);
        $this->assertSame(2,RiderDeletionPolicy::lookup('fresh@example.test')['deletion_count']);
        $this->record(); $this->assertTrue(RiderDeletionPolicy::lookup('9876543210')['blocked']);
    }
    public function test_only_keyed_hashes_are_stored_and_another_customer_is_unaffected(): void
    {
        $this->record(); $this->record();
        $stored=json_encode($this->db->table('rider_deletion_restrictions')->get());
        $this->assertStringNotContainsString('example.test',$stored);
        $this->assertStringNotContainsString('9876543210',$stored);
        RiderDeletionPolicy::assertRegistrationAllowed('different@example.test','9123456789');
        $this->assertFalse(RiderDeletionPolicy::lookup('different@example.test')['found']);
    }
    public function test_capacity_limits_match_approved_bike_and_auto_cards(): void
    {
        $this->assertSame(20,DeliveryServiceCards::maxWeight('bike'));
        $this->assertSame(90,DeliveryServiceCards::maxWeight('auto-rickshaw'));
        $this->assertNull(DeliveryServiceCards::maxWeight('unknown'));
    }
    public function test_changing_one_contact_does_not_reset_the_deletion_count(): void
    {
        $this->record(); $changed=$this->user(); $changed->phone='9123456789';
        $this->db->getConnection()->transaction(fn()=>RiderDeletionPolicy::record($changed));
        $this->assertTrue(RiderDeletionPolicy::lookup('9123456789')['blocked']);
        $this->assertSame(2,RiderDeletionPolicy::lookup('fresh@example.test')['deletion_count']);
        RiderDeletionPolicy::unlock('9123456789',7);
        $this->assertFalse(RiderDeletionPolicy::lookup('fresh@example.test')['blocked']);
    }
}
