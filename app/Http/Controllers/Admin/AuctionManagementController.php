<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AuctionManagementController extends Controller
{
    /**
     * Display a listing of all auctions for management.
     */
    public function index(Request $request): Response
    {
        // Auto-close any expired auctions
        Auction::closeEndedAuctions();

        $query = Auction::with([
            'category',
            'creator',
            'winner',
            'payment',
            'validBids' => function ($q) {
                $q->with('user')->orderByDesc('amount')->limit(1);
            },
        ])->withCount('bids');

        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->toString() . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', $search)
                    ->orWhere('description', 'ilike', $search);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        $auctions = $query->latest()->paginate(6)->withQueryString();
        $categories = Category::all(['id', 'name']);

        return Inertia::render('Admin/Auctions/Index', [
            'auctions' => $auctions,
            'categories' => $categories,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
                'category_id' => $request->input('category_id', ''),
            ],
        ]);
    }

    /**
     * Show form for creating a new auction item.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Auctions/Create', [
            'categories' => Category::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created auction item in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'starting_price' => ['required', 'integer', 'min:10000'],
            'min_increment' => ['required', 'integer', 'min:10000'],
            'buy_now_price' => ['nullable', 'integer', 'gt:starting_price'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'images' => ['nullable', 'array'],
            'image_files' => ['nullable', 'array'],
            'image_files.*' => ['nullable', 'image', 'max:15360'],
            'status' => ['required', 'in:draft,active'],
        ]);

        $imageUrls = [];

        // Uploaded files (automatically compressed & converted to WebP)
        if ($request->hasFile('image_files')) {
            foreach ($request->file('image_files') as $file) {
                $path = $this->storeCompressedImage($file, 'auctions');
                $imageUrls[] = '/storage/' . $path;
            }
        }

        // Direct URLs or existing paths
        if (is_array($request->input('images'))) {
            foreach ($request->input('images') as $item) {
                if (is_string($item) && !empty(trim($item))) {
                    $imageUrls[] = trim($item);
                }
            }
        }

        if (empty($imageUrls)) {
            $imageUrls[] = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
        }

        $slug = Str::slug($validated['title']) . '-' . Str::random(5);

        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);
        $now = Carbon::now();

        // When publishing as active (LIVE), ensure start_time is <= now so it immediately appears LIVE in public catalog
        if ($validated['status'] === 'active' && $startTime->greaterThan($now)) {
            $durationSeconds = max(60, (int) $startTime->diffInSeconds($endTime));
            $startTime = $now->copy();
            $endTime = $startTime->copy()->addSeconds($durationSeconds);
        }

        Auction::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'category_id' => $validated['category_id'],
            'description' => $validated['description'],
            'starting_price' => $validated['starting_price'],
            'min_increment' => $validated['min_increment'],
            'current_price' => $validated['starting_price'],
            'buy_now_price' => $validated['buy_now_price'] ?? null,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => $validated['status'],
            'images' => $imageUrls,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.auctions.index')
            ->with('success', $validated['status'] === 'active'
                ? 'Item lelang berhasil dipublikasikan! Status kini LIVE di katalog publik.'
                : 'Item lelang berhasil disimpan sebagai Draft.');
    }

    /**
     * Publish a draft auction item so its status becomes LIVE ('active') in public catalog.
     */
    public function publish(int $id): RedirectResponse
    {
        $auction = Auction::findOrFail($id);

        $now = Carbon::now();
        $startTime = $auction->start_time <= $now ? $auction->start_time : $now;
        $endTime = $auction->end_time > $now ? $auction->end_time : $now->copy()->addDays(3);

        $auction->update([
            'status' => 'active',
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        return back()->with('success', 'Item lelang "' . $auction->title . '" berhasil dipublikasikan (LIVE) ke katalog publik.');
    }

    /**
     * Show form for editing an auction item (Only allowed for Draft items).
     */
    public function edit(int $id): Response|RedirectResponse
    {
        $auction = Auction::with('category')->findOrFail($id);

        if ($auction->status !== 'draft') {
            return redirect()->route('admin.auctions.index')
                ->with('error', 'Barang yang telah LIVE atau selesai dilelang tidak dapat diedit.');
        }

        return Inertia::render('Admin/Auctions/Edit', [
            'auction' => $auction,
            'categories' => Category::all(['id', 'name']),
        ]);
    }

    /**
     * Update an auction item (Only allowed for Draft items).
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $auction = Auction::findOrFail($id);

        if ($auction->status !== 'draft') {
            return redirect()->route('admin.auctions.index')
                ->with('error', 'Barang yang telah LIVE atau selesai dilelang tidak dapat diedit.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'starting_price' => ['nullable', 'integer', 'min:10000'],
            'min_increment' => ['required', 'integer', 'min:10000'],
            'buy_now_price' => ['nullable', 'integer'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'status' => ['required', 'in:draft,active,ended,cancelled'],
            'images' => ['nullable', 'array'],
            'image_files' => ['nullable', 'array'],
            'image_files.*' => ['nullable', 'image', 'max:15360'],
        ]);

        $imageUrls = is_array($request->input('images')) ? array_values(array_filter($request->input('images'))) : ($auction->images ?? []);

        if ($request->hasFile('image_files')) {
            foreach ($request->file('image_files') as $file) {
                $path = $this->storeCompressedImage($file, 'auctions');
                $imageUrls[] = '/storage/' . $path;
            }
        }

        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);
        $now = Carbon::now();

        if ($validated['status'] === 'active' && $startTime->greaterThan($now)) {
            $durationSeconds = max(60, (int) $startTime->diffInSeconds($endTime));
            $startTime = $now->copy();
            $endTime = $startTime->copy()->addSeconds($durationSeconds);
        }

        $newStartingPrice = $validated['starting_price'] ?? $auction->starting_price;

        $auction->update([
            'title' => $validated['title'],
            'category_id' => $validated['category_id'],
            'description' => $validated['description'],
            'starting_price' => $newStartingPrice,
            'current_price' => $newStartingPrice,
            'min_increment' => $validated['min_increment'],
            'buy_now_price' => $validated['buy_now_price'] ?? null,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => $validated['status'],
            'images' => !empty($imageUrls) ? $imageUrls : $auction->images,
        ]);

        return redirect()->route('admin.auctions.index')
            ->with('success', $validated['status'] === 'active'
                ? 'Item lelang berhasil diperbarui dan dipublikasikan (LIVE)!'
                : 'Data draft lelang berhasil diperbarui.');
    }

    /**
     * Manually close an auction, determine the winner from highest valid bid, and send invoice.
     */
    public function closeAuction(int $id): RedirectResponse
    {
        $auction = Auction::with('validBids')->findOrFail($id);
        $highestBid = $auction->validBids()->first();

        $auction->finalizeWinnerAndSendInvoice($highestBid, true);

        return back()->with('success', 'Lelang resmi ditutup. Pemenang lelang telah ditetapkan dan tagihan (Invoice) otomatis telah dikirim.');
    }

    /**
     * Approve (Setujui) the highest valid bidder as official winner after final moderation.
     */
    public function approveWinner(int $id): RedirectResponse
    {
        $auction = Auction::with('validBids.user')->findOrFail($id);
        $highestBid = $auction->validBids()->first();

        if (! $highestBid) {
            return back()->with('error', 'Tidak ada penawaran sah (valid) pada lelang ini untuk ditetapkan sebagai pemenang.');
        }

        $auction->finalizeWinnerAndSendInvoice($highestBid, true);

        return back()->with(
            'success',
            'Bidder tertinggi (' . $highestBid->user->name . ') berhasil disetujui (Approved) sebagai pemenang resmi. Tagihan (Invoice) telah dikirimkan otomatis.'
        );
    }

    /**
     * Delete an auction (Only allowed for Draft items).
     */
    public function destroy(int $id): RedirectResponse
    {
        $auction = Auction::findOrFail($id);

        if ($auction->status !== 'draft') {
            return back()->with('error', 'Barang yang telah LIVE atau selesai dilelang tidak dapat dihapus.');
        }

        $auction->delete();

        return redirect()->route('admin.auctions.index')
            ->with('success', 'Draft barang lelang berhasil dihapus.');
    }
}
