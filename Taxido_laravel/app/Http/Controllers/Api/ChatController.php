<?php

namespace App\Http\Controllers\Api;

use App\Models\Message;
use App\Models\ChatRoom;
use App\Models\User;
use App\Services\SendNotificationService;
use Exception;
use Illuminate\Http\Request;
use App\Events\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Events\ChatUnreadCountUpdated;
use App\Repositories\Admin\ChatRepository;
use App\Http\Resources\Api\MessageResource;
use App\Services\ChatAccess;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    protected $repository;

    public function __construct(ChatRepository $repository)
    {
        $this->repository = $repository;
    }

    private function getEffectiveChatUser(): User
    {
        return ChatAccess::effectiveUser(auth()->user()) ?? auth()->user();
    }

    public function send(Request $request)
    {
        $request->validate([
            'room_id'     => ['required', 'string', 'max:100', 'regex:/^\d+(?:_\d+){1,2}$/'],
            'receiver_id' => 'required|integer',
            'message'     => 'nullable|string',
            'images'      => 'nullable|array',
            'images.*'    => 'image|max:2048',
        ]);

        $authenticatedUser = auth()->user();
        $user        = $this->getEffectiveChatUser();
        $receiverId  = (int) $request->receiver_id;
        $room = ChatRoom::where('room_id', $request->room_id)->first();

        // Older Rider/Driver builds used the literal ID 1 for support. The
        // production Admin account is now resolved dynamically; bridge those
        // existing app rooms to the real Admin without losing their history.
        if (!ChatAccess::hasAdminAccess($authenticatedUser) && $receiverId === 1) {
            $support = ChatAccess::supportContext(
                $request->room_id,
                $room?->participants ?? [(string) $authenticatedUser->id, '1']
            );
            if ($support && $support['legacy_alias']) {
                $receiverId = (int) $support['admin_id'];
            }
        }

        $canSend = $room
            ? ChatAccess::canSendToRoom($authenticatedUser, $request->room_id, $room->participants, (int) $user->id, $receiverId)
            : ChatAccess::canInitiateSend($authenticatedUser, $request->room_id, (int) $user->id, $receiverId);

        abort_unless($canSend, 403, 'You are not a participant in this chat.');

        $hasImages   = $request->hasFile('images') && count($request->file('images')) > 0;
        $messageText = $hasImages ? null : $request->message;
        $receiver = User::findOrFail($receiverId);

        $message = Message::create([
            'room_id'     => $request->room_id,
            'sender_id'   => $user->id,
            'receiver_id' => $receiverId,
            'sender_name' => $user->name,
            'receiver_name' => $receiver->name,
            'message'     => $request->message,
            'images'      => null,
            'is_read'     => false,
        ]);

        if ($hasImages) {
            foreach ($request->file('images') as $file) {
                $message->addMedia($file)->toMediaCollection('chat_images');
            }
        }

        $message    = $message->fresh();
        $imagesData = $message->images;
        $room = $room ?? new ChatRoom(['room_id' => $request->room_id]);
        $participants = array_values(array_unique(array_map('strval', $room->participants ?? [])));
        $participants[] = (string) $user->id;
        $participants[] = (string) $receiverId;
        $room->participants = array_values(array_unique($participants));
        $room->last_message = [
            'message' => $messageText,
            'images'  => $imagesData
        ];
        $room->updated_at = now();
        ChatAccess::addAdminObserver($room);
        $room->save();

        $room->incrementUnread($receiverId);
        broadcast(new ChatMessageSent($message));

        $receiverTotalUnread = ChatRoom::where('participants', 'like', "%\"{$receiverId}\"%")
            ->get()
            ->sum(fn($r) => $r->unread_count[(string) $receiverId] ?? 0);

        broadcast(new ChatUnreadCountUpdated(
            $receiverId,
            $receiverTotalUnread,
            $room->room_id,
            $room->unread_count[(string) $receiverId] ?? 0,
            $message->message ?? (count($message->images ?? []) > 0 ? 'Sent an image' : '')
        ));

        if ($receiver) {
            $notificationText = $message->message ?? (count($message->images ?? []) > 0 ? 'Sent an image' : 'New Message');
            $imageUrl         = !empty($imagesData) ? reset($imagesData) : null;

            $pushData = [
                'type'        => 'chat',
                'room_id'     => $room->room_id,
                'sender_id'   => (string) $user->id,
                'receiver_id' => (string) $receiver->id,
            ];

            if ($imageUrl) {
                $pushData['image'] = $imageUrl;
            }

            try {
                SendNotificationService::sendPushNotification(
                    $receiver,
                    'chat-message-received',
                    [
                        'sender_name' => $user->name,
                        'message'     => $notificationText
                    ],
                    $pushData
                );
            } catch (Exception $e) {
                Log::error("Chat Push Notification Error: " . $e->getMessage());
            }
        }

        $adminId = (int) (getAdminId() ?? 0);
        if ($adminId > 0 && (int) $user->id !== $adminId
            && ChatAccess::rideContext($room->room_id, $room->participants) !== null) {
            $room->incrementUnread($adminId);
            $adminTotalUnread = ChatRoom::where('participants', 'like', "%\"{$adminId}\"%")
                ->get()
                ->sum(fn ($item) => $item->unread_count[(string) $adminId] ?? 0);

            broadcast(new ChatUnreadCountUpdated(
                $adminId,
                $adminTotalUnread,
                $room->room_id,
                $room->unread_count[(string) $adminId] ?? 0,
                $message->message ?? (count($message->images ?? []) > 0 ? 'Sent an image' : '')
            ));
        }

        return response()->json([
            'status'       => true,
            'room_id'      => $room->room_id,
            'data'         => $message,
            'total_unread' => $this->repository->getTotalUnreadCount()
        ]);
    }

    public function support()
    {
        $admin = getAdmin();

        abort_unless($admin, 503, 'Chat support is not configured.');

        return response()->json([
            'status' => true,
            'data' => [
                'admin_id' => (int) $admin->id,
                'admin_name' => $admin->name,
            ],
        ]);
    }

    public function clear(Request $request)
    {
        $request->validate([
            'room_id' => 'required|string'
        ]);

        $authenticatedUser = auth()->user();
        $effectiveUser = $this->getEffectiveChatUser();
        $userId        = $effectiveUser->id;
        $room = ChatRoom::where('room_id', $request->room_id)->first();
        abort_unless(
            $room
                ? ChatAccess::canAccessRoom($authenticatedUser, $request->room_id, $room->participants)
                : ChatAccess::canAccessRoomCandidate($authenticatedUser, $request->room_id),
            403,
            'You are not a participant in this chat.'
        );
        $messages      = Message::where('room_id', $request->room_id)->get();

        foreach ($messages as $msg) {
            $clearedBy = $msg->cleared_by ?? [];
            if (!in_array($userId, $clearedBy)) {
                $clearedBy[] = (string) $userId;
                $msg->update(['cleared_by' => $clearedBy]);
            }
        }

        return response()->json([
            'status'  => true,
            'message' => 'Chat cleared'
        ]);
    }

    public function messages(Request $request)
    {
        $request->validate([
            'room_id' => 'required|string',
            'after_id' => 'sometimes|integer|min:0',
        ]);

        $authenticatedUser = auth()->user();
        $effectiveUser = $this->getEffectiveChatUser();
        $userId        = $effectiveUser->id;

        $room = ChatRoom::where('room_id', $request->room_id)->first();
        abort_unless(
            $room
                ? ChatAccess::canAccessRoom($authenticatedUser, $request->room_id, $room->participants)
                : ChatAccess::canAccessRoomCandidate($authenticatedUser, $request->room_id),
            403,
            'You are not a participant in this chat.'
        );

        if ($room) {
            $participantsBefore = array_values(array_map('strval', $room->participants ?? []));
            if (ChatAccess::hasAdminAccess($authenticatedUser)) {
                ChatAccess::addAdminObserver($room);
            }
            $participantsAfter = array_values(array_map('strval', $room->participants ?? []));
            if ($participantsAfter !== $participantsBefore) {
                $room->save();
            }

            $hasUnreadMessages = Message::where('room_id', $room->room_id)
                ->where('receiver_id', $userId)
                ->where('is_read', false)
                ->exists();
            $roomUnreadCount = (int) ($room->unread_count[(string) $userId] ?? 0);
            if ($roomUnreadCount > 0 || $hasUnreadMessages) {
                $room->markAsRead($userId);
                broadcast(new ChatUnreadCountUpdated(
                    $userId,
                    $this->repository->getTotalUnreadCount(),
                    $room->room_id,
                    0
                ));
            }
        }

        $messageQuery = Message::where('room_id', $request->room_id);
        if ($request->filled('after_id')) {
            $messages = $messageQuery
                ->where('id', '>', (int) $request->input('after_id'))
                ->orderBy('id', 'asc')
                ->limit(100)
                ->get();
        } else {
            // Return the newest page in chronological order so a chat with
            // over 100 messages still opens at the latest conversation.
            $messages = $messageQuery
                ->orderBy('id', 'desc')
                ->limit(100)
                ->get()
                ->reverse()
                ->values();
        }

        return response()->json([
            'status'       => true,
            'data'         => MessageResource::collection($messages),
            'total_unread' => $this->repository->getTotalUnreadCount()
        ]);
    }

    /**
     * Get total unread count for the header.
     */
    public function unreadCount()
    {
        return response()->json([
            'status'       => true,
            'total_unread' => $this->repository->getTotalUnreadCount()
        ]);
    }
}
