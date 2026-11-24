<?php

namespace App\Http\Middleware;

use App\Models\Auction;
use Closure;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Handle incoming request and support silent background JSON polling via X-Live-Poll header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->header('X-Live-Poll') === '1') {
            $request->headers->set('X-Inertia', 'true');
            $request->headers->set('X-Inertia-Version', (string) $this->version($request));
        }

        // Automatically close any expired auctions and finalize winners on all requests & polls
        Auction::closeEndedAuctions();

        return parent::handle($request, $next);
    }

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'status' => $user->status,
                    'is_admin' => $user->isAdmin(),
                ] : null,
                'unread_notifications' => $user ? $user->notifications()->where('is_read', false)->count() : 0,
                'recent_notifications' => $user
                    ? $user->notifications()->latest()->limit(5)->get(['id', 'type', 'title', 'message', 'url', 'is_read', 'created_at'])
                    : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'global_categories' => fn () => \App\Models\Category::all(['id', 'name', 'slug']),
        ];
    }
}
