<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use App\Services\ChatAccess;


Broadcast::channel('chat.room.{roomId}', function ($user, $roomId) {
    $room = DB::table('chat_rooms')
        ->where('room_id', $roomId)
        ->first();

    if (!$room) {
        return ChatAccess::canAccessRoomCandidate($user, (string) $roomId);
    }

    $participants = json_decode($room->participants, true);
    return ChatAccess::canAccessRoom($user, (string) $roomId, is_array($participants) ? $participants : []);
}, ['guards' => ['web', 'sanctum']]);



Broadcast::channel('user.notifications.{userId}', function ($user, $userId) {
    // Own channel
    if ((string) $user->id === (string) $userId) {
        return true;
    }

    // Staff with the Admin chat permission listens on the effective Admin channel.
    $adminId = (string) (ChatAccess::effectiveUserId($user) ?? '');
    if ((string) $userId === $adminId && ChatAccess::hasAdminAccess($user)) {
        return true;
    }

    return false;
}, ['guards' => ['web', 'sanctum']]);
