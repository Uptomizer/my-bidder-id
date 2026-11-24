<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    /**
     * Display the admin executive overview and KPIs.
     */
    public function index(): Response
    {
        $now = Carbon::now();

        $totalAuctions = Auction::count();
        $activeAuctions = Auction::where('status', 'active')
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->count();

        $totalBids = Bid::count();
        $bidsToday = Bid::whereDate('created_at', Carbon::today())->count();

        $totalUsers = User::where('role', 'user')->count();
        $activeUsers = User::where('role', 'user')->where('status', 'active')->count();

        $totalRevenue = Payment::where('status', 'verified')->sum('amount');
        $pendingPaymentsCount = Payment::where('status', 'pending')->count();

        // Conversion rate: ended auctions that have a winner
        $endedAuctionsCount = Auction::where(function ($q) use ($now) {
            $q->where('status', 'ended')
                ->orWhere('status', 'settled')
                ->orWhere('end_time', '<=', $now);
        })->count();

        $soldAuctionsCount = Auction::whereNotNull('winner_id')->count();
        $conversionRate = $endedAuctionsCount > 0
            ? round(($soldAuctionsCount / $endedAuctionsCount) * 100, 1)
            : 0;

        // Recent bids for quick audit (paginated 6 per page on frontend)
        $recentBids = Bid::with(['user', 'auction'])
            ->latest('created_at')
            ->limit(24)
            ->get()
            ->map(function (Bid $bid) {
                return [
                    'id' => $bid->id,
                    'amount' => $bid->amount,
                    'bidder_name' => $bid->user->name,
                    'bidder_email' => $bid->user->email,
                    'auction_title' => $bid->auction->title,
                    'auction_slug' => $bid->auction->slug,
                    'status' => $bid->status,
                    'created_at' => $bid->created_at->diffForHumans(),
                ];
            });

        // Pending payments for quick validation (paginated 6 per page on frontend)
        $pendingPayments = Payment::with(['auction', 'user'])
            ->where('status', 'pending')
            ->latest()
            ->limit(24)
            ->get()
            ->map(function (Payment $payment) {
                return [
                    'id' => $payment->id,
                    'auction_title' => $payment->auction->title,
                    'user_name' => $payment->user->name,
                    'amount' => $payment->amount,
                    'proof_image' => $payment->proof_image,
                    'bank_name' => $payment->bank_name,
                    'created_at' => $payment->created_at->format('d M H:i'),
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'total_auctions' => $totalAuctions,
                'active_auctions' => $activeAuctions,
                'total_bids' => $totalBids,
                'bids_today' => $bidsToday,
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_revenue' => $totalRevenue,
                'pending_payments' => $pendingPaymentsCount,
                'conversion_rate' => $conversionRate,
            ],
            'recentBids' => $recentBids,
            'pendingPayments' => $pendingPayments,
        ]);
    }
}
