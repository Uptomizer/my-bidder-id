<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BidVerificationController extends Controller
{
    /**
     * Display listing of bids for verification and moderation.
     */
    public function index(Request $request): Response
    {
        Auction::closeEndedAuctions();

        $query = Bid::with(['user', 'auction.category', 'auction.winner', 'auction.payment', 'disqualifier']);

        if ($request->filled('auction_id')) {
            $query->where('auction_id', $request->integer('auction_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('data_status')) {
            $dataStatus = $request->string('data_status')->toString();

            if ($dataStatus === 'paid') {
                $query->whereHas('auction', function ($q) {
                    $q->where('status', 'settled')
                        ->orWhereHas('payment', function ($pq) {
                            $pq->whereIn('status', ['pending_verification', 'verified']);
                        });
                });
            } elseif ($dataStatus === 'ready_to_pay') {
                $query->whereHas('auction', function ($q) {
                    $q->where('winner_verification_status', 'approved')
                        ->where('status', '!=', 'settled')
                        ->whereDoesntHave('payment', function ($pq) {
                            $pq->whereIn('status', ['pending_verification', 'verified']);
                        });
                });
            } elseif ($dataStatus === 'pending_check') {
                $query->whereHas('auction', function ($q) {
                    $q->where('winner_verification_status', 'pending');
                });
            } elseif ($dataStatus === 'needs_revision') {
                $query->whereHas('auction', function ($q) {
                    $q->where('winner_verification_status', 'rejected');
                });
            } elseif ($dataStatus === 'unsubmitted') {
                $query->whereHas('auction', function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNull('winner_verification_status')
                            ->orWhere('winner_verification_status', 'unsubmitted');
                    })
                        ->where('status', '!=', 'settled')
                        ->whereDoesntHave('payment', function ($pq) {
                            $pq->whereIn('status', ['pending_verification', 'verified']);
                        });
                });
            }
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->string('date')->toString());
        }

        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->toString() . '%';
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'ilike', $search)
                    ->orWhere('email', 'ilike', $search);
            });
        }

        $bids = $query->latest('created_at')->paginate(6)->withQueryString();
        $auctions = Auction::select('id', 'title')->get();

        return Inertia::render('Admin/Bids/Index', [
            'bids' => $bids,
            'auctions' => $auctions,
            'filters' => [
                'auction_id' => $request->input('auction_id', ''),
                'status' => $request->input('status', ''),
                'data_status' => $request->input('data_status', ''),
                'date' => $request->input('date', ''),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Disqualify a suspicious or fraudulent bid.
     */
    public function disqualify(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $admin = $request->user();

        return DB::transaction(function () use ($id, $request, $admin) {
            $bid = Bid::with('auction')->lockForUpdate()->findOrFail($id);
            $auction = $bid->auction;

            $bid->update([
                'status' => 'disqualified',
                'disqualified_reason' => $request->string('reason')->toString(),
                'disqualified_at' => Carbon::now(),
                'disqualified_by' => $admin->id,
            ]);

            // Recalculate auction current price based on highest remaining valid bid
            $highestValidBid = $auction->validBids()->first();
            $newCurrentPrice = $highestValidBid ? $highestValidBid->amount : $auction->starting_price;

            $updateData = [
                'current_price' => $newCurrentPrice,
            ];

            // If auction had ended and this disqualified user was the winner, drop winner to next valid bidder
            if ($auction->winner_id === $bid->user_id) {
                $updateData['winner_id'] = $highestValidBid ? $highestValidBid->user_id : null;
            }

            $auction->update($updateData);

            // If a new winner took over an ended auction, send them the invoice notification
            if ($auction->status === 'ended' && $highestValidBid && $auction->winner_id === $highestValidBid->user_id) {
                $auction->finalizeWinnerAndSendInvoice($highestValidBid, false);
            }

            // Notify user of disqualification
            Notification::create([
                'user_id' => $bid->user_id,
                'type' => 'bid_disqualified',
                'title' => 'Tawaran Anda Didiskualifikasi',
                'message' => 'Tawaran Rp ' . number_format($bid->amount, 0, ',', '.') . ' pada lelang "' . $auction->title . '" telah didiskualifikasi oleh Administrator dengan alasan: ' . $request->string('reason')->toString(),
                'url' => route('auctions.show', $auction->slug),
            ]);

            return back()->with('success', 'Penawaran berhasil didiskualifikasi dan harga lelang telah disesuaikan kembali.');
        });
    }

    /**
     * Restore a previously disqualified bid.
     */
    public function restore(int $id): RedirectResponse
    {
        return DB::transaction(function () use ($id) {
            $bid = Bid::with('auction')->lockForUpdate()->findOrFail($id);
            $auction = $bid->auction;

            $bid->update([
                'status' => 'valid',
                'disqualified_reason' => null,
                'disqualified_at' => null,
                'disqualified_by' => null,
            ]);

            $highestValidBid = $auction->validBids()->first();
            $newCurrentPrice = $highestValidBid ? $highestValidBid->amount : $auction->starting_price;

            $auction->update([
                'current_price' => $newCurrentPrice,
            ]);

            return back()->with('success', 'Penawaran berhasil dipulihkan menjadi sah.');
        });
    }

    /**
     * Manually approve (Setujui) a valid bid as the official auction winner, lock auction, and send invoice.
     */
    public function setWinner(Request $request, int $id): RedirectResponse
    {
        return DB::transaction(function () use ($id) {
            $bid = Bid::with(['auction', 'user'])->lockForUpdate()->findOrFail($id);

            if ($bid->status !== 'valid') {
                return back()->with('error', 'Hanya penawaran yang berstatus sah (valid) yang dapat disetujui sebagai pemenang.');
            }

            $auction = $bid->auction;
            $auction->finalizeWinnerAndSendInvoice($bid, true);

            return back()->with('success', 'Pemenang lelang "' . $auction->title . '" berhasil disetujui (Approved) kepada ' . $bid->user->name . ' dan Invoice otomatis telah dikirim.');
        });
    }

    /**
     * Verify (Cek & Approve / Minta Perbaikan) bidder's winner verification form data before payment.
     */
    public function verifyBidderData(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'action' => ['nullable', 'in:approve,reject'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        return DB::transaction(function () use ($id, $request) {
            $bid = Bid::with(['auction', 'user'])->lockForUpdate()->findOrFail($id);
            $auction = $bid->auction;
            $action = $request->input('action', 'approve');

            if ($action === 'reject') {
                $note = $request->string('note')->toString() ?: 'Mohon lengkapi kembali alamat, kode pos, dan nomor telepon aktif yang dapat dihubungi.';

                $auction->update([
                    'winner_verification_status' => 'rejected',
                    'winner_verification_note' => $note,
                ]);

                Notification::create([
                    'user_id' => $bid->user_id,
                    'type' => 'payment_rejected',
                    'title' => 'Perbaikan Data Verifikasi Pemenang Diperlukan',
                    'message' => 'Admin meminta perbaikan formulir data pemenang untuk lelang "' . $auction->title . '". Catatan Admin: ' . $note,
                    'url' => route('user.wins'),
                ]);

                return back()->with('success', 'Permintaan perbaikan data verifikasi telah dikirimkan ke bidder ' . $bid->user->name . '.');
            }

            if ($bid->status !== 'valid') {
                return back()->with('error', 'Hanya penawaran yang berstatus sah (valid) yang dapat diverifikasi.');
            }

            if (! $auction->winner_id) {
                $auction->finalizeWinnerAndSendInvoice($bid, true);
            }

            $auction->update([
                'winner_verification_status' => 'approved',
                'winner_verification_note' => $request->input('note'),
                'winner_verified_at' => Carbon::now(),
            ]);

            Notification::create([
                'user_id' => $bid->user_id,
                'type' => 'payment_verified',
                'title' => 'Data Terverifikasi! Siap Lanjut ke Pembayaran',
                'message' => 'Formulir data & alamat pengiriman Anda untuk lelang "' . $auction->title . '" telah diverifikasi oleh Admin. Silakan lanjutkan ke tahap pembayaran di menu Kemenangan Lelang Saya.',
                'url' => route('user.wins'),
            ]);

            return back()->with('success', 'Data bidder ' . $bid->user->name . ' berhasil diverifikasi (Approved) dan notifikasi lanjut pembayaran telah dikirim.');
        });
    }
}
