import { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import CountdownTimer from '@/Components/CountdownTimer';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import Pagination from '@/Components/Pagination';
import { showToast } from '@/Components/ToastNotification';
import { useLivePolling } from '@/Hooks/useLivePolling';
import { formatRupiah, getTimeRemaining, syncAuctionEnded } from '@/Utils/format';

function AuctionCatalogCard({ auction, onEnded }) {
    const { auth } = usePage().props;
    const isAdmin = Boolean(auth?.user?.is_admin);
    const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(auction.end_time));

    useEffect(() => {
        if (auction.status !== 'active') return;

        const interval = setInterval(() => {
            const rem = getTimeRemaining(auction.end_time);
            setTimeLeft(rem);
            if (rem.isEnded) {
                clearInterval(interval);
                syncAuctionEnded();
                if (onEnded) onEnded(auction);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [auction.status, auction.end_time, onEnded]);

    const isTimeExpired = auction.status === 'active' && timeLeft.isEnded;
    const isLive = auction.status === 'active' && !isTimeExpired;

    const image =
        auction.images && auction.images.length > 0
            ? auction.images[0]
            : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';

    return (
        <div className="group flex flex-col bg-white rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                <img
                    src={image}
                    alt={auction.title}
                    className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-900/80 text-white">
                    {auction.category.name}
                </span>

                {isLive ? (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900/90 text-white text-xs font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>Live</span>
                    </div>
                ) : (
                    <div className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-md bg-neutral-900/90 text-neutral-300 text-xs font-mono font-medium">
                        <span>Selesai</span>
                    </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <CountdownTimer
                        endTime={auction.end_time}
                        onEnd={() => onEnded && onEnded(auction)}
                    />
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors duration-150">
                        {auction.title}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                        {auction.description}
                    </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2 tabular-nums">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Harga pembukaan</span>
                        <span className="font-mono text-neutral-700">
                            {formatRupiah(auction.starting_price)}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-baseline justify-between">
                        <span className="text-xs font-medium text-neutral-600">
                            {isLive ? 'Tawaran tertinggi' : 'Tawaran akhir'}
                        </span>
                        <span className="text-sm font-mono font-semibold text-neutral-900">
                            {formatRupiah(auction.current_price)}
                        </span>
                    </div>

                    <Link
                        href={route('auctions.show', auction.slug)}
                        className={`w-full h-9 mt-2 inline-flex items-center justify-center gap-1.5 px-4 rounded-lg font-medium text-xs transition-colors duration-150 ${
                            isLive && !isAdmin
                                ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                        }`}
                    >
                        <span>
                            {!isLive
                                ? 'Lihat hasil lelang'
                                : isAdmin
                                ? 'Pantau lot'
                                : 'Tawar sekarang'}
                        </span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Index({ auctions, categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const knownIdsRef = useRef(new Set((auctions?.data || []).map((a) => a.id)));

    const { polledData, manualRefresh, fetchUrl, isNavigatingPage } = useLivePolling({
        intervalMs: 1000,
        only: ['auctions', 'categories', 'filters'],
        onData: (fresh) => {
            const incoming = fresh?.auctions?.data;
            if (Array.isArray(incoming)) {
                const newItems = incoming.filter((a) => !knownIdsRef.current.has(a.id));
                if (newItems.length > 0) {
                    newItems.forEach((a) => knownIdsRef.current.add(a.id));
                    showToast({
                        type: 'info',
                        title: 'Lot baru tersedia',
                        message: `"${newItems[0].title}" baru saja masuk ke katalog lelang.`,
                    });
                }
            }
        },
    });

    const liveAuctions = polledData?.auctions || auctions;
    const liveCategories = polledData?.categories || categories;
    const liveFilters = polledData?.filters || filters;

    const handleSearchSubmit = () => {
        fetchUrl(
            route('auctions.index', {
                ...liveFilters,
                search,
            })
        );
    };

    const handleCategoryClick = (categorySlug) => {
        fetchUrl(
            route('auctions.index', {
                ...liveFilters,
                category: liveFilters.category === categorySlug ? '' : categorySlug,
            })
        );
    };

    const handleTabChange = (tab) => {
        fetchUrl(
            route('auctions.index', {
                ...liveFilters,
                tab,
            })
        );
    };

    const handleSortChange = (e) => {
        fetchUrl(
            route('auctions.index', {
                ...liveFilters,
                sort: e.target.value,
            })
        );
    };

    return (
        <UserLayout
            searchQuery={search}
            onSearchChange={setSearch}
            selectedCategory={liveFilters.category || 'all'}
            onCategoryChange={(catId) => handleCategoryClick(catId === 'all' ? '' : catId)}
            onSearchSubmit={handleSearchSubmit}
        >
            <Head title="Katalog Lelang — MyBidder.ID" />

            {/* Clean Catalog Header */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                    Katalog Lot Lelang
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                    Pilih kategori atau status sesi untuk memantau harga tertinggi dan sisa waktu secara real-time
                </p>
            </div>

            {/* Filter Tabs & Controls */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                        {[
                            { id: 'live', label: 'Sedang berlangsung' },
                            { id: 'upcoming', label: 'Segera hadir' },
                            { id: 'ended', label: 'Selesai' },
                            { id: 'all', label: 'Semua lot' },
                        ].map((tabItem) => (
                            <button
                                key={tabItem.id}
                                type="button"
                                onClick={() => handleTabChange(tabItem.id)}
                                className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors duration-150 flex items-center gap-2 whitespace-nowrap ${
                                    liveFilters.tab === tabItem.id
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                                }`}
                            >
                                {tabItem.id === 'live' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                )}
                                <span>{tabItem.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 whitespace-nowrap">Urutkan:</span>
                        <select
                            value={liveFilters.sort || 'ending_soon'}
                            onChange={handleSortChange}
                            className="h-8 bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded-lg px-3 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                        >
                            <option value="ending_soon">Batas waktu terdekat</option>
                            <option value="latest">Lot terbaru</option>
                            <option value="price_asc">Harga terendah</option>
                            <option value="price_desc">Harga tertinggi</option>
                        </select>
                    </div>
                </div>

                {/* Category Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar tabular-nums">
                    <button
                        type="button"
                        onClick={() => handleCategoryClick('')}
                        className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                            !liveFilters.category
                                ? 'bg-neutral-900 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                        }`}
                    >
                        Semua kategori
                    </button>
                    {liveCategories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryClick(cat.slug)}
                            className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                                liveFilters.category === cat.slug
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                            }`}
                        >
                            {cat.name} ({cat.auctions_count ?? 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Auction Cards Grid (Max 6 per page) */}
            {liveAuctions.data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {liveAuctions.data.map((auction) => (
                        <AuctionCatalogCard
                            key={auction.id}
                            auction={auction}
                            onEnded={manualRefresh}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-14 bg-white rounded-xl border border-neutral-200 p-8">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-500 mx-auto flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900">Tidak ada lot ditemukan</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                        Ubah kata kunci pencarian atau pilih kategori lain yang tersedia
                    </p>
                </div>
            )}

            <div className="mt-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <Pagination
                    paginator={liveAuctions}
                    onNavigateUrl={fetchUrl}
                    isLoading={isNavigatingPage}
                />
            </div>
        </UserLayout>
    );
}
