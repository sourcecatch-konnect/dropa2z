<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Repositories\Admin\NotificationRepository;

class NotificationController extends Controller
{
    protected $repository;

    public function __construct(NotificationRepository $repository)
    {
        $this->repository = $repository;
    }

    public function index(Request $request)
    {
        $userId = getCurrentUserId();
        $notifications = $this->repository->find($userId)->notifications()->latest('created_at')->paginate($request->paginate ?? 10);
        return view('admin.notification.index', compact('notifications'));
    }

    public function poll()
    {
        $notifications = auth()->user()
            ->unreadNotifications()
            ->where('type', '!=', 'Modules\\Taxido\\Notifications\\SOSAlertNotification')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'DropA2Z',
                'message' => $notification->data['message'] ?? 'You have a new notification.',
                'url' => $notification->data['url'] ?? route('admin.notification.index'),
                'time' => $notification->created_at->diffForHumans(),
            ])
            ->values();

        return response()->json([
            'count' => $notifications->count(),
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request)
    {
        return $this->repository->markAsRead($request);
    }

    public function destroy(Request $request)
    {
        return $this->repository->destroy($request);
    }

    public function clearAll()
    {
        return $this->repository->clearAll();
    }
}
