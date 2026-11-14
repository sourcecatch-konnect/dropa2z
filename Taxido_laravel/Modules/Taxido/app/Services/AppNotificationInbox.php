<?php

namespace Modules\Taxido\Services;

use App\Events\AppNotificationCreated;
use App\Models\User;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class AppNotificationInbox
{
    public static function payload(string $slug, array $message): array
    {
        $extra = $message['data'] ?? [];
        $data = array_intersect_key($extra, array_flip(['type','ride_id','ride_request_id','ride_number','status']));
        $data['title'] = (string) ($message['notification']['title'] ?? $extra['title'] ?? 'Delivery update');
        $data['message'] = (string) ($message['notification']['body'] ?? $extra['body'] ?? '');
        $data['template_slug'] = $slug;
        return $data;
    }

    public static function notificationId(int $userId, string $slug, array $data): string
    {
        $entity = $data['ride_id'] ?? $data['ride_request_id'] ?? null;
        return $entity
            ? Uuid::uuid5(Uuid::NAMESPACE_URL, 'dropa2z-notice:' . $userId . ':' . $slug . ':' . $entity)->toString()
            : (string) Str::uuid();
    }

    public function store(int $userId, string $slug, array $message): void
    {
        // Always use the canonical User morph type read by NotificationController.
        $user = User::find($userId);
        if (!$user) return;
        $data = self::payload($slug, $message);
        $id = self::notificationId($userId, $slug, $data);
        $notice = $user->notifications()->firstOrCreate(['id' => $id], [
            'type' => self::class, 'data' => $data, 'read_at' => null,
        ]);
        if ($notice->wasRecentlyCreated) {
            try { event(new AppNotificationCreated($userId, $id)); }
            catch (\Throwable $e) { report($e); } // Push/booking must survive a websocket outage.
        }
    }
}
