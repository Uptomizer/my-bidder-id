import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import Pagination from '@/Components/Pagination';
import { useLivePolling } from '@/Hooks/useLivePolling';
import { formatRupiah, formatDateTime } from '@/Utils/format';

export default function Index({ auctions, categories, summary, filters }) {
    const { manualRefresh, fetchUrl, isNavigatingPage, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['auctions', 'summary'],
    });

    const liveAuctions = polledData?.auctions || auctions;
    const liveSummary = polledData?.summary || summary;

    const handleFilterChange = (key, value) => {
        router.get(
            route('admin.reports.index'),
            {
                ...filters,
                [key]: value,
            },
            { preserveState: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AdminLayout title="Pelaporan & Statistik Lelang">
            <Head title="Laporan & Rekapitulasi — MyBidder.ID" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">Laporan & Rekapitulasi Transaksi</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Ringkasan realisasi pelunasan, konversi lot, dan riwayat penawaran berdasarkan periode
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <LiveSyncBadge
                            onManualRefresh={manualRefresh}
                            lastUpdated={lastUpdated}
                        />

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="h-9 inline-flex items-center gap-2 px-3.5 rounded-lg text-xs font-medium bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition-colors duration-150"
                        >
                            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                            </svg>
                            <span>Cetak laporan</span>
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span>Dari:</span>
                        <input
                            type="date"
                            defaultValue={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs font-mono"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span>Sampai:</span>
                        <input
                            type="date"
                            defaultValue={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs font-mono"
                        />
                    </div>

                    <select
                        defaultValue={filters.category_id}
                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        defaultValue={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua status lelang</option>
                        <option value="sold">Terjual (Ada pemenang)</option>
                        <option value="settled">Lunas & terkirim</option>
                        <option value="ended">Menunggu pelunasan</option>
                        <option value="active">Sedang berlangsung</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>

                    <label className="flex items-center gap-2 text-xs text-neutral-700 ml-auto cursor-pointer select-none bg-neutral-50 h-9 px-3 rounded-lg border border-neutral-200">
                        <input
                            type="checkbox"
                            checked={Boolean(filters.only_sold)}
                            onChange={(e) => handleFilterChange('only_sold', e.target.checked ? 1 : '')}
                            className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                        />
                        <span className="font-medium">Hanya lot terjual</span>
                    </label>
                </div>

                {/* Period Summary KPI Cards (Pure Numbers, Tabular) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 tabular-nums">
                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">Total lot</span>
                        <p className="text-2xl font-semibold font-mono text-neutral-900 mt-1">{liveSummary.total_items}</p>
                        <span className="text-[11px] text-neutral-400">Dalam periode terpilih</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">Lot terjual</span>
                        <p className="text-2xl font-semibold font-mono text-neutral-900 mt-1">{liveSummary.sold_items}</p>
                        <span className="text-[11px] text-neutral-400">Memiliki pemenang sah</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">Tingkat konversi</span>
                        <p className="text-2xl font-semibold font-mono text-neutral-900 mt-1">{liveSummary.conversion_rate}%</p>
                        <span className="text-[11px] text-neutral-400">Rasio lot berpemenang</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">Total penawaran</span>
                        <p className="text-2xl font-semibold font-mono text-neutral-900 mt-1">{liveSummary.total_bids}</p>
                        <span className="text-[11px] text-neutral-400">Rata-rata {liveSummary.avg_bids_per_auction} bid/lot</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">Nilai akhir menang</span>
                        <p className="text-base font-semibold font-mono text-neutral-900 mt-2 truncate">{formatRupiah(liveSummary.total_gross_bidding)}</p>
                        <span className="text-[11px] text-neutral-400">Akumulasi harga menang</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                        <span className="text-xs font-medium text-neutral-500">Realisasi lunas</span>
                        <p className="text-base font-semibold font-mono text-emerald-700 mt-2 truncate">{formatRupiah(liveSummary.total_verified_settlement)}</p>
                        <span className="text-[11px] text-neutral-400">Pembayaran terverifikasi</span>
                    </div>
                </div>

                {/* Detail Table */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between text-xs">
                        <h3 className="font-semibold text-neutral-900">
                            {filters.only_sold ? 'Daftar Lot Terjual' : 'Rekapitulasi Seluruh Sesi Lelang'}
                        </h3>
                        <span className="text-neutral-500 font-mono tabular-nums">
                            {liveAuctions.total} lot tercatat
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3.5">Barang lelang</th>
                                    <th className="px-5 py-3.5">Kategori</th>
                                    <th className="px-5 py-3.5">Pemenang sah</th>
                                    <th className="px-5 py-3.5 text-right">Harga pembukaan</th>
                                    <th className="px-5 py-3.5 text-right">Harga akhir</th>
                                    <th className="px-5 py-3.5 text-right">Jumlah bid</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Waktu sesi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {liveAuctions.data.length > 0 ? (
                                    liveAuctions.data.map((auction) => (
                                        <tr key={auction.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-neutral-900 line-clamp-1 max-w-xs">{auction.title}</p>
                                                <span className="text-[11px] font-mono text-neutral-400">Lot #{auction.id}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-neutral-600">
                                                {auction.category.name}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {auction.winner ? (
                                                    <div>
                                                        <p className="text-neutral-900 font-medium">{auction.winner.name}</p>
                                                        <span className="text-[11px] text-neutral-400">{auction.winner.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400">Belum ada pemenang</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono text-neutral-600">
                                                {formatRupiah(auction.starting_price)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-semibold text-neutral-900">
                                                {formatRupiah(auction.current_price)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono text-neutral-700">
                                                {auction.valid_bids_count}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {auction.status === 'settled' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Lunas
                                                    </span>
                                                )}
                                                {auction.status === 'ended' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                        Menunggu pelunasan
                                                    </span>
                                                )}
                                                {auction.status === 'active' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-white">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        <span>Live</span>
                                                    </span>
                                                )}
                                                {auction.status === 'cancelled' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                        Dibatalkan
                                                    </span>
                                                )}
                                                {auction.status === 'draft' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                                        Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-neutral-500 font-mono text-[11px]">
                                                <p className="text-neutral-700">{formatDateTime(auction.created_at)}</p>
                                                <p className="text-neutral-400">Tutup: {formatDateTime(auction.end_time)}</p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-10 text-neutral-400">
                                            Tidak ada data transaksi pada filter dan rentang tanggal ini
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        paginator={liveAuctions}
                        onNavigateUrl={fetchUrl}
                        isLoading={isNavigatingPage}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
