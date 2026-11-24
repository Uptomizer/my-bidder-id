<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentValidationController extends Controller
{
    /**
     * Display payments submitted by auction winners for validation.
     */
    public function index(Request $request): Response
    {
        $query = Payment::with(['auction', 'user', 'verifier']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->toString() . '%';
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('name', 'ilike', $search)
                        ->orWhere('email', 'ilike', $search);
                })->orWhereHas('auction', function ($a) use ($search) {
                    $a->where('title', 'ilike', $search);
                });
            });
        }

        $payments = $query->latest()->paginate(6)->withQueryString();

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'filters' => [
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Verify payment and approve release for shipping.
     */
    public function verify(Request $request, int $id): RedirectResponse
    {
        $admin = $request->user();
        $payment = Payment::with('auction')->findOrFail($id);

        $payment->update([
            'status' => 'verified',
            'shipping_status' => 'processing',
            'admin_notes' => $request->input('admin_notes', 'Pembayaran sah dan telah diverifikasi.'),
            'verified_at' => Carbon::now(),
            'verified_by' => $admin->id,
        ]);

        $payment->auction->update([
            'status' => 'settled',
        ]);

        Notification::create([
            'user_id' => $payment->user_id,
            'type' => 'payment_verified',
            'title' => 'Pembayaran Tervalidasi (Lunas - Siap Kirim)',
            'message' => 'Pembayaran Anda untuk lelang "' . $payment->auction->title . '" telah divalidasi oleh Admin Keuangan. Status transaksi kini menjadi Lunas - Siap Kirim!',
            'url' => route('user.wins'),
        ]);

        return back()->with('success', 'Pembayaran berhasil divalidasi. Status transaksi telah diubah menjadi Lunas - Siap Kirim.');
    }

    /**
     * Reject invalid payment proof.
     */
    public function reject(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'admin_notes' => ['required', 'string', 'max:255'],
        ]);

        $admin = $request->user();
        $payment = Payment::with('auction')->findOrFail($id);

        $payment->update([
            'status' => 'rejected',
            'admin_notes' => $request->string('admin_notes')->toString(),
            'verified_at' => Carbon::now(),
            'verified_by' => $admin->id,
        ]);

        Notification::create([
            'user_id' => $payment->user_id,
            'type' => 'payment_rejected',
            'title' => 'Bukti Pembayaran Ditolak',
            'message' => 'Bukti pembayaran untuk lelang "' . $payment->auction->title . '" ditolak dengan catatan: ' . $request->string('admin_notes')->toString() . '. Silakan unggah bukti transfer yang sah.',
            'url' => route('user.wins'),
        ]);

        return back()->with('success', 'Bukti pembayaran telah ditolak dan pemenang telah dinotifikasi.');
    }

    /**
     * Release shipment for a verified payment with courier and tracking number.
     */
    public function releaseShipping(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'courier_name' => ['required', 'string', 'max:100'],
            'tracking_number' => ['required', 'string', 'max:100'],
            'shipping_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = Payment::with(['auction', 'user'])->findOrFail($id);

        if ($payment->status !== 'verified') {
            return back()->with('error', 'Pengiriman hanya dapat dilepaskan untuk pembayaran yang telah diverifikasi (Lunas).');
        }

        $payment->update([
            'shipping_status' => 'shipped',
            'courier_name' => $request->string('courier_name')->toString(),
            'tracking_number' => $request->string('tracking_number')->toString(),
            'shipped_at' => Carbon::now(),
            'shipping_notes' => $request->input('shipping_notes'),
        ]);

        Notification::create([
            'user_id' => $payment->user_id,
            'type' => 'item_shipped',
            'title' => 'Barang Telah Dikirim!',
            'message' => 'Barang lelang "' . $payment->auction->title . '" telah dikirim via ' . $request->string('courier_name')->toString() . ' dengan No. Resi: ' . $request->string('tracking_number')->toString() . '.',
            'url' => route('user.wins'),
        ]);

        return back()->with('success', 'Status pengiriman barang berhasil dilepaskan. Resi: ' . $request->string('tracking_number')->toString());
    }
}
