<?php

namespace App\Services;

use App\Models\ChatRoom;
use App\Models\User;
use Modules\Taxido\Models\Ride;
use Modules\Taxido\Models\RideRequest;

/**
 * Centralizes chat-room access rules shared by the API and private channels.
 */
class ChatAccess
{
    public static function hasAdminAccess(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        $isCustomRole = $user->roles()
            ->whereNull('module')
            ->where('system_reserve', false)
            ->exists();

        return $isCustomRole && $user->can('chat.index');
    }

    public static function effectiveUser(?User $user): ?User
    {
        if (!$user) {
            return null;
        }

        if (self::hasAdminAccess($user) && !$user->hasRole('admin')) {
            return getAdmin() ?? $user;
        }

        return $user;
    }

    public static function effectiveUserId(?User $user): ?int
    {
        return self::effectiveUser($user)?->id;
    }

    /**
     * Return ride/rider/driver IDs only for a room whose two app participants
     * match a persisted ride or ride request. Ride room IDs are sorted as
     * ride_id_rider_id_driver_id by the mobile clients.
     */
    public static function rideContext(string $roomId, ?array $participants = null): ?array
    {
        $roomIds = array_map('intval', explode('_', $roomId));
        if (count($roomIds) !== 3 || count(array_filter($roomIds, fn ($id) => $id > 0)) !== 3) {
            return null;
        }

        $adminId = (int) (getAdminId() ?? 0);
        $participantIds = $participants === null
            ? null
            : array_values(array_unique(array_map('intval', $participants)));

        if ($participantIds !== null) {
            $appIds = array_values(array_filter($participantIds, fn ($id) => $id > 0 && $id !== $adminId));
            if (count($appIds) !== 2) {
                return null;
            }

            $context = self::getRideContextForPair($roomIds, $appIds[0], $appIds[1]);
            if ($context) {
                return $context;
            }

            return null;
        }

        // For a new room, infer the app pair from role assignments, then match
        // the remaining room ID against a ride or assigned ride request.
        $users = User::whereIn('id', array_unique($roomIds))->with('roles')->get()->keyBy('id');
        foreach ([0, 1, 2] as $firstIndex) {
            foreach ([0, 1, 2] as $secondIndex) {
                if ($firstIndex === $secondIndex) {
                    continue;
                }

                $firstUser = $users->get($roomIds[$firstIndex]);
                $secondUser = $users->get($roomIds[$secondIndex]);
                if (!$firstUser || !$secondUser || (int) $firstUser->id === (int) $secondUser->id) {
                    continue;
                }

                $firstRoles = $firstUser->roles->pluck('name')->map(fn ($role) => strtolower($role));
                $secondRoles = $secondUser->roles->pluck('name')->map(fn ($role) => strtolower($role));
                if ($firstRoles->contains('rider') && $secondRoles->contains('driver')) {
                    $riderId = (int) $firstUser->id;
                    $driverId = (int) $secondUser->id;
                } elseif ($secondRoles->contains('rider') && $firstRoles->contains('driver')) {
                    $riderId = (int) $secondUser->id;
                    $driverId = (int) $firstUser->id;
                } else {
                    continue;
                }

                $rideId = $roomIds[3 - $firstIndex - $secondIndex];
                if (self::rideMatchesUsers($rideId, $riderId, $driverId)) {
                    return ['ride_id' => $rideId, 'rider_id' => $riderId, 'driver_id' => $driverId];
                }
            }
        }

        return null;
    }

