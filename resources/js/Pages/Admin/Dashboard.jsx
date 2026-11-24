import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import Pagination from '@/Components/Pagination';
import { useLivePolling } from '@/Hooks/useLivePolling';
import { formatRupiah } from '@/Utils/format';

export default function Dashboard({ metrics, recentBids, pendingPayments }) {
    const [bidsPage, setBidsPage] = useState(1);
    const [paymentsPage, setPaymentsPage] = useState(1);

    const { manualRefresh, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['metrics', 'recentBids', 'pendingPayments'],
    });

    const liveMetrics = polledData?.metrics || metrics;
    const liveRecentBids = polledData?.recentBids || recentBids || [];
    const livePendingPayments = polledData?.pendingPayments || pendingPayments || [];

    const perPage = 6;
    const safeBidsPage = Math.min(bidsPage, Math.max(1, Math.ceil(liveRecentBids.length / perPage)));
    const paginatedRecentBids = liveRecentBids.slice(
        (safeBidsPage - 1) * perPage,
        safeBidsPage * perPage
    );

    const safePaymentsPage = Math.min(
        paymentsPage,
        Math.max(1, Math.ceil(livePendingPayments.length / perPage))
    );
    const paginatedPendingPayments = livePendingPayments.slice(
        (safePaymentsPage - 1) * perPage,
        safePaymentsPage * perPage
    );

    return (
        <AdminLayout title="Ringkasan Eksekutif & Statistik">
            <Head title="Ringkasan Admin — MyBidder.ID" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Ringkasan Statistik & Pemantauan</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        Metrik realisasi pelunasan, jumlah penawaran masuk, dan konversi lot secara real-time
                    </p>
                </div>

                <LiveSyncBadge
                    onManualRefresh={manualRefresh}
                    lastUpdated={lastUpdated}
                />
            </div>

            {/* 4 Compact Stat Cards: Pure Numbers, Label, and Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 tabular-nums">
                <div className="bg-white border border-neutral-200 rounded-xl p-5">
                    <span className="text-xs font-medium text-neutral-500">Total lot lelang</span>
                    <div className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-900 mt-2">
                        {liveMetrics.total_auctions}
                    </div>
                    <div className="mt-1.5 text-xs text-neutral-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>{liveMetrics.active_auctions} lot sedang berlangsung</span>
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-5">
                    <span className="text-xs font-medium text-neutral-500">Total penawaran masuk</span>
                    <div className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-900 mt-2">
                        {liveMetrics.total_bids}
                    </div>
                    <div className="mt-1.5 text-xs text-neutral-500">
                        <span className="font-medium text-neutral-800">+{liveMetrics.bids_today}</span> penawaran hari ini
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-5">
                    <span className="text-xs font-medium text-neutral-500">Pelunasan terverifikasi</span>
                    <div className="text-2xl font-semibold font-mono text-emerald-700 mt-2 truncate">
                        {formatRupiah(liveMetrics.total_revenue)}
                    </div>
                    <div className="mt-1.5 text-xs text-neutral-500">
                        <span className="font-medium text-neutral-800">{liveMetrics.pending_payments}</span> bukti menunggu validasi
                    </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-5">
                    <span className="text-xs font-medium text-neutral-500">Tingkat konversi</span>
                    <div className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-900 mt-2">
                        {liveMetrics.conversion_rate}%
                    </div>
                    <div className="mt-1.5 text-xs text-neutral-500">
                        Dari <span className="font-medium text-neutral-800">{liveMetrics.total_users}</span> penawar terdaftar
                    </div>
                </div>
            </div>

            {/* Asymmetric 7:5 Split: Recent Bids Stream + Pending Payments Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-900">Aliran Penawaran Terbaru</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Penawaran masuk terbaru dari seluruh lot aktif
                            </p>
                        </div>
                        <Link
                            href={route('admin.bids.index')}
                            className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
                        >
                            Verifikasi penawaran →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3">Barang lelang</th>
                                    <th className="px-5 py-3">Penawar</th>
                                    <th className="px-5 py-3 text-right">Nominal & waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {paginatedRecentBids.length > 0 ? (
                                    paginatedRecentBids.map((bid) => (
                                        <tr
                                            key={bid.id}
                                            className="hover:bg-neutral-50 transition-colors duration-150"
                                        >
                                            <td className="px-5 py-3.5 font-medium text-neutral-900 max-w-[200px] truncate">
                                                {bid.auction_title}
                                            </td>
                                            <td className="px-5 py-3.5 text-neutral-600">
                                                <span className="font-medium text-neutral-900 block">{bid.bidder_name}</span>
                                                <span className="text-[11px] text-neutral-400">{bid.bidder_email}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                <span className="font-mono font-semibold text-neutral-900 block">
                                                    {formatRupiah(bid.amount)}
                                                </span>
                                                <span className="text-[11px] text-neutral-400">{bid.created_at}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-10 text-xs text-neutral-400">
                                            Belum ada penawaran masuk
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={safeBidsPage}
                        totalItems={liveRecentBids.length}
                        perPage={perPage}
                        onPageChange={setBidsPage}
                    />
                </div>

                <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-sm text-neutral-900">Antrean Validasi Pembayaran</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">Bukti transfer masuk yang menunggu pemeriksaan</p>
                        </div>
                        <Link
                            href={route('admin.payments.index')}
                            className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
                        >
                            Semua →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3">Lot & pemenang</th>
                                    <th className="px-5 py-3 text-right">Tagihan</th>
                                    <th className="px-5 py-3 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {paginatedPendingPayments.length > 0 ? (
                                    paginatedPendingPayments.map((p) => (
                                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-neutral-900 line-clamp-1">{p.auction_title}</p>
                                                <p className="text-neutral-500 text-[11px] mt-0.5">
                                                    {p.user_name} ({p.bank_name})
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                                                {formatRupiah(p.amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    href={route('admin.payments.index')}
                                                    className="h-8 px-3 rounded-lg font-medium text-xs bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150 inline-flex items-center"
                                                >
                                                    Periksa
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-10 text-neutral-400 text-xs">
                                            Tidak ada antrean pembayaran saat ini
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={safePaymentsPage}
                        totalItems={livePendingPayments.length}
                        perPage={perPage}
                        onPageChange={setPaymentsPage}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
