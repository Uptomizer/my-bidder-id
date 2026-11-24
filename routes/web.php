<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AuctionManagementController;
use App\Http\Controllers\Admin\BidVerificationController;
use App\Http\Controllers\Admin\CategoryManagementController;
use App\Http\Controllers\Admin\PaymentValidationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\AuctionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserDashboardController;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Marketplace Landing Page (100% Real Live DB Auctions, Zero Dummy)
Route::get('/', function () {
    Auction::closeEndedAuctions();
    $now = Carbon::now();

    // 1. Real LIVE Auctions from Database
    $liveAuctions = Auction::with(['category', 'validBids.user'])
        ->withCount('validBids')
        ->where('status', 'active')
        ->where('start_time', '<=', $now)
        ->where('end_time', '>', $now)
        ->latest('updated_at')
        ->get()
        ->map(function (Auction $auction) {
            $highestBid = $auction->validBids->first();

            return [
                'id' => 'db-' . $auction->id,
                'db_id' => $auction->id,
                'slug' => $auction->slug,
                'title' => $auction->title,
                'shortDescription' => $auction->description,
                'categoryId' => $auction->category?->slug ?? 'all',
                'categoryLabel' => $auction->category?->name ?? 'Koleksi',
                'image' => $auction->images[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
                'openBid' => (int) $auction->starting_price,
                'highestBid' => (int) $auction->current_price,
                'minIncrement' => (int) $auction->min_increment,
                'bidCount' => (int) $auction->valid_bids_count,
                'lastBidder' => $highestBid ? $highestBid->masked_bidder_name : 'Belum ada',
                'endTimeMs' => $auction->end_time->getTimestampMs(),
                'status' => $auction->status,
                'isDatabaseItem' => true,
            ];
        });

    // 2. Real Closed / Settled Auctions from Database
    $closedAuctions = Auction::with(['category', 'winner', 'validBids.user'])
        ->withCount('validBids')
        ->whereIn('status', ['ended', 'settled'])
        ->latest('end_time')
        ->limit(12)
        ->get()
        ->map(function (Auction $auction) {
            return [
                'id' => 'closed-' . $auction->id,
                'db_id' => $auction->id,
                'slug' => $auction->slug,
                'title' => $auction->title,
                'shortDescription' => $auction->description,
                'categoryId' => $auction->category?->slug ?? 'all',
                'categoryLabel' => $auction->category?->name ?? 'Koleksi',
                'image' => $auction->images[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
                'openBid' => (int) $auction->starting_price,
                'highestBid' => (int) $auction->current_price,
                'minIncrement' => (int) $auction->min_increment,
                'bidCount' => (int) $auction->valid_bids_count,
                'lastBidder' => $auction->winner ? $auction->winner->masked_name : 'Tidak ada pemenang',
                'endTimeMs' => $auction->end_time ? $auction->end_time->getTimestampMs() : 0,
                'status' => $auction->status,
                'isDatabaseItem' => true,
            ];
        });

    // 3. Real Categories from Database with real-time live auction count
    $categories = Category::withCount([
        'auctions' => function ($q) use ($now) {
            $q->where('status', 'active')
                ->where('start_time', '<=', $now)
                ->where('end_time', '>', $now);
        },
    ])->get(['id', 'name', 'slug']);

    // 4. Real Stats from Database
    $activeBidsCount = Bid::whereHas('auction', function ($q) use ($now) {
        $q->where('status', 'active')
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now);
    })->where('status', 'valid')->count();

    $stats = [
        'active_count' => $liveAuctions->count(),
        'active_bids' => $activeBidsCount,
        'total_bids' => Bid::where('status', 'valid')->count(),
        'settled_count' => Auction::whereIn('status', ['ended', 'settled'])->count(),
        'total_auctions' => Auction::count(),
    ];

    // 5. Latest Real Bid for ticker stream
    $latestBid = Bid::with(['user', 'auction'])
        ->where('status', 'valid')
        ->latest('created_at')
        ->first();

    $ticker = $latestBid
        ? "{$latestBid->masked_bidder_name} baru saja mengajukan penawaran Rp " . number_format($latestBid->amount, 0, ',', '.') . " pada \"{$latestBid->auction->title}\""
        : "Selamat datang di MyBidder.ID — Pantau dan ikuti lelang online real-time terpercaya";

    return Inertia::render('Landing', [
        'liveAuctions' => $liveAuctions,
        'closedAuctions' => $closedAuctions,
        'categories' => $categories,
        'stats' => $stats,
        'ticker' => $ticker,
    ]);
})->name('home');

// Public Auction Catalog & Detail
Route::get('/auctions', [AuctionController::class, 'index'])->name('auctions.index');
Route::post('/auctions/sync-ended', function () {
    $closedCount = Auction::closeEndedAuctions();
    return response()->json([
        'status' => 'success',
        'closed_count' => $closedCount,
    ]);
})->name('auctions.sync-ended');
Route::get('/auctions/{slug}', [AuctionController::class, 'show'])->name('auctions.show');

// Authenticated User Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // General Dashboard Redirect -> Langsung ke Halaman Utama Daftar Lelang
    Route::get('/dashboard', function () {
        session()->reflash();
        if (request()->user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('home');
    })->name('dashboard');

    // Bidding Actions
    Route::post('/auctions/{id}/bid', [AuctionController::class, 'placeBid'])->name('auctions.bid');

    // User Personal Dashboard & Payments
    Route::get('/my-bids', [UserDashboardController::class, 'myBids'])->name('user.bids');
    Route::get('/my-wins', [UserDashboardController::class, 'myWins'])->name('user.wins');
    Route::post('/auctions/{id}/winner-verification', [UserDashboardController::class, 'submitWinnerVerification'])->name('user.verification.submit');
    Route::post('/auctions/{id}/payment', [UserDashboardController::class, 'submitPayment'])->name('user.payment.submit');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Management Routes
Route::middleware(['auth', 'admin'])->prefix('admin')->as('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Auctions Management
    Route::get('/auctions', [AuctionManagementController::class, 'index'])->name('auctions.index');
    Route::get('/auctions/create', [AuctionManagementController::class, 'create'])->name('auctions.create');
    Route::post('/auctions', [AuctionManagementController::class, 'store'])->name('auctions.store');
    Route::get('/auctions/{id}/edit', [AuctionManagementController::class, 'edit'])->name('auctions.edit');
    Route::put('/auctions/{id}', [AuctionManagementController::class, 'update'])->name('auctions.update');
    Route::delete('/auctions/{id}', [AuctionManagementController::class, 'destroy'])->name('auctions.destroy');
    Route::post('/auctions/{id}/publish', [AuctionManagementController::class, 'publish'])->name('auctions.publish');
    Route::post('/auctions/{id}/close', [AuctionManagementController::class, 'closeAuction'])->name('auctions.close');
    Route::post('/auctions/{id}/approve-winner', [AuctionManagementController::class, 'approveWinner'])->name('auctions.approve-winner');

    // Category Management
    Route::get('/categories', [CategoryManagementController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategoryManagementController::class, 'store'])->name('categories.store');
    Route::delete('/categories/{id}', [CategoryManagementController::class, 'destroy'])->name('categories.destroy');

    // Bid Verification & Moderation
    Route::get('/bids', [BidVerificationController::class, 'index'])->name('bids.index');
    Route::post('/bids/{id}/disqualify', [BidVerificationController::class, 'disqualify'])->name('bids.disqualify');
    Route::post('/bids/{id}/restore', [BidVerificationController::class, 'restore'])->name('bids.restore');
    Route::post('/bids/{id}/set-winner', [BidVerificationController::class, 'setWinner'])->name('bids.set-winner');
    Route::post('/bids/{id}/verify-bidder', [BidVerificationController::class, 'verifyBidderData'])->name('bids.verify-bidder');

    // Payment Validation & Settlement
    Route::get('/payments', [PaymentValidationController::class, 'index'])->name('payments.index');
    Route::post('/payments/{id}/verify', [PaymentValidationController::class, 'verify'])->name('payments.verify');
    Route::post('/payments/{id}/reject', [PaymentValidationController::class, 'reject'])->name('payments.reject');
    Route::post('/payments/{id}/shipping', [PaymentValidationController::class, 'releaseShipping'])->name('payments.shipping');

    // User Management
    Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::post('/users/{id}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('users.toggle-status');

    // Auction Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
});

require __DIR__.'/auth.php';
