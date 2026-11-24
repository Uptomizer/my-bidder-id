import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import UserLayout from '@/Layouts/UserLayout';
import CountdownTimer from '@/Components/CountdownTimer';
import Pagination from '@/Components/Pagination';
import Spinner from '@/Components/Spinner';
import { showToast } from '@/Components/ToastNotification';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah, syncAuctionEnded } from '@/Utils/format';
import { useState, useEffect, useRef } from 'react';

export default function Show({ auction: initialAuction, bidHistory, bids, nextMinBid, userBidStatus }) {
    const { auth } = usePage().props;
    const [auctionState, setAuctionState] = useState(initialAuction);
    const [selectedImage, setSelectedImage] = useState(initialAuction.images?.[0] || null);

    const initialBids = bidHistory || bids || [];
    const [liveBids, setLiveBids] = useState(initialBids);
    const [liveCurrentPrice, setLiveCurrentPrice] = useState(initialAuction.current_price);
    const [priceHighlightFlash, setPriceHighlightFlash] = useState(false);
    const [liveNextMinBid, setLiveNextMinBid] = useState(
        nextMinBid || initialAuction.current_price + initialAuction.min_increment
    );
    const [liveUserBidStatus, setLiveUserBidStatus] = useState(userBidStatus);
    const [isLiveState, setIsLiveState] = useState(Boolean(initialAuction.is_live));
    const [outbidRealtimeAlert, setOutbidRealtimeAlert] = useState(null);
    const [bidSuccessMessage, setBidSuccessMessage] = useState(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [submittingBid, setSubmittingBid] = useState(false);
    const [quickBidEnabled, setQuickBidEnabled] = useState(false);
    const [bidHistoryPage, setBidHistoryPage] = useState(1);
    const [bidAmount, setBidAmount] = useState(
        nextMinBid || initialAuction.current_price + initialAuction.min_increment
    );

    const wasHighestBidderRef = useRef(Boolean(userBidStatus?.is_highest_bidder));
    const liveCurrentPriceRef = useRef(initialAuction.current_price);

    useEffect(() => {
        liveCurrentPriceRef.current = liveCurrentPrice;
    }, [liveCurrentPrice]);

    // Trigger subtle visual flash on the price box when price changes
    const triggerPriceFlash = () => {
        setPriceHighlightFlash(true);
        setTimeout(() => setPriceHighlightFlash(false), 900);
    };

    // 1-second background AJAX polling: updates ONLY the bid price & bid history rows without refreshing the page
    useLivePolling({
        intervalMs: 1000,
        only: ['auction', 'bidHistory', 'nextMinBid', 'userBidStatus'],
        onData: (fresh) => {
            if (!fresh?.auction) return;

            const newPrice = fresh.auction.current_price;
            const newNextMin = fresh.nextMinBid || newPrice + fresh.auction.min_increment;
            const priceChanged = newPrice !== liveCurrentPriceRef.current;

            if (priceChanged) {
                setLiveCurrentPrice(newPrice);
                setLiveNextMinBid(newNextMin);
                setBidAmount((prevAmount) => (prevAmount < newNextMin ? newNextMin : prevAmount));
                triggerPriceFlash();
            }

            if (Array.isArray(fresh.bidHistory)) {
                setLiveBids(fresh.bidHistory);
            }

            setAuctionState(fresh.auction);
            setIsLiveState(Boolean(fresh.auction.is_live));

            if (fresh.userBidStatus) {
                if (
                    wasHighestBidderRef.current &&
                    !fresh.userBidStatus.is_highest_bidder &&
                    fresh.userBidStatus.has_bid
                ) {
                    const outbidMsg = `Tawaran Anda baru saja terlampaui! Harga tertinggi saat ini: ${formatRupiah(newPrice)}`;
                    setOutbidRealtimeAlert(outbidMsg);
                    showToast({
                        type: 'warning',
                        title: 'Tawaran Anda Terlampaui!',
                        message: outbidMsg,
                    });
                }
                wasHighestBidderRef.current = Boolean(fresh.userBidStatus.is_highest_bidder);
                setLiveUserBidStatus(fresh.userBidStatus);
            }
        },
    });

    // Optional WebSocket subscription if Reverb is active
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel(`auction.${auctionState.id}`);

            channel.listen('.bid.placed', (e) => {
                setLiveCurrentPrice(e.current_price);
                setLiveNextMinBid(e.next_min_bid);
                setBidAmount(e.next_min_bid);
                triggerPriceFlash();

                setLiveBids((prev) => [
                    {
                        id: e.bid.id,
                        amount: e.bid.amount,
                        masked_bidder_name: e.bid.masked_bidder_name,
                        created_at: 'Baru saja',
                        created_at_raw: new Date().toISOString(),
                    },
                    ...prev.filter((b) => b.id !== e.bid.id),
                ]);

                if (auth.user) {
                    const isUserWinner = e.bid.user_id === auth.user.id;
                    if (wasHighestBidderRef.current && !isUserWinner) {
                        setOutbidRealtimeAlert(
                            `Tawaran Anda baru saja terlampaui oleh ${e.bid.masked_bidder_name} dengan nominal ${formatRupiah(e.current_price)}!`
                        );
                    }
                    wasHighestBidderRef.current = isUserWinner;

                    setLiveUserBidStatus((prev) => ({
                        ...prev,
                        has_bid: prev?.has_bid || isUserWinner,
                        highest_user_bid: isUserWinner ? e.bid.amount : prev?.highest_user_bid,
                        is_highest_bidder: isUserWinner,
                    }));
                }
            });

            return () => {
                window.Echo.leaveChannel(`auction.${auctionState.id}`);
            };
        }
    }, [auctionState.id, auth.user]);

    // Auto-Close handler when CountdownTimer hits 00:00:00 (no page refresh)
    const handleTimerEnded = async () => {
        setIsLiveState(false);
        setShowConfirmModal(false);

        try {
            await syncAuctionEnded();
            const res = await axios.get(window.location.href, {
                headers: { 'X-Live-Poll': '1', Accept: 'application/json' },
            });
            const fresh = res?.data?.props;
            if (fresh?.auction) {
                setAuctionState(fresh.auction);
                setIsLiveState(Boolean(fresh.auction.is_live));
                if (Array.isArray(fresh.bidHistory)) {
                    setLiveBids(fresh.bidHistory);
                }
            }
        } catch {
            // Ignore
        }
    };

    // Watcher: automatically trigger instant close as soon as end_time passes in local time
    useEffect(() => {
        if (!isLiveState) return;

        const interval = setInterval(() => {
            if (new Date(auctionState.end_time).getTime() <= Date.now()) {
                clearInterval(interval);
                handleTimerEnded();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isLiveState, auctionState.end_time]);

    // Client-side validation & opening confirmation pop-up modal
    const handleOpenConfirmation = (e) => {
        e.preventDefault();
        setValidationError('');
        setBidSuccessMessage(null);

        if (!isLiveState) {
            setValidationError('Waktu lelang telah mencapai 00:00:00 (Auto-Close). Fitur penawaran telah dikunci.');
            return;
        }

        const amountNum = Number(bidAmount);

        if (quickBidEnabled) {
            if (!amountNum || (liveBids.length > 0 && amountNum <= liveCurrentPrice) || amountNum < auctionState.starting_price) {
                setValidationError(
                    `Nominal tawaran harus lebih tinggi dari harga saat ini (${formatRupiah(liveCurrentPrice)}).`
                );
                return;
            }
        } else {
            if (!amountNum || amountNum < liveNextMinBid) {
                setValidationError(
                    `Nominal tawaran harus lebih tinggi dari harga saat ini (minimal ${formatRupiah(liveNextMinBid)}).`
                );
                return;
            }

            if (
                auctionState.min_increment > 0 &&
                (amountNum - auctionState.starting_price) % auctionState.min_increment !== 0
            ) {
                setValidationError(
                    `Nominal tawaran harus sesuai dengan aturan kelipatan ${formatRupiah(auctionState.min_increment)}.`
                );
                return;
            }
        }

        setShowConfirmModal(true);
    };

    // Submitting confirmed bid via pure AJAX (updates ONLY the bid price & bid history without refreshing page)
    const handleConfirmBid = async () => {
        setSubmittingBid(true);
        setValidationError('');

        try {
            const res = await axios.post(
                route('auctions.bid', auctionState.id),
                { amount: Number(bidAmount), quick_bid: quickBidEnabled },
                {
                    headers: {
                        'X-Live-Bid': '1',
                        Accept: 'application/json',
                    },
                    timeout: 10000,
                }
            );

            if (res.data?.success) {
                const newPrice = res.data.current_price;
                const newNextMin = res.data.next_min_bid;

                setLiveCurrentPrice(newPrice);
                setLiveNextMinBid(newNextMin);
                setBidAmount(newNextMin);
                triggerPriceFlash();

                if (res.data.bid) {
                    setLiveBids((prev) => [
                        res.data.bid,
                        ...prev.filter((b) => b.id !== res.data.bid.id),
                    ]);
                }

                if (res.data.user_bid_status) {
                    setLiveUserBidStatus(res.data.user_bid_status);
                    wasHighestBidderRef.current = Boolean(res.data.user_bid_status.is_highest_bidder);
                }

                setOutbidRealtimeAlert(null);
                setBidSuccessMessage(res.data.message);
                setShowConfirmModal(false);
                broadcastLiveSync('bid-placed');
                showToast({
                    type: 'success',
                    title: 'Penawaran Berhasil Diajukan!',
                    message: res.data.message,
                });
            }
        } catch (err) {
            const errMsg =
                err?.response?.data?.message ||
                err?.response?.data?.errors?.amount?.[0] ||
                'Gagal mengajukan penawaran. Silakan periksa kembali nominal tawaran Anda.';
            setValidationError(errMsg);
            setShowConfirmModal(false);
            showToast({
                type: 'error',
                title: 'Penawaran Ditolak',
                message: errMsg,
            });
        } finally {
            setSubmittingBid(false);
        }
    };

    // Quick bid choices (Nominal: +500rb, +1jt, +5jt & Percentage: +5%, +10%, +20% of liveCurrentPrice)
    const quickNominalOptions = [
        {
            id: 'nom-500k',
            label: '+500rb',
            deltaStr: '+Rp 500.000',
            amount: liveCurrentPrice + 500000,
        },
        {
            id: 'nom-1m',
            label: '+1 Juta',
            deltaStr: '+Rp 1.000.000',
            amount: liveCurrentPrice + 1000000,
        },
        {
            id: 'nom-5m',
            label: '+5 Juta',
            deltaStr: '+Rp 5.000.000',
            amount: liveCurrentPrice + 5000000,
        },
    ];

    const quickPercentOptions = [
        {
            id: 'pct-5',
            label: '+5% Bid Terkini',
            deltaStr: `+${formatRupiah(Math.round(liveCurrentPrice * 0.05))}`,
            amount: liveCurrentPrice + Math.round(liveCurrentPrice * 0.05),
        },
        {
            id: 'pct-10',
            label: '+10% Bid Terkini',
            deltaStr: `+${formatRupiah(Math.round(liveCurrentPrice * 0.1))}`,
            amount: liveCurrentPrice + Math.round(liveCurrentPrice * 0.1),
        },
        {
            id: 'pct-20',
            label: '+20% Bid Terkini',
            deltaStr: `+${formatRupiah(Math.round(liveCurrentPrice * 0.2))}`,
            amount: liveCurrentPrice + Math.round(liveCurrentPrice * 0.2),
        },
    ];

    const handleQuickBid = (amount) => {
        setValidationError('');
        setBidAmount(amount);
    };

    // Determine current stage in the 4-Step Auction Workflow
    const activeStage =
        auctionState.status === 'settled'
            ? 4
            : !isLiveState || auctionState.has_ended
            ? 3
            : liveBids.length > 0
            ? 2
            : 1;

    return (
        <UserLayout>
            <Head title={`${auctionState.title} — MyBidder.ID`} />

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                <Link href="/" className="hover:text-neutral-900 transition-colors duration-150">
                    Beranda
                </Link>
                <span>/</span>
                <Link href={route('auctions.index')} className="hover:text-neutral-900 transition-colors duration-150">
                    Katalog Lelang
                </Link>
                <span>/</span>
                <span className="text-neutral-900 font-medium truncate max-w-sm">{auctionState.title}</span>
            </nav>

            {/* 4-Step Auction Workflow Stepper */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs tabular-nums">
                    {[
                        { step: 1, title: 'Rilis lot', sub: 'OB & waktu terjadwal' },
                        { step: 2, title: 'Penawaran aktif', sub: 'Validasi bid real-time' },
                        { step: 3, title: 'Verifikasi data', sub: 'Penguncian 00:00:00' },
                        {
                            step: 4,
                            title: 'Pelunasan & kirim',
                            sub: auctionState.status === 'settled' ? 'Lunas — Siap kirim' : 'Invoice & validasi',
                        },
                    ].map((s) => {
                        const isActive = activeStage === s.step;
                        const isDone = activeStage > s.step;
                        return (
                            <div
                                key={s.step}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                                    isActive
                                        ? 'bg-neutral-900 border-neutral-900 text-white'
                                        : isDone
                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                        : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                                }`}
                            >
                                <span
                                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-semibold text-xs shrink-0 ${
                                        isActive
                                            ? 'bg-white text-neutral-900'
                                            : isDone
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-neutral-200 text-neutral-600'
                                    }`}
                                >
                                    {s.step}
                                </span>
                                <div>
                                    <p className="font-semibold leading-tight">{s.title}</p>
                                    <p className={`text-[11px] mt-0.5 ${isActive ? 'text-neutral-300' : 'opacity-80'}`}>
                                        {s.sub}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Real-Time Outbid Alert Banner */}
            {outbidRealtimeAlert && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                        <span>{outbidRealtimeAlert}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOutbidRealtimeAlert(null)}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-red-100 text-xs font-medium border border-red-200"
                    >
                        Tutup
                    </button>
                </div>
            )}

            {/* Instant Bid Success Banner */}
            {bidSuccessMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-xs font-medium">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>{bidSuccessMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setBidSuccessMessage(null)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Image Gallery & Description (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-xl border border-neutral-200 p-4 overflow-hidden">
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 relative">
                            <img
                                src={
                                    selectedImage ||
                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
                                }
                                alt={auctionState.title}
                                className="w-full h-full object-cover"
                            />
                            {isLiveState ? (
                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-neutral-900/90 text-white flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                    <span>Live</span>
                                </span>
                            ) : (
                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-neutral-900/90 text-neutral-200">
                                    <span>Ditutup (00:00:00)</span>
                                </span>
                            )}
                        </div>

                        {auctionState.images && auctionState.images.length > 1 && (
                            <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
                                {auctionState.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedImage(img)}
                                        className={`w-16 h-16 rounded-lg overflow-hidden border transition-opacity duration-150 shrink-0 ${
                                            selectedImage === img
                                                ? 'border-neutral-900 opacity-100'
                                                : 'border-neutral-200 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <h2 className="text-base font-semibold text-neutral-900 mb-3">
                            Deskripsi & Spesifikasi Barang
                        </h2>
                        <div className="text-neutral-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                            {auctionState.description}
                        </div>

                        <div className="mt-6 pt-5 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                                <h4 className="text-xs font-semibold text-neutral-900">
                                    Ketentuan penawaran sah
                                </h4>
                                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                                    Setiap penawaran mengikat secara sah. Penawar tertinggi saat waktu mencapai 00:00:00 ditetapkan sebagai pemenang.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                                <h4 className="text-xs font-semibold text-neutral-900">
                                    Verifikasi & pengiriman
                                </h4>
                                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                                    Pemenang wajib melengkapi alamat pengiriman untuk diverifikasi Admin sebelum melakukan pembayaran.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timer, Price, Bidding & Live History (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-neutral-500">
                                Sisa waktu lelang
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                {auctionState.category.name}
                            </span>
                        </div>

                        <div className="mb-5">
                            <CountdownTimer
                                endTime={auctionState.end_time}
                                size="lg"
                                onEnd={handleTimerEnded}
                            />
                        </div>

                        <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 leading-snug">
                            {auctionState.title}
                        </h1>

                        {/* Moment 2: High-Contrast Saleroom Bid Instrument Panel */}
                        <div
                            className={`mt-5 p-5 rounded-xl bg-neutral-900 text-white transition-colors duration-200 tabular-nums ${
                                priceHighlightFlash ? 'ring-2 ring-emerald-500' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                                <span>Tawaran tertinggi saat ini</span>
                                <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span>Harga langsung</span>
                                </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-semibold font-mono text-white tracking-tight">
                                {formatRupiah(liveCurrentPrice)}
                            </div>
                            <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                                <span>
                                    Harga awal (OB):{' '}
                                    <strong className="font-mono font-medium text-neutral-200">
                                        {formatRupiah(auctionState.starting_price)}
                                    </strong>
                                </span>
                                <span>
                                    Kelipatan:{' '}
                                    <strong className="font-mono font-medium text-amber-400">
                                        +{formatRupiah(auctionState.min_increment)}
                                    </strong>
                                </span>
                            </div>
                        </div>

                        {auth.user && !auth.user.is_admin && liveUserBidStatus && (
                            <div className="mt-4 tabular-nums">
                                {liveUserBidStatus.is_highest_bidder ? (
                                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                                        Anda saat ini memegang tawaran tertinggi ({formatRupiah(liveUserBidStatus.highest_user_bid)})
                                    </div>
                                ) : liveUserBidStatus.has_bid ? (
                                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                                        Tawaran Anda ({formatRupiah(liveUserBidStatus.highest_user_bid)}) telah terlampaui
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {isLiveState ? (
                            auth.user ? (
                                auth.user.is_admin ? (
                                    <div className="mt-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                                        <div className="text-xs font-semibold text-neutral-900">
                                            Mode Pemantauan Administrator
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            Akun Administrator bertugas mengelola dan mengawasi jalannya lelang serta tidak dapat mengajukan penawaran.
                                        </p>
                                        <div className="pt-1 flex flex-wrap items-center gap-2">
                                            <Link
                                                href={route('admin.auctions.index')}
                                                className="h-8 px-3.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs inline-flex items-center transition-colors duration-150"
                                            >
                                                Kelola di Panel Admin
                                            </Link>
                                            {auctionState.status === 'draft' && (
                                                <Link
                                                    href={route('admin.auctions.edit', auctionState.id)}
                                                    className="h-8 px-3.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 font-medium text-xs border border-neutral-200 inline-flex items-center transition-colors duration-150"
                                                >
                                                    Edit barang ini
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleOpenConfirmation} className="mt-5 space-y-4 tabular-nums">
                                        {/* Toggle ON / OFF Pilihan Cepat Bid (Quick Bid) */}
                                        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                                            <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={quickBidEnabled}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setQuickBidEnabled(checked);
                                                            setValidationError('');
                                                            if (!checked) {
                                                                setBidAmount(liveNextMinBid);
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                                                    />
                                                    <div>
                                                        <span className="text-xs font-semibold text-neutral-900 block">
                                                            Pilihan Cepat Bid (Quick Bid)
                                                        </span>
                                                        <span className="text-[11px] text-neutral-500 block">
                                                            {quickBidEnabled
                                                                ? 'Mode cepat aktif: pilih nominal atau persentase kenaikan'
                                                                : 'Aktifkan untuk pilihan cepat (+500rb, +1jt, +5jt, +5%, +10%, +20%)'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const nextState = !quickBidEnabled;
                                                        setQuickBidEnabled(nextState);
                                                        setValidationError('');
                                                        if (!nextState) {
                                                            setBidAmount(liveNextMinBid);
                                                        }
                                                    }}
                                                    className={`h-6 px-2.5 rounded-md text-[11px] font-mono font-medium transition-colors duration-150 shrink-0 ${
                                                        quickBidEnabled
                                                            ? 'bg-neutral-900 text-white'
                                                            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                                                    }`}
                                                >
                                                    {quickBidEnabled ? 'ON' : 'OFF'}
                                                </button>
                                            </label>

                                            {quickBidEnabled && (
                                                <div className="mt-3.5 pt-3.5 border-t border-neutral-200 space-y-3">
                                                    <div>
                                                        <span className="block text-xs font-medium text-neutral-600 mb-1.5">
                                                            Tambah nominal cepat (500rb, 1jt, 5jt)
                                                        </span>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {quickNominalOptions.map((opt) => {
                                                                const isSelected = Number(bidAmount) === opt.amount;
                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        type="button"
                                                                        onClick={() => handleQuickBid(opt.amount)}
                                                                        className={`py-2 px-2 rounded-lg text-center border transition-colors duration-150 ${
                                                                            isSelected
                                                                                ? 'bg-neutral-900 border-neutral-900 text-white font-semibold'
                                                                                : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 font-medium'
                                                                        }`}
                                                                    >
                                                                        <span className="block text-xs">{opt.label}</span>
                                                                        <span className="block text-[10px] font-mono opacity-80 truncate">
                                                                            {formatRupiah(opt.amount)}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="block text-xs font-medium text-neutral-600 mb-1.5">
                                                            Persentase dari bid terkini (5%, 10%, 20%)
                                                        </span>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {quickPercentOptions.map((opt) => {
                                                                const isSelected = Number(bidAmount) === opt.amount;
                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        type="button"
                                                                        onClick={() => handleQuickBid(opt.amount)}
                                                                        className={`py-2 px-2 rounded-lg text-center border transition-colors duration-150 ${
                                                                            isSelected
                                                                                ? 'bg-neutral-900 border-neutral-900 text-white font-semibold'
                                                                                : 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-100 font-medium'
                                                                        }`}
                                                                    >
                                                                        <span className="block text-xs">{opt.label}</span>
                                                                        <span className="block text-[10px] font-mono opacity-80 truncate">
                                                                            {opt.deltaStr}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                                Nominal tawaran Anda (Rp)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">
                                                    Rp
                                                </span>
                                                <input
                                                    type="number"
                                                    min={quickBidEnabled ? liveCurrentPrice + 1 : liveNextMinBid}
                                                    step={quickBidEnabled ? 'any' : auctionState.min_increment}
                                                    value={bidAmount}
                                                    onChange={(e) => {
                                                        setValidationError('');
                                                        setBidAmount(parseInt(e.target.value) || 0);
                                                    }}
                                                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-white border border-neutral-200 text-neutral-900 font-mono font-semibold text-sm focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                                />
                                            </div>
                                            <span className="block text-[11px] text-neutral-500 mt-1">
                                                Minimal tawaran berikutnya:{' '}
                                                <strong className="font-mono font-medium text-neutral-800">{formatRupiah(liveNextMinBid)}</strong> (Kelipatan:{' '}
                                                <span className="font-mono">{formatRupiah(auctionState.min_increment)}</span>)
                                            </span>

                                            {validationError && (
                                                <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                                                    {validationError}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingBid}
                                            className="w-full h-11 rounded-lg font-medium text-sm bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150 disabled:opacity-50"
                                        >
                                            {submittingBid
                                                ? 'Memproses penawaran...'
                                                : `Ajukan tawaran ${formatRupiah(bidAmount)}`}
                                        </button>
                                    </form>
                                )
                            ) : (
                                <div className="mt-5 p-5 rounded-xl bg-neutral-50 text-center space-y-3 border border-neutral-200">
                                    <p className="text-xs text-neutral-600">
                                        Masuk ke akun Anda untuk mulai mengajukan penawaran pada lot ini
                                    </p>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center h-9 px-5 rounded-lg font-medium text-xs bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                                    >
                                        Masuk ke akun
                                    </Link>
                                </div>
                            )
                        ) : (
                            <div className="mt-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-2 tabular-nums">
                                <div className="text-xs font-semibold text-neutral-900">
                                    Sesi lelang telah ditutup (00:00:00)
                                </div>
                                {auctionState.winner ? (
                                    <p className="text-xs text-neutral-700">
                                        Pemenang resmi: <strong className="font-semibold">{auctionState.winner.masked_name}</strong> (
                                        <span className="font-mono font-medium">{formatRupiah(liveCurrentPrice)}</span>)
                                    </p>
                                ) : (
                                    <p className="text-xs text-neutral-500">
                                        Menunggu penetapan pemenang oleh Administrator
                                    </p>
                                )}
                                {auth.user &&
                                    auctionState.winner &&
                                    auctionState.winner.id === auth.user.id && (
                                        <div className="pt-1">
                                            <Link
                                                href={route('user.wins')}
                                                className="inline-flex items-center h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors duration-150"
                                            >
                                                <span>Buka halaman kemenangan & pembayaran →</span>
                                            </Link>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Live Bid History Box */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
                                <span>Riwayat Penawaran</span>
                                <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-neutral-100 text-neutral-700 border border-neutral-200 tabular-nums">
                                    {liveBids.length}
                                </span>
                            </h3>
                            <span className="text-xs text-neutral-400">
                                Identitas disamarkan
                            </span>
                        </div>

                        {liveBids.length > 0 ? (
                            <>
                                <div className="divide-y divide-neutral-100 tabular-nums">
                                    {liveBids
                                        .slice((bidHistoryPage - 1) * 6, bidHistoryPage * 6)
                                        .map((bid, idx) => {
                                            const globalIndex = (bidHistoryPage - 1) * 6 + idx;
                                            return (
                                                <div
                                                    key={bid.id || globalIndex}
                                                    className={`py-2.5 flex items-center justify-between text-xs ${
                                                        globalIndex === 0
                                                            ? 'bg-neutral-50 px-3 rounded-lg'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs ${
                                                                globalIndex === 0
                                                                    ? 'bg-neutral-900 text-white font-semibold'
                                                                    : 'bg-neutral-100 text-neutral-600'
                                                            }`}
                                                        >
                                                            {globalIndex + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-neutral-900">
                                                                {bid.masked_bidder_name || 'Penawar'}
                                                            </p>
                                                            <p className="text-[11px] text-neutral-400">
                                                                {bid.created_at}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <span className="font-mono font-semibold text-neutral-900">
                                                            {formatRupiah(bid.amount)}
                                                        </span>
                                                        {globalIndex === 0 && (
                                                            <span className="block text-[10px] text-emerald-700 font-medium">
                                                                Tertinggi saat ini
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                                <Pagination
                                    currentPage={bidHistoryPage}
                                    totalItems={liveBids.length}
                                    perPage={6}
                                    onPageChange={setBidHistoryPage}
                                    className="mt-4 rounded-lg border border-neutral-200"
                                />
                            </>
                        ) : (
                            <div className="text-center py-8 text-xs text-neutral-400">
                                Belum ada penawaran pada lot ini
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Pop-up Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!submittingBid) setShowConfirmModal(false);
                        }}
                    />
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-lg relative z-10 tabular-nums">
                        <h3 className="font-semibold text-base text-neutral-900">
                            Konfirmasi Pengajuan Penawaran
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 mb-4">
                            Pastikan nominal penawaran Anda telah sesuai sebelum dikirimkan
                        </p>

                        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 mb-4 text-xs">
                            <div className="flex justify-between items-center text-neutral-600">
                                <span>Barang lelang</span>
                                <span className="font-medium text-neutral-900 truncate max-w-[200px]">
                                    {auctionState.title}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-neutral-600">
                                <span>{liveBids.length > 0 ? 'Tawaran tertinggi saat ini' : 'Harga pembukaan (OB)'}</span>
                                <span className="font-mono text-neutral-800">
                                    {formatRupiah(liveCurrentPrice)}
                                </span>
                            </div>
                            {Number(bidAmount) > liveCurrentPrice && (
                                <div className="flex justify-between items-center text-neutral-600">
                                    <span>Selisih kenaikan</span>
                                    <span className="font-mono font-medium text-neutral-900">
                                        +{formatRupiah(Number(bidAmount) - liveCurrentPrice)}
                                    </span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm">
                                <span className="font-medium text-neutral-900">Tawaran Anda</span>
                                <span className="font-mono font-semibold text-neutral-900">
                                    {formatRupiah(bidAmount)}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 leading-relaxed mb-5">
                            Penawaran yang diajukan bersifat mengikat. Pembatalan sepihak setelah menang dapat menyebabkan pembekuan akun.
                        </div>

                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={submittingBid}
                                onClick={() => setShowConfirmModal(false)}
                                className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBid}
                                disabled={submittingBid}
                                className="h-9 px-5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submittingBid ? (
                                    <>
                                        <Spinner className="w-3.5 h-3.5 text-white" />
                                        <span>Mengirim...</span>
                                    </>
                                ) : (
                                    <span>Ya, ajukan tawaran</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
