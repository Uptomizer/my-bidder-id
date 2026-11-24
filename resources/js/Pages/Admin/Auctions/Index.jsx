import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Pagination from '@/Components/Pagination';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah, formatDateTime, getTimeRemaining, syncAuctionEnded } from '@/Utils/format';

function LiveTimerBadge({ endTime, onEnd }) {
    const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(endTime));

    useEffect(() => {
        const interval = setInterval(() => {
            const rem = getTimeRemaining(endTime);
            setTimeLeft(rem);
            if (rem.isEnded) {
                clearInterval(interval);
                syncAuctionEnded();
                if (onEnd) onEnd();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [endTime, onEnd]);

    if (timeLeft.isEnded) {
        return (
            <span className="inline-flex items-center font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 whitespace-nowrap tabular-nums">
                00:00:00
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 whitespace-nowrap tabular-nums">
            <span>
                {timeLeft.days > 0 ? `${timeLeft.days}h ` : ''}
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </span>
    );
}

function AuctionStatusTimer({ auction, onAuctionEnded }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (auction.status !== 'active') return;

        const interval = setInterval(() => {
            const current = Date.now();
            setNow(current);
            if (new Date(auction.end_time).getTime() <= current) {
                clearInterval(interval);
                syncAuctionEnded();
                if (onAuctionEnded) onAuctionEnded(auction);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [auction.status, auction.end_time]);

    const isTimeExpired = auction.status === 'active' && new Date(auction.end_time).getTime() <= now;
    const isEnded = auction.status === 'ended' || isTimeExpired;
    const isActive = auction.status === 'active' && !isTimeExpired;
    const isSettled = auction.status === 'settled';
    const isDraft = auction.status === 'draft';
    const isCancelled = auction.status === 'cancelled';

    return (
        <div className="space-y-1 min-w-[190px] whitespace-nowrap tabular-nums">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
                {isActive && (
                    <>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-white whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span>Live</span>
                        </span>
                        <LiveTimerBadge
                            endTime={auction.end_time}
                            onEnd={() => {
                                setNow(Date.now());
                                if (onAuctionEnded) onAuctionEnded(auction);
                            }}
                        />
                    </>
                )}

                {isEnded && (
                    <>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                            Ditutup
                        </span>
                        <span className="inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 border border-neutral-200 whitespace-nowrap">
                            00:00:00
                        </span>
                    </>
                )}

                {isSettled && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        Lunas & siap kirim
                    </span>
                )}

                {isDraft && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 whitespace-nowrap">
                        Draft
                    </span>
                )}

                {isCancelled && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                        Dibatalkan
                    </span>
                )}
            </div>

            <div className="text-[11px] font-mono text-neutral-500 whitespace-nowrap">
                {isDraft ? 'Mulai: ' : 'Tutup: '}
                <span className="text-neutral-700">
                    {formatDateTime(isDraft ? auction.start_time || auction.created_at : auction.end_time)}
                </span>
            </div>
        </div>
    );
}

export default function Index({ auctions, categories, filters }) {
    const { manualRefresh, fetchUrl, isNavigatingPage, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['auctions'],
    });

    const liveAuctions = polledData?.auctions || auctions;
    const [confirmState, setConfirmState] = useState(null);
    const [processingAction, setProcessingAction] = useState(false);

    const handlePublish = (auction) => {
        setConfirmState({
            type: 'publish',
            auction,
            title: 'Konfirmasi rilis lot lelang (Live)',
            message: 'Pastikan nama barang, harga, dan deskripsi di bawah ini telah sesuai sebelum dirilis ke katalog publik.',
            confirmText: 'Ya, rilis Live',
            processingText: 'Merilis...',
            variant: 'success',
        });
    };

    const handleCloseAuction = (auction) => {
        setConfirmState({
            type: 'close',
            auction,
            title: 'Tutup sesi lelang',
            message: `Apakah Anda yakin ingin menutup lelang "${auction.title}" sekarang dan menetapkan pemenang tertinggi?`,
            confirmText: 'Ya, tutup lelang',
            processingText: 'Menutup...',
            variant: 'warning',
        });
    };

    const handleApproveWinner = (auction) => {
        const candidate = auction.valid_bids?.[0]?.user?.name || 'Penawar tertinggi';
        setConfirmState({
            type: 'approve',
            auction,
            title: 'Setujui pemenang lelang',
            message: `Setujui "${candidate}" (${formatRupiah(auction.current_price)}) sebagai pemenang resmi lelang "${auction.title}" dan kirimkan tagihan otomatis?`,
            confirmText: 'Setujui & kirim invoice',
            processingText: 'Menyetujui...',
            variant: 'success',
        });
    };

    const handleDelete = (auction) => {
        setConfirmState({
            type: 'delete',
            auction,
            title: 'Hapus lot draft',
            message: `Apakah Anda yakin ingin menghapus draft "${auction.title}" secara permanen?`,
            confirmText: 'Ya, hapus',
            processingText: 'Menghapus...',
            variant: 'danger',
        });
    };

    const executeConfirmedAction = () => {
        if (!confirmState) return;
        const { type, auction } = confirmState;
        setProcessingAction(true);

        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                manualRefresh();
                broadcastLiveSync(`auction-${type}`);
                setConfirmState(null);
            },
            onFinish: () => {
                setProcessingAction(false);
            },
        };

        if (type === 'publish') {
            router.post(route('admin.auctions.publish', auction.id), {}, options);
        } else if (type === 'close') {
            router.post(route('admin.auctions.close', auction.id), {}, options);
        } else if (type === 'approve') {
            router.post(route('admin.auctions.approve-winner', auction.id), {}, options);
        } else if (type === 'delete') {
            router.delete(route('admin.auctions.destroy', auction.id), options);
        }
    };

    return (
        <AdminLayout title="Manajemen Item Lelang">
            <Head title="Manajemen Lelang — MyBidder.ID" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">Daftar Lot Lelang</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Kelola lot draft, publikasikan ke status Live, dan lakukan persetujuan pemenang
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <LiveSyncBadge
                            onManualRefresh={manualRefresh}
                            lastUpdated={lastUpdated}
                        />

                        <Link
                            href={route('admin.auctions.create')}
                            className="h-9 inline-flex items-center gap-1.5 px-4 rounded-lg font-medium text-xs bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                        >
                            <span>+ Tambah lot baru</span>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200">
                    <input
                        type="text"
                        placeholder="Cari nama lot..."
                        defaultValue={filters.search}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                router.get(
                                    route('admin.auctions.index'),
                                    {
                                        ...filters,
                                        search: e.target.value,
                                    },
                                    { preserveState: true }
                                );
                            }
                        }}
                        className="h-9 px-3.5 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs w-64 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                    />

                    <select
                        defaultValue={filters.status}
                        onChange={(e) =>
                            router.get(
                                route('admin.auctions.index'),
                                { ...filters, status: e.target.value },
                                { preserveState: true }
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua status</option>
                        <option value="active">Sedang berlangsung (Live)</option>
                        <option value="draft">Draft (Dapat diedit / dihapus)</option>
                        <option value="ended">Ditutup (Ended)</option>
                        <option value="settled">Lunas & siap kirim</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>

                    <select
                        defaultValue={filters.category_id}
                        onChange={(e) =>
                            router.get(
                                route('admin.auctions.index'),
                                { ...filters, category_id: e.target.value },
                                { preserveState: true }
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-900">
                            Katalog Lot Lelang
                        </span>
                        <span className="text-neutral-500 font-mono tabular-nums">
                            {liveAuctions.total} lot terdaftar
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3.5 min-w-[230px]">Barang & penawaran</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Kategori</th>
                                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Harga awal & kelipatan</th>
                                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Tawaran tertinggi</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap min-w-[200px]">Status & waktu</th>
                                    <th className="px-5 py-3.5 min-w-[160px]">Pemenang / kandidat</th>
                                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {liveAuctions.data.length > 0 ? (
                                    liveAuctions.data.map((auction) => {
                                        const topBid = auction.valid_bids?.[0];

                                        return (
                                            <tr key={auction.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                                <td className="px-5 py-3.5 min-w-[230px]">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={
                                                                auction.images[0] ||
                                                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'
                                                            }
                                                            alt={auction.title}
                                                            className="w-11 h-11 rounded-lg object-cover border border-neutral-200 shrink-0"
                                                        />
                                                        <div>
                                                            <a
                                                                href={route('auctions.show', auction.slug)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="font-semibold text-neutral-900 hover:text-amber-700 transition-colors duration-150 line-clamp-1 max-w-xs block"
                                                            >
                                                                {auction.title} ↗
                                                            </a>
                                                            <span className="text-[11px] font-mono text-neutral-500">
                                                                {auction.bids_count} penawaran
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-neutral-600 whitespace-nowrap">
                                                    {auction.category.name}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
                                                    <p className="font-medium text-neutral-800">{formatRupiah(auction.starting_price)}</p>
                                                    <p className="text-[11px] text-neutral-500">+{formatRupiah(auction.min_increment)}</p>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono font-semibold text-neutral-900 text-sm whitespace-nowrap">
                                                    {formatRupiah(auction.current_price)}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap min-w-[200px]">
                                                    <AuctionStatusTimer auction={auction} onAuctionEnded={manualRefresh} />
                                                </td>
                                                <td className="px-5 py-3.5 text-neutral-700 min-w-[160px]">
                                                    {auction.winner ? (
                                                        <div>
                                                            <span className="font-medium text-neutral-900 block">
                                                                {auction.winner.name}
                                                            </span>
                                                            <span className="text-[11px] text-emerald-700 font-medium">
                                                                Pemenang disetujui
                                                            </span>
                                                        </div>
                                                    ) : topBid?.user ? (
                                                        <div>
                                                            <span className="font-medium text-neutral-800 block">
                                                                {topBid.user.name}
                                                            </span>
                                                            <span className="text-[11px] text-neutral-500">
                                                                Penawar tertinggi
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-neutral-400">Belum ada penawaran</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                                    {auction.status === 'draft' ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePublish(auction)}
                                                                className="h-8 px-3 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                                                            >
                                                                Rilis Live
                                                            </button>

                                                            <Link
                                                                href={route('admin.auctions.edit', auction.id)}
                                                                className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 transition-colors duration-150"
                                                            >
                                                                Edit
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(auction)}
                                                                className="h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors duration-150"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {topBid && !auction.winner && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApproveWinner(auction)}
                                                                    className="h-8 px-3 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                                                                >
                                                                    Setujui pemenang
                                                                </button>
                                                            )}

                                                            {auction.status === 'active' && new Date(auction.end_time) > new Date() && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCloseAuction(auction)}
                                                                    className="h-8 px-3 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors duration-150"
                                                                >
                                                                    Tutup lelang
                                                                </button>
                                                            )}

                                                            <span
                                                                className="inline-flex items-center h-8 px-2.5 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200 cursor-not-allowed"
                                                                title="Lot yang sudah Live atau selesai tidak dapat diedit atau dihapus"
                                                            >
                                                                Terkunci
                                                            </span>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-neutral-400">
                                            Tidak ada data lot ditemukan
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

            <ConfirmModal
                isOpen={Boolean(confirmState)}
                onClose={() => {
                    if (!processingAction) setConfirmState(null);
                }}
                onConfirm={executeConfirmedAction}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmText={confirmState?.confirmText}
                processingText={confirmState?.processingText}
                variant={confirmState?.variant || 'warning'}
                processing={processingAction}
            >
                {confirmState?.type === 'publish' && confirmState?.auction && (
                    <div className="space-y-3 text-left tabular-nums">
                        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5 text-xs">
                            <div>
                                <span className="text-neutral-500 block">
                                    Nama barang
                                </span>
                                <p className="font-semibold text-neutral-900 text-sm">
                                    {confirmState.auction.title}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200">
                                <div>
                                    <span className="text-neutral-500 block">
                                        Harga pembukaan (OB)
                                    </span>
                                    <p className="font-mono font-semibold text-neutral-900 text-sm">
                                        {formatRupiah(confirmState.auction.starting_price)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block">
                                        Kelipatan penawaran
                                    </span>
                                    <p className="font-mono font-medium text-neutral-800 text-sm">
                                        +{formatRupiah(confirmState.auction.min_increment)}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-neutral-200">
                                <span className="text-neutral-500 block mb-1">
                                    Deskripsi barang
                                </span>
                                <div className="max-h-28 overflow-y-auto text-neutral-600 text-xs leading-relaxed whitespace-pre-line bg-white p-2.5 rounded-lg border border-neutral-200">
                                    {confirmState.auction.description || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-neutral-100 border border-neutral-200">
                            <span className="text-xs text-neutral-700">
                                Perlu menyesuaikan data sebelum rilis?
                            </span>
                            <Link
                                href={route('admin.auctions.edit', confirmState.auction.id)}
                                className="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 transition-colors duration-150"
                            >
                                Edit barang
                            </Link>
                        </div>
                    </div>
                )}
            </ConfirmModal>
        </AdminLayout>
    );
}
