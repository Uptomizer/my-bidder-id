import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Pagination from '@/Components/Pagination';
import Spinner from '@/Components/Spinner';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah, formatDateTime } from '@/Utils/format';
import { useState } from 'react';

export default function Index({ bids, auctions, filters }) {
    const [actionMenuBid, setActionMenuBid] = useState(null);
    const [selectedBid, setSelectedBid] = useState(null);
    const [checkingBid, setCheckingBid] = useState(null);
    const [confirmBidAction, setConfirmBidAction] = useState(null);
    const [processingAction, setProcessingAction] = useState(false);
    const [verifyingBidder, setVerifyingBidder] = useState(false);
    const [adminVerifNote, setAdminVerifNote] = useState('');
    const [checklist, setChecklist] = useState({
        fullName: true,
        phone: true,
        addressAndPostal: true,
        extraDetails: true,
    });

    const { data, setData, post, processing, reset } = useForm({
        reason: 'Penawaran tidak wajar / terindikasi bid fiktif',
    });

    const { manualRefresh, fetchUrl, isNavigatingPage, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['bids', 'filters'],
    });

    const liveBids = polledData?.bids || bids;
    const liveFilters = polledData?.filters || filters;

    const handleOpenCheckModal = (bid) => {
        setCheckingBid(bid);
        setAdminVerifNote(bid.auction?.winner_verification_note || '');
        setChecklist({
            fullName: true,
            phone: true,
            addressAndPostal: true,
            extraDetails: true,
        });
    };

    const handleVerifyBidderAction = (actionType) => {
        if (!checkingBid) return;
        setVerifyingBidder(true);

        router.post(
            route('admin.bids.verify-bidder', checkingBid.id),
            {
                action: actionType,
                note: adminVerifNote,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setCheckingBid(null);
                    manualRefresh();
                    broadcastLiveSync(`bidder-verified-${actionType}`);
                },
                onFinish: () => {
                    setVerifyingBidder(false);
                },
            }
        );
    };

    const handleOpenDisqualifyModal = (bid) => {
        setSelectedBid(bid);
    };

    const handleDisqualifySubmit = (e) => {
        e.preventDefault();
        post(route('admin.bids.disqualify', selectedBid.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedBid(null);
                reset();
                manualRefresh();
                broadcastLiveSync('bid-disqualified');
            },
        });
    };

    const handleRestore = (bid) => {
        setConfirmBidAction({
            type: 'restore',
            bid,
            title: 'Pulihkan penawaran',
            message: `Pulihkan tawaran sebesar ${formatRupiah(bid.amount)} dari ${bid.user.name} menjadi sah kembali?`,
            confirmText: 'Ya, pulihkan',
            processingText: 'Memulihkan...',
            variant: 'success',
        });
    };

    const handleSetWinner = (bid) => {
        setConfirmBidAction({
            type: 'set-winner',
            bid,
            title: 'Tetapkan pemenang resmi',
            message: `Tetapkan penawar ${bid.user.name} (${formatRupiah(bid.amount)}) sebagai pemenang resmi lelang "${bid.auction.title}" dan tutup sesi lelang ini?`,
            confirmText: 'Tetapkan pemenang',
            processingText: 'Menetapkan...',
            variant: 'success',
        });
    };

    const executeConfirmedBidAction = () => {
        if (!confirmBidAction) return;
        const { type, bid } = confirmBidAction;
        setProcessingAction(true);

        const targetRoute =
            type === 'restore'
                ? route('admin.bids.restore', bid.id)
                : route('admin.bids.set-winner', bid.id);

        router.post(
            targetRoute,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setConfirmBidAction(null);
                    manualRefresh();
                    broadcastLiveSync(`bid-${type}`);
                },
                onFinish: () => {
                    setProcessingAction(false);
                },
            }
        );
    };

    return (
        <AdminLayout title="Verifikasi & Moderasi Penawaran">
            <Head title="Verifikasi Penawaran — MyBidder.ID" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">
                            Verifikasi Data Penawar & Moderasi Penawaran
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Klik tombol Cek untuk memeriksa nama lengkap, nomor telepon aktif, alamat, kode pos, dan detail tambahan sebelum menyetujui lanjut ke pembayaran
                        </p>
                    </div>

                    <LiveSyncBadge
                        onManualRefresh={manualRefresh}
                        lastUpdated={lastUpdated}
                    />
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200">
                    <input
                        type="text"
                        placeholder="Cari nama atau email penawar..."
                        defaultValue={liveFilters.search}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                fetchUrl(
                                    route('admin.bids.index', {
                                        ...liveFilters,
                                        search: e.target.value,
                                    })
                                );
                            }
                        }}
                        className="h-9 px-3.5 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs w-64 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                    />

                    <select
                        value={liveFilters.status || ''}
                        onChange={(e) =>
                            fetchUrl(
                                route('admin.bids.index', {
                                    ...liveFilters,
                                    status: e.target.value,
                                })
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua status penawaran</option>
                        <option value="valid">Sah (Valid)</option>
                        <option value="disqualified">Dibatalkan / Diskualifikasi</option>
                    </select>

                    <select
                        value={liveFilters.data_status || ''}
                        onChange={(e) =>
                            fetchUrl(
                                route('admin.bids.index', {
                                    ...liveFilters,
                                    data_status: e.target.value,
                                })
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua status data</option>
                        <option value="paid">Sudah bayar</option>
                        <option value="ready_to_pay">Siap bayar (Terverifikasi)</option>
                        <option value="pending_check">Form masuk — Perlu dicek</option>
                        <option value="needs_revision">Menunggu perbaikan data</option>
                        <option value="unsubmitted">Belum isi form</option>
                    </select>

                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span>Tanggal:</span>
                        <input
                            type="date"
                            value={liveFilters.date || ''}
                            onChange={(e) =>
                                fetchUrl(
                                    route('admin.bids.index', {
                                        ...liveFilters,
                                        date: e.target.value,
                                    })
                                )
                            }
                            className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs font-mono"
                        />
                        {liveFilters.date && (
                            <button
                                type="button"
                                onClick={() =>
                                    fetchUrl(
                                        route('admin.bids.index', {
                                            ...liveFilters,
                                            date: '',
                                        })
                                    )
                                }
                                className="h-9 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-medium transition-colors duration-150"
                                title="Reset filter tanggal"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-900">
                            Daftar Penawaran & Verifikasi Data Bidder
                        </span>
                        <span className="text-neutral-500 font-mono tabular-nums">
                            {liveBids.total} penawaran tercatat
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3.5">Penawar</th>
                                    <th className="px-5 py-3.5">Barang lelang</th>
                                    <th className="px-5 py-3.5 text-right">Nominal bid</th>
                                    <th className="px-5 py-3.5">Status bid</th>
                                    <th className="px-5 py-3.5">Status data</th>
                                    <th className="px-5 py-3.5">Waktu bid</th>
                                    <th className="px-5 py-3.5 text-right">Verifikasi & moderasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {liveBids.data.length > 0 ? (
                                    liveBids.data.map((bid) => {
                                        const isWinner = bid.auction?.winner_id === bid.user_id;
                                        const vStatus = bid.auction?.winner_verification_status || 'unsubmitted';
                                        const paymentStatus = bid.auction?.payment?.status;
                                        const isPaidVerified =
                                            bid.auction?.status === 'settled' || paymentStatus === 'verified';
                                        const isPaidPending = paymentStatus === 'pending_verification';

                                        return (
                                            <tr key={bid.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-medium text-neutral-900">{bid.user.name}</p>
                                                        {isWinner && (
                                                            <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[10px] font-medium">
                                                                Pemenang
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-neutral-500">{bid.user.email}</p>
                                                    {(bid.auction?.winner_phone || bid.user?.phone) && (
                                                        <p className="text-[11px] font-mono text-neutral-600 mt-0.5">
                                                            {bid.auction?.winner_phone || bid.user?.phone}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="font-medium text-neutral-900 line-clamp-1 max-w-xs">
                                                        {bid.auction.title}
                                                    </p>
                                                    <span className="text-[11px] text-neutral-500">
                                                        {bid.auction.category.name}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono font-semibold text-neutral-900 text-sm whitespace-nowrap">
                                                    {formatRupiah(bid.amount)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {bid.status === 'valid' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Sah
                                                        </span>
                                                    ) : (
                                                        <div>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                                Dibatalkan
                                                            </span>
                                                            {bid.disqualified_reason && (
                                                                <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                                                                    {bid.disqualified_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {isPaidVerified ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-white">
                                                            Sudah bayar (Lunas)
                                                        </span>
                                                    ) : isPaidPending ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                            Sudah bayar (Cek bukti)
                                                        </span>
                                                    ) : vStatus === 'approved' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Siap bayar (Terverifikasi)
                                                        </span>
                                                    ) : vStatus === 'pending' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                            Form masuk — Perlu dicek
                                                        </span>
                                                    ) : vStatus === 'rejected' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                            Menunggu perbaikan data
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                                                            Belum isi form
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                                                    {formatDateTime(bid.created_at)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActionMenuBid(bid)}
                                                            className="relative h-8 w-8 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center transition-colors duration-150"
                                                            title="Opsi verifikasi & moderasi penawaran"
                                                            aria-label="Opsi verifikasi & moderasi penawaran"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                                            </svg>
                                                            {vStatus === 'pending' && (
                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-neutral-400">
                                            Tidak ada data penawaran
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        paginator={liveBids}
                        onNavigateUrl={fetchUrl}
                        isLoading={isNavigatingPage}
                    />
                </div>
            </div>

            {/* POP-UP OPSI TITIK 3 (⋯): Menu Pilihan Verifikasi & Moderasi Penawaran */}
            {actionMenuBid && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setActionMenuBid(null)}
                    />
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-lg relative z-10 space-y-4 tabular-nums">
                        <div className="flex items-start justify-between pb-3.5 border-b border-neutral-200">
                            <div>
                                <span className="text-xs font-mono text-neutral-500 block">
                                    Opsi penawaran #{actionMenuBid.id}
                                </span>
                                <h3 className="font-semibold text-base text-neutral-900 mt-0.5">
                                    {actionMenuBid.user?.name}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                                    {actionMenuBid.auction?.title} —{' '}
                                    <strong className="font-mono font-semibold text-neutral-900">
                                        {formatRupiah(actionMenuBid.amount)}
                                    </strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActionMenuBid(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2">
                            {actionMenuBid.status === 'valid' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = actionMenuBid;
                                        setActionMenuBid(null);
                                        handleOpenCheckModal(target);
                                    }}
                                    className="w-full text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors duration-150 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-neutral-900">
                                                    Cek & Verifikasi Data Penawar
                                                </span>
                                                {actionMenuBid.auction?.winner_verification_status === 'pending' && (
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">
                                                        Form masuk
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-neutral-500 block mt-0.5 leading-relaxed">
                                                Periksa nama lengkap, nomor telepon aktif, alamat, kode pos, dan setujui lanjut pembayaran
                                            </span>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-neutral-400 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            )}

                            {actionMenuBid.status === 'valid' &&
                                actionMenuBid.auction?.winner_id !== actionMenuBid.user_id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const target = actionMenuBid;
                                            setActionMenuBid(null);
                                            handleSetWinner(target);
                                        }}
                                        className="w-full text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors duration-150 flex items-start justify-between gap-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-neutral-900 block">
                                                    Tetapkan sebagai Pemenang Resmi
                                                </span>
                                                <span className="text-xs text-neutral-500 block mt-0.5 leading-relaxed">
                                                    Setujui penawar ini sebagai pemenang lot dan terbitkan invoice otomatis
                                                </span>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-neutral-400 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                )}

                            {actionMenuBid.status === 'valid' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = actionMenuBid;
                                        setActionMenuBid(null);
                                        handleOpenDisqualifyModal(target);
                                    }}
                                    className="w-full text-left p-3.5 rounded-xl border border-red-200 bg-red-50/40 hover:bg-red-50 transition-colors duration-150 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-red-700 block">
                                                Batalkan / Diskualifikasi Penawaran
                                            </span>
                                            <span className="text-xs text-red-600/80 block mt-0.5 leading-relaxed">
                                                Batalkan penawaran tidak wajar dan sesuaikan kembali harga tertinggi lelang
                                            </span>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-red-400 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = actionMenuBid;
                                        setActionMenuBid(null);
                                        handleRestore(target);
                                    }}
                                    className="w-full text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors duration-150 flex items-start justify-between gap-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-neutral-900 block">
                                                Pulihkan Penawaran Menjadi Sah
                                            </span>
                                            <span className="text-xs text-neutral-500 block mt-0.5 leading-relaxed">
                                                Kembalikan status penawaran ini menjadi valid
                                            </span>
                                        </div>
                                    </div>
                                    <svg className="w-4 h-4 text-neutral-400 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            )}

                            {actionMenuBid.auction?.slug && (
                                <a
                                    href={route('auctions.show', actionMenuBid.auction.slug)}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setActionMenuBid(null)}
                                    className="w-full text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors duration-150 flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-neutral-900 block">
                                                Lihat Halaman Detail Lot Lelang
                                            </span>
                                            <span className="text-xs text-neutral-500 block">
                                                Buka halaman publik lot di tab baru
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-neutral-400">↗</span>
                                </a>
                            )}
                        </div>

                        <div className="pt-2 border-t border-neutral-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setActionMenuBid(null)}
                                className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POP-UP MODAL TOMBOL "CEK": Verifikasi Input Form Bidder */}
            {checkingBid && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-xl w-full shadow-lg relative max-h-[92vh] overflow-y-auto space-y-4">
                        <div className="flex items-start justify-between pb-4 border-b border-neutral-200">
                            <div>
                                <h3 className="font-semibold text-base text-neutral-900">
                                    Cek & Verifikasi Data Penawar (Bidder)
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                                    {checkingBid.auction?.title} — Penawaran:{' '}
                                    <strong className="font-mono font-semibold text-neutral-900">
                                        {formatRupiah(checkingBid.amount)}
                                    </strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCheckingBid(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        <div
                            className={`px-3.5 py-2.5 rounded-lg border text-xs ${
                                checkingBid.auction?.winner_verification_status === 'approved'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : checkingBid.auction?.winner_verification_status === 'pending'
                                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                                    : checkingBid.auction?.winner_verification_status === 'rejected'
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                            }`}
                        >
                            <span className="font-medium">
                                {checkingBid.auction?.winner_verification_status === 'approved'
                                    ? 'Status: Data telah diverifikasi & disetujui lanjut pembayaran'
                                    : checkingBid.auction?.winner_verification_status === 'pending'
                                    ? 'Status: Bidder telah mengirim formulir — Menunggu approve Admin'
                                    : checkingBid.auction?.winner_verification_status === 'rejected'
                                    ? 'Status: Diminta perbaikan data oleh Admin'
                                    : 'Status: Bidder belum mengirim formulir verifikasi pemenang'}
                            </span>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-lg border border-neutral-200">
                                    <span className="text-neutral-500 block">
                                        1. Nama lengkap
                                    </span>
                                    <p className="font-semibold text-neutral-900 text-sm mt-0.5">
                                        {checkingBid.auction?.winner_full_name || checkingBid.user?.name || '-'}
                                    </p>
                                    <span className="text-[11px] text-neutral-400">
                                        Akun: {checkingBid.user?.email}
                                    </span>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-neutral-200">
                                    <span className="text-neutral-500 block">
                                        2. Nomor telepon aktif (Dapat dihubungi)
                                    </span>
                                    <p className="font-mono font-semibold text-neutral-900 text-sm mt-0.5">
                                        {checkingBid.auction?.winner_phone ||
                                            checkingBid.user?.phone ||
                                            '(Belum diisi)'}
                                    </p>
                                    <span className="text-[11px] text-neutral-400">
                                        Nomor kontak aktif
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-neutral-200">
                                <span className="text-neutral-500 block">
                                    3. Alamat lengkap pengiriman
                                </span>
                                <p className="font-medium text-neutral-800 text-xs mt-1 leading-relaxed whitespace-pre-line">
                                    {checkingBid.auction?.winner_address ||
                                        '(Bidder belum mengisi alamat lengkap pengiriman)'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-lg border border-neutral-200">
                                    <span className="text-neutral-500 block">
                                        4. Kode pos
                                    </span>
                                    <p className="font-mono font-semibold text-neutral-900 text-sm mt-0.5">
                                        {checkingBid.auction?.winner_postal_code || '(Belum diisi)'}
                                    </p>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-neutral-200">
                                    <span className="text-neutral-500 block">
                                        5. Alamat lainnya / No. apartemen (Opsional)
                                    </span>
                                    <p className="font-medium text-neutral-800 text-xs mt-0.5">
                                        {checkingBid.auction?.winner_address_detail || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-neutral-200">
                                <span className="text-neutral-500 block">
                                    6. Pelengkap lainnya / catatan tambahan
                                </span>
                                <p className="text-neutral-700 text-xs mt-1 leading-relaxed">
                                    {checkingBid.auction?.winner_notes || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                            <span className="text-xs font-semibold text-neutral-800 block">
                                Checklist pengecekan Admin:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist.fullName}
                                        onChange={(e) =>
                                            setChecklist({ ...checklist, fullName: e.target.checked })
                                        }
                                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                                    />
                                    <span>Nama lengkap sesuai</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist.phone}
                                        onChange={(e) =>
                                            setChecklist({ ...checklist, phone: e.target.checked })
                                        }
                                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                                    />
                                    <span>No. telepon aktif & valid</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist.addressAndPostal}
                                        onChange={(e) =>
                                            setChecklist({
                                                ...checklist,
                                                addressAndPostal: e.target.checked,
                                            })
                                        }
                                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                                    />
                                    <span>Alamat & kode pos lengkap</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist.extraDetails}
                                        onChange={(e) =>
                                            setChecklist({
                                                ...checklist,
                                                extraDetails: e.target.checked,
                                            })
                                        }
                                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                                    />
                                    <span>Detail apartemen & pelengkap sesuai</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1">
                                Catatan verifikasi Admin (Opsional)
                            </label>
                            <input
                                type="text"
                                placeholder="Tambahkan catatan verifikasi atau alasan jika meminta perbaikan data..."
                                value={adminVerifNote}
                                onChange={(e) => setAdminVerifNote(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                            />
                        </div>

                        <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                            <button
                                type="button"
                                disabled={verifyingBidder}
                                onClick={() => handleVerifyBidderAction('reject')}
                                className="w-full sm:w-auto h-9 px-3.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors duration-150 disabled:opacity-50"
                            >
                                Minta perbaikan data
                            </button>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    disabled={verifyingBidder}
                                    onClick={() => setCheckingBid(null)}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    disabled={verifyingBidder}
                                    onClick={() => handleVerifyBidderAction('approve')}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {verifyingBidder ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                            <span>Memverifikasi...</span>
                                        </>
                                    ) : (
                                        <span>Approve & izinkan lanjut pembayaran</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel/Disqualify Modal */}
            {selectedBid && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-lg relative">
                        <h3 className="font-semibold text-base text-neutral-900 mb-1.5">
                            Batalkan Penawaran
                        </h3>
                        <p className="text-xs text-neutral-600 mb-4 tabular-nums">
                            Tawaran <strong className="font-mono font-semibold text-neutral-900">{formatRupiah(selectedBid.amount)}</strong> oleh <strong className="text-neutral-900">{selectedBid.user.name}</strong> akan dibatalkan.
                        </p>

                        <form onSubmit={handleDisqualifySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Alasan pembatalan bid
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => setSelectedBid(null)}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="h-9 px-4 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <span>Batalkan bid</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(confirmBidAction)}
                onClose={() => {
                    if (!processingAction) setConfirmBidAction(null);
                }}
                onConfirm={executeConfirmedBidAction}
                title={confirmBidAction?.title}
                message={confirmBidAction?.message}
                confirmText={confirmBidAction?.confirmText}
                processingText={confirmBidAction?.processingText}
                variant={confirmBidAction?.variant || 'success'}
                processing={processingAction}
            />
        </AdminLayout>
    );
}
