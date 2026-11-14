<?php

namespace App\Repositories\Admin;

use App\Models\Message;
use App\Models\ChatRoom;
use App\Models\User;
use App\Services\ChatAccess;
use Exception;
use Spatie\Permission\Models\Role;
use App\Exceptions\ExceptionHandler;
use Prettus\Repository\Eloquent\BaseRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatRepository extends BaseRepository
{
    public function model()
    {
        return Message::class;
    }


    public function getEffectiveChatUserId(): int
    {
        return (int) (ChatAccess::effectiveUserId(auth()->user()) ?? auth()->id());
    }

    /**
     * Get all chat-relevant roles from Spatie.
     */
    public function getRoles()
    {
        return Role::where('status', true)->whereNot('name', 'admin')->withCount('users')->orderBy('name', 'ASC')->get();
    }

    /**
     * Get recent chats for the effective chat user (admin ID for custom-role staff).
     */
    public function getRecentChats()
    {
        $currentUserId = $this->getEffectiveChatUserId();

        $candidateRooms = ChatRoom::orderBy('updated_at', 'desc')
            ->limit(500)
            ->get();
        $rideContexts = ChatAccess::rideContextsForRooms($candidateRooms);
        $rooms = $candidateRooms
            ->filter(function ($room) use ($currentUserId) {
                $participants = array_map('strval', $room->participants ?? []);
                return in_array((string) $currentUserId, $participants, true);
            })
            ->merge($candidateRooms->filter(function ($room) use ($currentUserId, $rideContexts) {
                $participants = array_map('strval', $room->participants ?? []);
                return !in_array((string) $currentUserId, $participants, true)
                    && (isset($rideContexts[$room->room_id])
                        || (ChatAccess::isPotentialSupportRoom($room->room_id)
                            && ChatAccess::supportContext($room->room_id, $room->participants) !== null));
            }))
            ->unique('room_id')
            ->sortByDesc('updated_at')
            ->take(50);

        $roomIds = $rooms->pluck('room_id')->all();
        $latestMessages = empty($roomIds)
            ? collect()
            : Message::whereIn('id', Message::query()
                ->selectRaw('MAX(id)')
                ->whereIn('room_id', $roomIds)
                ->groupBy('room_id'))
                ->get()
                ->keyBy('room_id');

        $recentChats = [];
        foreach ($rooms as $room) {
            $participants = array_map('strval', $room->participants ?? []);
            $ride = $rideContexts[$room->room_id] ?? null;
            $lastMessage = $latestMessages->get($room->room_id);

            if ($ride) {
                $rider = User::with('profile_image')->find($ride['rider_id']);
                $driver = User::with('profile_image')->find($ride['driver_id']);
                if (!$rider || !$driver) {
                    continue;
                }

                $replyUserId = (int) $ride['rider_id'];
                if ($lastMessage) {
                    if (in_array((int) $lastMessage->sender_id, [$ride['rider_id'], $ride['driver_id']], true)) {
                        $replyUserId = (int) $lastMessage->sender_id;
                    } elseif ((int) $lastMessage->sender_id === $currentUserId
                        && in_array((int) $lastMessage->receiver_id, [$ride['rider_id'], $ride['driver_id']], true)) {
                        $replyUserId = (int) $lastMessage->receiver_id;
                    }
                }

                $replyUser = $replyUserId === (int) $ride['driver_id'] ? $driver : $rider;
                $recentChats[$room->room_id] = [
                    'user_id'      => $replyUserId,
                    'name'         => $rider->name . ' / ' . $driver->name,
                    'image'        => $replyUser->profile_image?->original_url ?? null,
                    'role'         => 'Rider and Driver - Ride #' . $ride['ride_id'],
                    'chat_id'      => $room->room_id,
                    'last_message' => $room->last_message,
                    'unread_count' => $room->unread_count[(string) $currentUserId] ?? 0,
                    'updated_at'   => $room->updated_at,
                ];
                continue;
            }

            $support = ChatAccess::isPotentialSupportRoom($room->room_id)
                ? ChatAccess::supportContext($room->room_id, $participants)
                : null;
            if (!$support) {
                continue;
            }

            $user = User::with('profile_image')->find($support['user_id']);
            if ($user) {
                $replyUserId = (int) $support['user_id'];
                $recentChats[$room->room_id] = [
                    'user_id'      => $replyUserId,
                    'name'         => $user->name,
                    'image'        => $user->profile_image?->original_url ?? null,
                    'role'         => $user->getRoleNames()->first() ?? 'User',
                    'chat_id'      => $room->room_id,
                    'last_message' => $room->last_message,
                    'unread_count' => $room->unread_count[(string) $currentUserId] ?? 0,
                    'updated_at'   => $room->updated_at,
                ];
            }
        }

        return array_values($recentChats);
    }

    /**
     * Get users by role ID (uses effective chat user context).
     */
    public function getUsersByRole($roleId)
    {
        $role = Role::find($roleId);
        if (!$role) return collect([]);

        $currentUserId = $this->getEffectiveChatUserId();

        $users = User::role($role->name)
            ->where('users.id', '!=', $currentUserId)
            ->whereNull('deleted_at')
            ->with(['profile_image'])
            ->get();

        $rooms = ChatRoom::orderBy('updated_at', 'desc')->limit(500)->get();
        $rideContexts = ChatAccess::rideContextsForRooms($rooms);
        $roomLookup = [];
        foreach ($rooms as $room) {
            $participants = array_map('strval', $room->participants ?? []);
            if ($ride = ($rideContexts[$room->room_id] ?? null)) {
                $roomLookup[$ride['rider_id']] = $room->updated_at;
                $roomLookup[$ride['driver_id']] = $room->updated_at;
            } elseif (in_array((string) $currentUserId, $participants, true)) {
                $otherId = collect($participants)->first(fn ($id) => $id !== (string) $currentUserId);
                if ($otherId) {
                    $roomLookup[$otherId] = $room->updated_at;
                }
            }
        }

        foreach ($users as $user) {
            $user->last_interaction = $roomLookup[$user->id] ?? null;
        }

        return $users;
    }

    /**
     * Get total unread messages for the effective chat user across all rooms.
     */
    public function getTotalUnreadCount()
    {
        $userId = (string) $this->getEffectiveChatUserId();
        $rooms  = ChatRoom::where('participants', 'like', "%\"{$userId}\"%")->get();

        $total = 0;
        foreach ($rooms as $room) {
            $total += $room->unread_count[$userId] ?? 0;
        }

        return $total;
    }
}