    /** Resolve many recent ride rooms with a bounded set of database queries. */
    public static function rideContextsForRooms(iterable $rooms): array
    {
        $candidates = [];
        $allUserIds = [];
        $adminId = (int) (getAdminId() ?? 0);

        foreach ($rooms as $room) {
            $roomIds = array_map('intval', explode('_', (string) $room->room_id));
            if (count($roomIds) !== 3 || count(array_filter($roomIds, fn ($id) => $id > 0)) !== 3) {
                continue;
            }

            $participants = array_values(array_unique(array_map('intval', $room->participants ?? [])));
            $appIds = array_values(array_filter($participants, fn ($id) => $id > 0 && $id !== $adminId));
            if ($participants && count($appIds) !== 2) {
                continue;
            }

            $candidates[(string) $room->room_id] = [
                'room_ids' => $roomIds,
                'app_ids' => $participants ? $appIds : null,
                'tuples' => [],
            ];
            $allUserIds = array_merge($allUserIds, $roomIds, $appIds);
        }

        if (!$candidates) {
            return [];
        }

        $users = User::whereIn('id', array_values(array_unique($allUserIds)))
            ->with('roles')
            ->get()
            ->keyBy('id');
        $rolesByUser = [];
        foreach ($users as $user) {
            $rolesByUser[(int) $user->id] = $user->roles->pluck('name')->map(fn ($role) => strtolower($role))->all();
        }

        foreach ($candidates as &$candidate) {
            $indices = [];
            if ($candidate['app_ids'] !== null) {
                $indices[] = [$candidate['app_ids'][0], $candidate['app_ids'][1], $candidate['room_ids']];
            } else {
                for ($firstIndex = 0; $firstIndex < 3; $firstIndex++) {
                    for ($secondIndex = 0; $secondIndex < 3; $secondIndex++) {
                        if ($firstIndex === $secondIndex) {
                            continue;
                        }
                        $rideIndex = 3 - $firstIndex - $secondIndex;
                        $indices[] = [
                            $candidate['room_ids'][$firstIndex],
                            $candidate['room_ids'][$secondIndex],
                            [$candidate['room_ids'][$rideIndex]],
                        ];
                    }
                }
            }

            foreach ($indices as [$firstUserId, $secondUserId, $possibleRideIds]) {
                $firstRoles = $rolesByUser[(int) $firstUserId] ?? [];
                $secondRoles = $rolesByUser[(int) $secondUserId] ?? [];
                if (in_array('rider', $firstRoles, true) && in_array('driver', $secondRoles, true)) {
                    $riderId = (int) $firstUserId;
                    $driverId = (int) $secondUserId;
                } elseif (in_array('driver', $firstRoles, true) && in_array('rider', $secondRoles, true)) {
                    $riderId = (int) $secondUserId;
                    $driverId = (int) $firstUserId;
                } else {
                    continue;
                }

                foreach ($possibleRideIds as $possibleRideId) {
                    $candidate['tuples'][] = [(int) $possibleRideId, $riderId, $driverId];
                }
            }
        }
        unset($candidate);

        $possibleRideIds = [];
        foreach ($candidates as $candidate) {
            foreach ($candidate['tuples'] as [$rideId]) {
                $possibleRideIds[] = $rideId;
            }
        }
        $possibleRideIds = array_values(array_unique($possibleRideIds));
        if (!$possibleRideIds) {
            return [];
        }

        $validPairs = [];
        foreach (Ride::withTrashed()->whereIn('id', $possibleRideIds)->get(['id', 'rider_id', 'driver_id']) as $ride) {
            $validPairs[$ride->id . ':' . $ride->rider_id . ':' . $ride->driver_id] = true;
        }
        foreach (RideRequest::withTrashed()->whereIn('id', $possibleRideIds)->get(['id', 'rider_id', 'driver_id', 'current_driver_id']) as $request) {
            foreach ([$request->driver_id, $request->current_driver_id] as $driverId) {
                if ($driverId) {
                    $validPairs[$request->id . ':' . $request->rider_id . ':' . $driverId] = true;
                }
            }
        }

        $contexts = [];
        foreach ($candidates as $roomId => $candidate) {
            foreach ($candidate['tuples'] as [$rideId, $riderId, $driverId]) {
                if (isset($validPairs[$rideId . ':' . $riderId . ':' . $driverId])) {
                    $contexts[$roomId] = ['ride_id' => $rideId, 'rider_id' => $riderId, 'driver_id' => $driverId];
                    break;
                }
            }
        }

        return $contexts;
    }

    public static function isSupportRoom(string $roomId, ?array $participants = null): bool
    {
        return self::supportContext($roomId, $participants) !== null;
    }

