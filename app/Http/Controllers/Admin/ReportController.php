<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Category;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display comprehensive auction transaction and performance report.
     */
    public function index(Request $request): Response
    {
        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->subMonths(3)->startOfDay();

        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();

        $query = Auction::whereBetween('created_at', [$startDate, $endDate])
            ->with(['category', 'winner', 'payment'])
            ->withCount('validBids');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            if ($status === 'sold') {
                $query->whereNotNull('winner_id');
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->boolean('only_sold')) {
            $query->whereNotNull('winner_id');
        }

        $auctions = $query->latest('created_at')->paginate(6)->withQueryString();

        // Calculate summary metrics for the selected period
        $periodAuctions = Auction::whereBetween('created_at', [$startDate, $endDate]);
        $totalItems = (clone $periodAuctions)->count();
        $soldItems = (clone $periodAuctions)->whereNotNull('winner_id')->count();
        $totalGrossBidding = (clone $periodAuctions)->whereNotNull('winner_id')->sum('current_price');

        $auctionIds = (clone $periodAuctions)->pluck('id');
        $totalBids = Bid::whereIn('auction_id', $auctionIds)->where('status', 'valid')->count();
        $highestBid = Bid::whereIn('auction_id', $auctionIds)->where('status', 'valid')->max('amount') ?? 0;
        $avgBids = $totalItems > 0 ? round($totalBids / $totalItems, 1) : 0;
        $conversionRate = $totalItems > 0 ? round(($soldItems / $totalItems) * 100, 1) : 0;

        $totalVerifiedSettlement = Payment::where('status', 'verified')
            ->whereBetween('verified_at', [$startDate, $endDate])
            ->sum('amount');

        $categories = Category::all(['id', 'name']);

        return Inertia::render('Admin/Reports/Index', [
            'auctions' => $auctions,
            'categories' => $categories,
            'summary' => [
                'total_items' => $totalItems,
                'sold_items' => $soldItems,
                'conversion_rate' => $conversionRate,
                'total_bids' => $totalBids,
                'avg_bids_per_auction' => $avgBids,
                'highest_bid' => $highestBid,
                'total_gross_bidding' => $totalGrossBidding,
                'total_verified_settlement' => $totalVerifiedSettlement,
            ],
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'category_id' => $request->input('category_id', ''),
                'status' => $request->input('status', ''),
                'only_sold' => $request->boolean('only_sold'),
            ],
        ]);
    }
}
