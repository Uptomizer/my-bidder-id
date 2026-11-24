<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display all notifications for authenticated user.
     */
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(6);

        return Inertia::render('User/Notifications', [
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse|RedirectResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        if ($notification->url) {
            return redirect($notification->url);
        }

        return back()->with('success', 'Notifikasi ditandai dibaca.');
    }

    /**
     * Get unread notification count and 5 latest notifications for real-time navbar pop-up.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $user
            ? $user->notifications()->where('is_read', false)->count()
            : 0;

        $recent = $user
            ? $user->notifications()
                ->latest()
                ->limit(5)
                ->get(['id', 'type', 'title', 'message', 'url', 'is_read', 'created_at'])
            : [];

        return response()->json([
            'unread_count' => $count,
            'recent_notifications' => $recent,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse|RedirectResponse
    {
        $request->user()
            ->notifications()
            ->where('is_read', false)
            ->update(['is_read' => true]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Semua notifikasi ditandai dibaca.');
    }
}
