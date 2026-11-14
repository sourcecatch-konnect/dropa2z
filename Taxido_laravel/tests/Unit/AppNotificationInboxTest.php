<?php

namespace Tests\Unit;

use App\Events\AppNotificationCreated;
use Modules\Taxido\Services\AppNotificationInbox;
use PHPUnit\Framework\TestCase;

class AppNotificationInboxTest extends TestCase
{
    public function test_inbox_retains_navigation_and_real_template_text_without_tokens(): void
    {
        $data = AppNotificationInbox::payload('ride-status-rider-accepted', [
            'notification' => ['title' => 'Delivery accepted', 'body' => 'Your partner is arriving'],
            'data' => ['ride_id'=>'8','status'=>'accepted','type'=>'ride_status','token'=>'secret','url'=>'internal'],
            'token' => 'fcm-secret',
        ]);
        $this->assertSame('8', $data['ride_id']);
        $this->assertSame('Delivery accepted', $data['title']);
        $this->assertArrayNotHasKey('token', $data);
        $this->assertArrayNotHasKey('url', $data);
    }

    public function test_duplicate_status_uses_same_id_but_other_user_or_status_is_distinct(): void
    {
        $id = AppNotificationInbox::notificationId(7, 'accepted', ['ride_id'=>'8']);
        $this->assertSame($id, AppNotificationInbox::notificationId(7, 'accepted', ['ride_id'=>'8']));
        $this->assertNotSame($id, AppNotificationInbox::notificationId(9, 'accepted', ['ride_id'=>'8']));
        $this->assertNotSame($id, AppNotificationInbox::notificationId(7, 'completed', ['ride_id'=>'8']));
    }

    public function test_realtime_event_only_announces_id_on_private_user_channel(): void
    {
        $event = new AppNotificationCreated(7, 'notice-id');
        $this->assertSame('private-user.notifications.7', $event->broadcastOn()[0]->name);
        $this->assertSame('notification.created', $event->broadcastAs());
        $this->assertSame(['notification_id'=>'notice-id'], $event->broadcastWith());
    }
}