    public static function supportContext(string $roomId, ?array $participants = null): ?array
    {
        $ids = array_map('intval', explode('_', $roomId));
        $adminId = (int) (getAdminId() ?? 0);
        if (count($ids) !== 2 || count(array_filter($ids, fn ($id) => $id > 0)) !== 2) {
            return null;
        }

        $supportUserId = null;
        $supportAddresses = array_values(array_unique(array_filter([$adminId, 1])));
        foreach ($ids as $id) {
            if (in_array($id, $supportAddresses, true)) {
                $otherId = $ids[0] === $id ? $ids[1] : $ids[0];
                if (!in_array($otherId, $supportAddresses, true)) {
                    $supportUserId = $otherId;
                    break;
                }
            }
        }

        if (!$supportUserId) {
            return null;
        }

        $supportUser = User::find($supportUserId);
        $supportRoles = $supportUser?->getRoleNames()->map(fn ($role) => strtolower($role)) ?? collect();
        if (!$supportUser || (!$supportRoles->contains('rider') && !$supportRoles->contains('driver'))) {
            return null;
        }

        if ($participants !== null) {
            $actual = array_values(array_unique(array_map('intval', $participants)));
            $allowed = array_values(array_unique([$supportUserId, $adminId, 1]));
            if (!in_array($supportUserId, $actual, true) || array_diff($actual, $allowed) !== []) {
                return null;
            }
        }

        return [
            'user_id' => $supportUserId,
            'admin_id' => $adminId,
            'legacy_alias' => $adminId !== 1 && in_array(1, $ids, true) && !in_array($adminId, $ids, true),
        ];
    }

    public static function isPotentialSupportRoom(string $roomId): bool
    {
        $ids = array_map('intval', explode('_', $roomId));
        $supportAddresses = array_values(array_unique(array_filter([(int) (getAdminId() ?? 0), 1])));
        return count($ids) === 2 && count(array_filter($ids, fn ($id) => $id > 0)) === 2
            && count(array_intersect($ids, $supportAddresses)) > 0;
    }

    public static function canAccessRoom(User $user, string $roomId, ?array $participants): bool
    {
        $effectiveId = self::effectiveUserId($user);
        $participantIds = array_values(array_unique(array_map('strval', $participants ?? [])));

        if (self::hasAdminAccess($user)) {
            return ($effectiveId !== null && in_array((string) $effectiveId, $participantIds, true))
                || self::isSupportRoom($roomId, $participants)
                || self::rideContext($roomId, $participants) !== null;
        }

        return in_array((string) $user->id, $participantIds, true)
            && (self::isSupportRoom($roomId, $participants)
                || self::rideContext($roomId, $participants) !== null);
    }

    public static function canAccessRoomCandidate(User $user, string $roomId): bool
    {
        $effectiveId = self::effectiveUserId($user);
        $ids = array_map('strval', explode('_', $roomId));

        if (self::hasAdminAccess($user)) {
            return self::isSupportRoom($roomId)
                || self::rideContext($roomId) !== null
                || ($effectiveId !== null && count($ids) === 2 && in_array((string) $effectiveId, $ids, true));
        }

        $support = self::supportContext($roomId);
        if ($support) {
            return (int) $user->id === $support['user_id'];
        }

        $ride = self::rideContext($roomId);
        return $ride !== null
            && in_array((int) $user->id, [$ride['rider_id'], $ride['driver_id']], true);
    }

