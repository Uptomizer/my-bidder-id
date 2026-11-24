<?php

namespace App\Http\Controllers;

use App\Events\BidPlaced;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Category;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AuctionController extends Controller
{
    /**
     * Display auction catalog with filters.
     */
    public function index(Request $request): Response
    {
        // Auto-close any expired auctions (00:00:00)
        Auction::closeEndedAuctions();

        $query = Auction::with(['category', 'validBids' => function ($q) {
            $q->latest('created_at')->limit(1);
        }]);

        // Category filter
        if ($request->filled('category')) {
            $categorySlug = $request->string('category')->toString();
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        // Search query
        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->toString() . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', $search)
                    ->orWhere('description', 'ilike', $search);
            });
        }

        // Status tab filter
        $now = Carbon::now();
        $tab = $request->input('tab', 'live');

        if ($tab === 'live') {
            $query->where('status', 'active')
                ->where('start_time', '<=', $now)
                ->where('end_time', '>', $now);
        } elseif ($tab === 'upcoming') {
            $query->where('status', 'active')
                ->where('start_time', '>', $now);
        } elseif ($tab === 'ended') {
            $query->where(function ($q) use ($now) {
                $q->where('status', 'ended')
                    ->orWhere('status', 'settled')
                    ->orWhere('end_time', '<=', $now);
            });
        }

        // Sorting
        $sort = $request->input('sort', 'ending_soon');
        if ($sort === 'ending_soon') {
            $query->orderBy('end_time', 'asc');
        } elseif ($sort === 'latest') {
            $query->orderBy('created_at', 'desc');
        } elseif ($sort === 'price_asc') {
            $query->orderBy('current_price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('current_price', 'desc');
        }

        $auctions = $query->paginate(6)->withQueryString();
        $categories = Category::withCount([
            'auctions' => function ($q) use ($now) {
                $q->where('status', 'active')
                    ->where('start_time', '<=', $now)
                    ->where('end_time', '>', $now);
            },
        ])->get();

        return Inertia::render('Auctions/Index', [
            'auctions' => $auctions,
            'categories' => $categories,
            'filters' => [
                'search' => $request->input('search', ''),
                'category' => $request->input('category', ''),
                'tab' => $tab,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * Show detailed auction page.
     */
    public function show(Request $request, string $slug): Response
    {
        // Auto-close any expired auctions when timer hits 00:00:00
        Auction::closeEndedAuctions();

        $auction = Auction::with([
            'category',
            'validBids.user',
            'creator',
            'winner',
            'payment',
        ])->where('slug', $slug)->firstOrFail();

        $user = $request->user();
        $userBidStatus = null;

        if ($user) {
            $highestUserBid = $auction->validBids
                ->where('user_id', $user->id)
                ->first();

            $highestOverallBid = $auction->validBids->first();

            $userBidStatus = [
                'has_bid' => $highestUserBid !== null,
                'highest_user_bid' => $highestUserBid ? $highestUserBid->amount : null,
                'is_highest_bidder' => $highestOverallBid && $highestOverallBid->user_id === $user->id,
            ];
        }

        // Format bid history with masked names
        $bidHistory = $auction->validBids->map(function (Bid $bid) {
            return [
                'id' => $bid->id,
                'amount' => $bid->amount,
                'masked_bidder_name' => $bid->masked_bidder_name,
                'created_at' => $bid->created_at->diffForHumans(),
                'created_at_raw' => $bid->created_at->toISOString(),
            ];
        });

        $nextMinBid = $auction->getNextMinBid();
        $minIncrement = $auction->min_increment;

        // Quick bid options
        $quickBids = [
            $nextMinBid,
            $nextMinBid + $minIncrement,
            $nextMinBid + ($minIncrement * 2),
            $nextMinBid + ($minIncrement * 5),
        ];

        return Inertia::render('Auctions/Show', [
            'auction' => [
                'id' => $auction->id,
                'title' => $auction->title,
                'slug' => $auction->slug,
                'description' => $auction->description,
                'starting_price' => $auction->starting_price,
                'min_increment' => $auction->min_increment,
                'current_price' => $auction->current_price,
                'buy_now_price' => $auction->buy_now_price,
                'start_time' => $auction->start_time->toISOString(),
                'end_time' => $auction->end_time->toISOString(),
                'status' => $auction->status,
                'is_live' => $auction->isLive(),
                'has_ended' => $auction->hasEnded(),
                'images' => $auction->images ?? [],
                'category' => $auction->category,
                'winner' => $auction->winner ? [
                    'id' => $auction->winner->id,
                    'masked_name' => $auction->winner->masked_name,
                ] : null,
                'payment_status' => $auction->payment?->status,
                'shipping_status' => $auction->payment?->shipping_status,
            ],
            'bidHistory' => $bidHistory,
            'nextMinBid' => $nextMinBid,
            'quickBids' => $quickBids,
            'userBidStatus' => $userBidStatus,
        ]);
    }

    /**
     * Submit a bid on an active auction.
     */
    public function placeBid(Request $request, int $id): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $isAjaxBid = $request->header('X-Live-Bid') === '1';

        if (! $user) {
            if ($isAjaxBid) {
                return response()->json(['success' => false, 'message' => 'Silakan login terlebih dahulu untuk menawar.'], 401);
            }
            return redirect()->route('login')->with('error', 'Silakan login terlebih dahulu untuk menawar.');
        }

        if ($user->isAdmin()) {
            if ($isAjaxBid) {
                return response()->json(['success' => false, 'message' => 'Akun Administrator tidak diperbolehkan melakukan penawaran (bidding).'], 403);
            }
            return back()->with('error', 'Akun Administrator tidak diperbolehkan melakukan penawaran (bidding).');
        }

        if (! $user->isActive()) {
            if ($isAjaxBid) {
                return response()->json(['success' => false, 'message' => 'Akun Anda sedang dinonaktifkan.'], 403);
            }
            return back()->with('error', 'Akun Anda sedang dinonaktifkan.');
        }

        $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'quick_bid' => ['nullable', 'boolean'],
        ]);

        $amount = (int) $request->input('amount');
        $isQuickBid = $request->boolean('quick_bid');

        return DB::transaction(function () use ($id, $user, $amount, $isAjaxBid, $isQuickBid) {
            // Lock auction row for concurrency safety
            $auction = Auction::lockForUpdate()->findOrFail($id);

            $fail = function (string $msg) use ($isAjaxBid) {
                if ($isAjaxBid) {
                    return response()->json(['success' => false, 'message' => $msg], 422);
                }
                return back()->with('error', $msg);
            };

            if (! $auction->isLive()) {
                if ($auction->status === 'active' && $auction->end_time <= Carbon::now()) {
                    $auction->finalizeWinnerAndSendInvoice();
                }

                return $fail('Periode lelang ini sudah berakhir (00:00:00) dan fitur penawaran telah dikunci.');
            }

            if ($auction->created_by === $user->id) {
                return $fail('Admin pembuat lelang tidak diperbolehkan menawar barang sendiri.');
            }

            $currentHighestBid = $auction->getHighestBid();
            $nextMinBid = $auction->getNextMinBid();

            if ($isQuickBid) {
                if ($currentHighestBid && $amount <= $auction->current_price) {
                    return $fail('Tawaran harus lebih tinggi dari harga tertinggi saat ini (Rp ' . number_format($auction->current_price, 0, ',', '.') . ').');
                }
                if (! $currentHighestBid && $amount < $auction->starting_price) {
                    return $fail('Tawaran minimal adalah Harga Awal Rp ' . number_format($auction->starting_price, 0, ',', '.') . '.');
                }
            } else {
                if ($amount < $nextMinBid) {
                    return $fail('Tawaran minimal adalah Rp ' . number_format($nextMinBid, 0, ',', '.'));
                }

                if ($auction->min_increment > 0 && (($amount - $auction->starting_price) % $auction->min_increment !== 0)) {
                    return $fail('Nominal penawaran harus sesuai aturan kelipatan Rp ' . number_format($auction->min_increment, 0, ',', '.') . '.');
                }
            }

            if ($currentHighestBid && $currentHighestBid->user_id === $user->id) {
                return $fail('Anda sudah memegang tawaran tertinggi saat ini.');
            }

            // Collect all distinct previous valid bidders on this auction to notify them of being outbid
            $previousParticipantIds = $auction->validBids()
                ->where('user_id', '!=', $user->id)
                ->pluck('user_id')
                ->unique()
                ->values();

            // Create bid record
            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'status' => 'valid',
            ]);

            // Update auction price
            $auction->update([
                'current_price' => $amount,
            ]);

            $outbidUserId = $currentHighestBid ? $currentHighestBid->user_id : null;

            // Create outbid notifications for previous auction participants
            foreach ($previousParticipantIds as $participantId) {
                Notification::create([
                    'user_id' => $participantId,
                    'type' => 'outbid',
                    'title' => 'Tawaran Anda Terlampaui!',
                    'message' => 'Tawaran Anda pada lelang "' . $auction->title . '" telah terlampaui dengan harga tertinggi baru Rp ' . number_format($amount, 0, ',', '.') . '. Ajukan penawaran kembali sebelum waktu habis!',
                    'url' => route('auctions.show', $auction->slug),
                    'data' => [
                        'auction_id' => $auction->id,
                        'new_amount' => $amount,
                    ],
                ]);
            }

            // Broadcast real-time event to all viewers safely (do not fail transaction if Reverb/Pusher daemon is not running)
            try {
                broadcast(new BidPlaced($auction, $bid, $outbidUserId));
            } catch (\Throwable $e) {
                Log::warning('WebSocket broadcast skipped (falling back to live polling): ' . $e->getMessage());
            }

            if ($isAjaxBid) {
                $newNextMin = $auction->getNextMinBid();
                return response()->json([
                    'success' => true,
                    'message' => 'Tawaran sebesar Rp ' . number_format($amount, 0, ',', '.') . ' berhasil diajukan!',
                    'current_price' => (int) $auction->current_price,
                    'next_min_bid' => (int) $newNextMin,
                    'bid' => [
                        'id' => $bid->id,
                        'amount' => (int) $bid->amount,
                        'masked_bidder_name' => $bid->masked_bidder_name,
                        'created_at' => 'Baru saja',
                        'created_at_raw' => $bid->created_at?->toISOString() ?? Carbon::now()->toISOString(),
                    ],
                    'user_bid_status' => [
                        'has_bid' => true,
                        'highest_user_bid' => (int) $amount,
                        'is_highest_bidder' => true,
                    ],
                ]);
            }

            return back()->with(
                'success',
                'Tawaran sebesar Rp ' . number_format($amount, 0, ',', '.') . ' berhasil diajukan!'
            );
        });
    }
}
