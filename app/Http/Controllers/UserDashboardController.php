<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    /**
     * Display all auctions the user has bid on.
     */
    public function myBids(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard')
                ->with('info', 'Menu Tawaran Saya hanya untuk akun peserta lelang (User).');
        }

        Auction::closeEndedAuctions();

        // Get distinct auctions user has bid on
        $auctions = Auction::whereHas('bids', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
            ->with(['category', 'validBids' => function ($q) {
                $q->limit(1);
            }])
            ->latest('updated_at')
            ->paginate(6);

        // Append user specific bidding stats
        $auctions->getCollection()->transform(function (Auction $auction) use ($user) {
            $userHighestBid = $auction->validBids()
                ->where('user_id', $user->id)
                ->max('amount');

            $currentHighest = $auction->current_price;
            $isLive = $auction->isLive();
            $hasEnded = $auction->hasEnded();

            $status = 'outbid';
            if ($auction->winner_id === $user->id) {
                $status = 'won';
            } elseif ($hasEnded) {
                $status = 'lost';
            } elseif ($userHighestBid >= $currentHighest) {
                $status = 'leading';
            }

            return [
                'id' => $auction->id,
                'title' => $auction->title,
                'slug' => $auction->slug,
                'category_name' => $auction->category->name,
                'image' => $auction->images[0] ?? null,
                'current_price' => $currentHighest,
                'user_highest_bid' => $userHighestBid,
                'end_time' => $auction->end_time->toISOString(),
                'is_live' => $isLive,
                'has_ended' => $hasEnded,
                'bidding_status' => $status,
            ];
        });

        return Inertia::render('User/MyBids', [
            'auctions' => $auctions,
        ]);
    }

    /**
     * Display won auctions and payment status.
     */
    public function myWins(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard')
                ->with('info', 'Menu Kemenangan & Bayar hanya untuk akun peserta lelang (User).');
        }

        Auction::closeEndedAuctions();

        $wins = Auction::where('winner_id', $user->id)
            ->with(['payment', 'category'])
            ->latest('end_time')
            ->paginate(6);

        $wins->getCollection()->transform(function (Auction $auction) use ($user) {
            return [
                'id' => $auction->id,
                'invoice_number' => $auction->getInvoiceNumber(),
                'title' => $auction->title,
                'slug' => $auction->slug,
                'image' => $auction->images[0] ?? null,
                'winning_price' => $auction->current_price,
                'category' => $auction->category->name,
                'status' => $auction->status,
                'ended_at' => $auction->end_time?->format('d M Y H:i'),
                'verification_status' => $auction->winner_verification_status ?: 'unsubmitted',
                'verification_data' => [
                    'full_name' => $auction->winner_full_name ?: $user->name,
                    'phone' => $auction->winner_phone ?: ($user->phone ?? ''),
                    'address' => $auction->winner_address ?: '',
                    'postal_code' => $auction->winner_postal_code ?: '',
                    'address_detail' => $auction->winner_address_detail ?: '',
                    'notes' => $auction->winner_notes ?: '',
                    'verification_note' => $auction->winner_verification_note,
                    'submitted_at' => $auction->winner_form_submitted_at?->format('d M Y H:i'),
                    'verified_at' => $auction->winner_verified_at?->format('d M Y H:i'),
                ],
                'payment' => $auction->payment ? [
                    'id' => $auction->payment->id,
                    'status' => $auction->payment->status,
                    'shipping_status' => $auction->payment->shipping_status,
                    'courier_name' => $auction->payment->courier_name,
                    'tracking_number' => $auction->payment->tracking_number,
                    'shipped_at' => $auction->payment->shipped_at?->format('d M Y H:i'),
                    'shipping_notes' => $auction->payment->shipping_notes,
                    'proof_image' => $auction->payment->proof_image,
                    'bank_name' => $auction->payment->bank_name,
                    'account_name' => $auction->payment->account_name,
                    'admin_notes' => $auction->payment->admin_notes,
                    'created_at' => $auction->payment->created_at->format('d M Y H:i'),
                ] : null,
            ];
        });

        return Inertia::render('User/MyWins', [
            'wins' => $wins,
        ]);
    }

    /**
     * Submit winner verification form (Nama Lengkap, Telepon Aktif, Alamat, Kode Pos, Alamat Lainnya, Pelengkap) before payment.
     */
    public function submitWinnerVerification(Request $request, int $auctionId): RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard')
                ->with('error', 'Administrator tidak dapat mengisi formulir verifikasi pemenang.');
        }

        $auction = Auction::where('id', $auctionId)
            ->where('winner_id', $user->id)
            ->firstOrFail();

        $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:35'],
            'address' => ['required', 'string', 'max:1000'],
            'postal_code' => ['required', 'string', 'max:20'],
            'address_detail' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $auction->update([
            'winner_verification_status' => 'pending',
            'winner_full_name' => $request->string('full_name')->toString(),
            'winner_phone' => $request->string('phone')->toString(),
            'winner_address' => $request->string('address')->toString(),
            'winner_postal_code' => $request->string('postal_code')->toString(),
            'winner_address_detail' => $request->input('address_detail'),
            'winner_notes' => $request->input('notes'),
            'winner_verification_note' => null,
            'winner_form_submitted_at' => \Carbon\Carbon::now(),
        ]);

        return back()->with(
            'success',
            'Formulir data & alamat pemenang berhasil dikirim! Mohon tunggu verifikasi Admin maksimal 1x24 jam sebelum melanjutkan ke tahap pembayaran.'
        );
    }

    /**
     * Submit payment proof for a won auction.
     */
    public function submitPayment(Request $request, int $auctionId): RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard')
                ->with('error', 'Administrator tidak dapat mengunggah bukti pembayaran lelang.');
        }

        $auction = Auction::where('id', $auctionId)
            ->where('winner_id', $user->id)
            ->firstOrFail();

        $request->validate([
            'proof_image' => ['required', 'image', 'max:15360'],
            'bank_name' => ['required', 'string', 'max:100'],
            'account_name' => ['required', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'max:50'],
        ]);

        $path = $this->storeCompressedImage($request->file('proof_image'), 'payments');

        Payment::updateOrCreate(
            ['auction_id' => $auction->id],
            [
                'user_id' => $user->id,
                'amount' => $auction->current_price,
                'proof_image' => '/storage/' . $path,
                'bank_name' => $request->string('bank_name')->toString(),
                'account_name' => $request->string('account_name')->toString(),
                'account_number' => $request->input('account_number'),
                'status' => 'pending',
                'admin_notes' => null,
            ]
        );

        return back()->with('success', 'Bukti pembayaran berhasil diunggah. Menunggu konfirmasi Administrator.');
    }
}