    public static function canSendToRoom(
        User $authenticatedUser,
        string $roomId,
        ?array $participants,
        int $senderId,
        int $receiverId
    ): bool {
        $receiver = User::find($receiverId);
        if (!$receiver || $receiverId === $senderId) {
            return false;
        }

        if (self::hasAdminAccess($authenticatedUser)) {
            if ($participants !== null) {
                $ids = array_map('strval', $participants);
                return self::canAccessRoom($authenticatedUser, $roomId, $participants)
                    && in_array((string) $receiverId, $ids, true)
                    && $receiverId !== (int) self::effectiveUserId($authenticatedUser);
            }

            $ids = array_map('intval', explode('_', $roomId));
            sort($ids);
            $expected = [$senderId, $receiverId];
            sort($expected);
            return count($ids) === 2 && $ids === $expected
                && $senderId === (int) (getAdminId() ?? 0)
                && !$receiver->hasRole('admin');
        }

        if ($senderId !== (int) $authenticatedUser->id) {
            return false;
        }

        $context = self::rideContext($roomId, $participants ?? [$senderId, $receiverId]);
        if ($context) {
            return in_array($senderId, [$context['rider_id'], $context['driver_id']], true)
                && in_array($receiverId, [$context['rider_id'], $context['driver_id']], true)
                && $receiverId !== $senderId;
        }

        $roomParticipants = $participants ?? [$senderId, $receiverId];
        $support = self::supportContext($roomId, $roomParticipants);
        return $support !== null
            && $receiverId === (int) $support['admin_id']
            && $senderId === (int) $support['user_id'];
    }

    public static function canInitiateSend(User $authenticatedUser, string $roomId, int $senderId, int $receiverId): bool
    {
        if (self::hasAdminAccess($authenticatedUser)) {
            return self::canSendToRoom($authenticatedUser, $roomId, null, $senderId, $receiverId);
        }

        return self::canSendToRoom($authenticatedUser, $roomId, null, $senderId, $receiverId);
    }

    public static function addAdminObserver(ChatRoom $room): void
    {
        $adminId = (int) (getAdminId() ?? 0);
        if ($adminId < 1
            || (self::rideContext($room->room_id, $room->participants) === null
                && self::supportContext($room->room_id, $room->participants) === null)) {
            return;
        }

        $participants = array_values(array_unique(array_map('strval', $room->participants ?? [])));
        if (!in_array((string) $adminId, $participants, true)) {
            $participants[] = (string) $adminId;
            $room->participants = $participants;
        }
    }

    private static function rideMatchesUsers(int $rideId, int $riderId, int $driverId): bool
    {
        $rideExists = Ride::withTrashed()
            ->whereKey($rideId)
            ->where('rider_id', $riderId)
            ->where('driver_id', $driverId)
            ->exists();

        if ($rideExists) {
            return true;
        }

        return RideRequest::withTrashed()
            ->whereKey($rideId)
            ->where('rider_id', $riderId)
            ->where(function ($query) use ($driverId) {
                $query->where('driver_id', $driverId)
                    ->orWhere('current_driver_id', $driverId);
            })
            ->exists();
    }

    private static function getRideContextForPair(array $roomIds, int $firstUserId, int $secondUserId): ?array
    {
        $users = User::whereIn('id', [$firstUserId, $secondUserId])->with('roles')->get()->keyBy('id');
        if ($users->count() !== 2) {
            return null;
        }

        $firstRoles = $users->get($firstUserId)->roles->pluck('name')->map(fn ($role) => strtolower($role));
        $secondRoles = $users->get($secondUserId)->roles->pluck('name')->map(fn ($role) => strtolower($role));
        if ($firstRoles->contains('rider') && $secondRoles->contains('driver')) {
            $riderId = $firstUserId;
            $driverId = $secondUserId;
        } elseif ($secondRoles->contains('rider') && $firstRoles->contains('driver')) {
            $riderId = $secondUserId;
            $driverId = $firstUserId;
        } else {
            return null;
        }

        $ride = Ride::withTrashed()
            ->whereIn('id', $roomIds)
            ->where('rider_id', $riderId)
            ->where('driver_id', $driverId)
            ->first(['id']);

        $rideId = $ride?->id;
        if (!$rideId) {
            $rideRequest = RideRequest::withTrashed()
                ->whereIn('id', $roomIds)
                ->where('rider_id', $riderId)
                ->where(function ($query) use ($driverId) {
                    $query->where('driver_id', $driverId)
                        ->orWhere('current_driver_id', $driverId);
                })
                ->first(['id']);
            $rideId = $rideRequest?->id;
        }

        return $rideId
            ? ['ride_id' => (int) $rideId, 'rider_id' => $riderId, 'driver_id' => $driverId]
            : null;
    }
}
