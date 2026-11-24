import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import MarketplaceNavbar from '@/Components/MarketplaceNavbar';
import MarketplaceRowCarousel from '@/Components/MarketplaceRowCarousel';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import ToastNotification, { showToast } from '@/Components/ToastNotification';
import { useLivePolling } from '@/Hooks/useLivePolling';
import { formatRupiah } from '@/Utils/format';

const DEFAULT_SHOWCASE = {
    title: 'Koleksi Jam Tangan & Perangkat Langka Terkurasi',
    categoryLabel: 'Horologi & Koleksi',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
    openBid: 15000000,
    highestBid: 18500000,
    bidCount: 7,
};

export default function Landing({
    liveAuctions = [],
    closedAuctions = [],
    categories = [],
    stats = { active_count: 0, active_bids: 0, total_bids: 0, settled_count: 0, total_auctions: 0 },
    ticker = 'Selamat datang di MyBidder.ID — Pantau dan ikuti lelang online real-time',
}) {
    const { auth } = usePage().props;
    const isGuest = !auth?.user;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [nowMs, setNowMs] = useState(() => Date.now());
    const knownLiveIdsRef = useRef(new Set(liveAuctions.map((item) => item.id)));

    const { manualRefresh, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['liveAuctions', 'closedAuctions', 'categories', 'stats', 'ticker'],
        onData: (fresh) => {
            if (Array.isArray(fresh?.liveAuctions)) {
                const newItems = fresh.liveAuctions.filter((item) => !knownLiveIdsRef.current.has(item.id));
                if (newItems.length > 0) {
                    newItems.forEach((item) => knownLiveIdsRef.current.add(item.id));
                    showToast({
                        type: 'info',
                        title: 'Lot lelang baru tersedia',
                        message: `"${newItems[0].title}" baru saja dipublikasikan dan siap ditawar.`,
                    });
                }
            }
        },
    });

    const currentLiveAuctions = polledData?.liveAuctions || liveAuctions;
    const currentClosedAuctions = polledData?.closedAuctions || closedAuctions;
    const currentCategories = polledData?.categories || categories;
    const currentStats = polledData?.stats || stats;
    const currentTicker = polledData?.ticker || ticker;

    useEffect(() => {
        const timer = setInterval(() => {
            setNowMs(Date.now());
        }, 100);
        return () => clearInterval(timer);
    }, []);

    const filterItems = (items) => {
        const query = searchQuery.trim().toLowerCase();
        return items.filter((item) => {
            const matchesCategory =
                selectedCategory === 'all' || item.categoryId === selectedCategory;
            const matchesQuery =
                !query ||
                item.title.toLowerCase().includes(query) ||
                (item.shortDescription && item.shortDescription.toLowerCase().includes(query)) ||
                (item.categoryLabel && item.categoryLabel.toLowerCase().includes(query));
            return matchesCategory && matchesQuery;
        });
    };

    const filteredLiveItems = useMemo(
        () => filterItems(currentLiveAuctions),
        [currentLiveAuctions, searchQuery, selectedCategory]
    );

    const filteredClosedItems = useMemo(
        () => filterItems(currentClosedAuctions),
        [currentClosedAuctions, searchQuery, selectedCategory]
    );

    const featuredLot =
        currentLiveAuctions[0] || currentClosedAuctions[0] || DEFAULT_SHOWCASE;

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900 font-sans antialiased">
            <Head title="MyBidder.ID — Balai Lelang Online Real-Time" />

            <ToastNotification />

            <MarketplaceNavbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onSearchSubmit={() => {}}
            />

            {/* Signature Live Activity Strip */}
            <div className="bg-neutral-900 text-neutral-200 border-b border-neutral-800">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-white shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            <span>Aktivitas langsung</span>
                        </span>
                        <span className="text-neutral-600">•</span>
                        <p className="truncate text-neutral-300">{currentTicker}</p>
                    </div>

                    <div className="hidden md:flex items-center gap-3 text-xs text-neutral-400 shrink-0 tabular-nums">
                        <span>Sinkronisasi 1 detik</span>
                        <span className="text-neutral-700">|</span>
                        <Link href={route('auctions.index')} className="text-neutral-200 hover:text-white font-medium">
                            Katalog publik →
                        </Link>
                    </div>
                </div>
            </div>

            {isGuest ? (
                <main className="flex-1 space-y-16 sm:space-y-20 pb-16">
                    {/* Hero Section: Asymmetric Split on Warm Saleroom Surface */}
                    <section className="bg-[#f7f6f2] border-b border-neutral-200 py-12 sm:py-20">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600">
                                        <span className="w-2 h-2 rounded-full bg-amber-600" />
                                        <span>Balai lelang koleksi & perangkat terverifikasi</span>
                                    </div>

                                    <h1 className="text-3xl sm:text-5xl font-semibold text-neutral-900 tracking-tight leading-[1.08] max-w-2xl">
                                        Penawaran lot koleksi secara real-time dengan penguncian waktu presisi
                                    </h1>

                                    <p className="text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
                                        Setiap lot di MyBidder.ID memiliki harga pembukaan (OB), aturan kelipatan tetap, hitungan mundur hingga 00:00:00, serta verifikasi alamat pemenang sebelum penerbitan tagihan pelunasan.
                                    </p>

                                    {/* One primary action + one secondary link */}
                                    <div className="pt-2 flex flex-wrap items-center gap-4">
                                        <Link
                                            href={route('register')}
                                            className="h-11 px-6 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors duration-150"
                                        >
                                            <span>Mulai ikut lelang</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </Link>

                                        <Link
                                            href={route('auctions.index')}
                                            className="h-11 px-4 rounded-lg text-neutral-700 hover:text-neutral-900 font-medium text-sm flex items-center transition-colors duration-150"
                                        >
                                            Lihat katalog lelang →
                                        </Link>
                                    </div>

                                    <div className="pt-4 border-t border-neutral-200/80 grid grid-cols-3 gap-6 max-w-lg tabular-nums">
                                        <div>
                                            <span className="block text-xl font-semibold font-mono text-neutral-900">
                                                {currentStats.total_auctions}
                                            </span>
                                            <span className="text-xs text-neutral-500">Total lot terdaftar</span>
                                        </div>
                                        <div>
                                            <span className="block text-xl font-semibold font-mono text-neutral-900">
                                                {currentStats.total_bids}
                                            </span>
                                            <span className="text-xs text-neutral-500">Penawaran sah</span>
                                        </div>
                                        <div>
                                            <span className="block text-xl font-semibold font-mono text-neutral-900">
                                                {currentStats.settled_count}
                                            </span>
                                            <span className="text-xs text-neutral-500">Lot selesai</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Moment 1: Real Lot Preview Card */}
                                <div className="lg:col-span-5">
                                    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between text-xs border-b border-neutral-100 pb-3">
                                            <span className="inline-flex items-center gap-1.5 font-mono font-medium text-neutral-900">
                                                <span className="w-2 h-2 rounded-full bg-red-600" />
                                                <span>Sorotan lot katalog</span>
                                            </span>
                                            <span className="font-mono text-neutral-500">
                                                {featuredLot.categoryLabel || 'Koleksi'}
                                            </span>
                                        </div>

                                        <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-neutral-100">
                                            <img
                                                src={featuredLot.image}
                                                alt={featuredLot.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-semibold text-base text-neutral-900 line-clamp-1">
                                                {featuredLot.title}
                                            </h3>

                                            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 grid grid-cols-2 gap-4 tabular-nums">
                                                <div>
                                                    <span className="text-xs text-neutral-500 block">
                                                        Harga pembukaan
                                                    </span>
                                                    <span className="font-mono font-medium text-sm text-neutral-800 mt-0.5 block">
                                                        {formatRupiah(featuredLot.openBid || 1000000)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-neutral-500 block">
                                                        Tawaran tertinggi
                                                    </span>
                                                    <span className="font-mono font-semibold text-sm text-neutral-900 mt-0.5 block">
                                                        {formatRupiah(featuredLot.highestBid || featuredLot.openBid || 1000000)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Alur Kerja 4 Langkah */}
                    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-xl mb-8">
                            <span className="text-xs font-mono text-neutral-500">
                                Prosedur lelang
                            </span>
                            <h2 className="text-2xl font-semibold text-neutral-900 mt-1">
                                Empat tahapan transaksi di MyBidder.ID
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    step: '01',
                                    title: 'Pilih lot & pantau waktu',
                                    desc: 'Setiap barang dilengkapi harga pembukaan (OB), kelipatan penawaran, dan hitung mundur waktu penutupan.',
                                    meta: 'Status lot: Live',
                                },
                                {
                                    step: '02',
                                    title: 'Ajukan penawaran sah',
                                    desc: 'Gunakan nominal kelipatan atau tombol bid cepat. Sistem mencatat penawaran tertinggi dan mengirim notifikasi outbid.',
                                    meta: 'Validasi harga server',
                                },
                                {
                                    step: '03',
                                    title: 'Penguncian & verifikasi data',
                                    desc: 'Saat waktu mencapai 00:00:00, lelang ditutup otomatis. Pemenang mengisi formulir alamat untuk dicek Admin.',
                                    meta: 'Verifikasi maksimal 1x24 jam',
                                },
                                {
                                    step: '04',
                                    title: 'Pelunasan & pengiriman',
                                    desc: 'Setelah data disetujui Admin, pemenang mengunggah bukti transfer dan memantau nomor resi pengiriman.',
                                    meta: 'Invoice resmi otomatis',
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col justify-between"
                                >
                                    <div>
                                        <span className="font-mono text-xs font-semibold text-amber-700">
                                            Tahap {item.step}
                                        </span>
                                        <h3 className="text-sm font-semibold text-neutral-900 mt-2 mb-1.5">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-neutral-100 text-xs font-mono text-neutral-500">
                                        {item.meta}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 3: Keunggulan Utama Platform */}
                    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                <div className="lg:col-span-4 space-y-3">
                                    <span className="text-xs font-mono text-neutral-500">
                                        Integritas sistem
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-snug">
                                        Dirancang untuk kejelasan harga dan kepastian penyelesaian
                                    </h2>
                                    <p className="text-xs text-neutral-600 leading-relaxed">
                                        Seluruh penawaran tercatat secara kronologis dan diawasi oleh administrator untuk mencegah manipulasi harga.
                                    </p>
                                </div>

                                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                                            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Pembaruan harga tanpa muat ulang</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            Pergerakan tawaran tertinggi dan sisa waktu lot diperbarui otomatis setiap detik di layar Anda.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                                            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                            </svg>
                                            <span>Verifikasi identitas & alamat pemenang</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            Pemenang wajib melengkapi alamat, kode pos, dan nomor telepon aktif yang diverifikasi Admin sebelum pembayaran.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                                            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                            <span>Penerbitan invoice otomatis</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            Nomor tagihan resmi diterbitkan seketika saat sesi berakhir dan terhubung langsung ke portal unggah bukti transfer.
                                        </p>
                                    </div>

                                    <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                                        <div className="flex items-center gap-2 text-neutral-900 font-semibold text-xs">
                                            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                            </svg>
                                            <span>Pemberitahuan outbid langsung</span>
                                        </div>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            Notifikasi pop-up langsung memberi tahu Anda apabila peserta lain mengajukan tawaran yang lebih tinggi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Pratinjau Lot Database */}
                    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                            <div>
                                <span className="text-xs font-mono text-neutral-500">
                                    Katalog terdaftar
                                </span>
                                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 mt-1">
                                    Pratinjau lot di MyBidder.ID
                                </h2>
                            </div>

                            <Link
                                href={route('auctions.index')}
                                className="h-9 px-4 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 font-medium text-xs transition-colors duration-150 shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                            >
                                <span>Buka katalog lengkap</span>
                                <span>→</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {(currentLiveAuctions.length > 0 ? currentLiveAuctions : currentClosedAuctions)
                                .slice(0, 3)
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3">
                                                    {item.status === 'active' ? (
                                                        <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 text-white font-mono text-xs flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                                            <span>Live</span>
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-md bg-neutral-900/90 text-neutral-200 font-mono text-xs">
                                                            Selesai
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-white/90 text-xs font-medium text-neutral-700">
                                                    {item.categoryLabel}
                                                </div>
                                            </div>

                                            <div className="p-5 space-y-3">
                                                <h3 className="font-semibold text-neutral-900 text-sm line-clamp-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                                    {item.shortDescription || 'Lot lelang resmi terverifikasi MyBidder.ID.'}
                                                </p>

                                                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs tabular-nums">
                                                    <div>
                                                        <span className="text-neutral-500 block">
                                                            {item.status === 'active' ? 'Tawaran tertinggi' : 'Harga akhir'}
                                                        </span>
                                                        <span className="font-mono font-semibold text-neutral-900 text-sm">
                                                            {formatRupiah(item.highestBid || item.openBid)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-neutral-500 block">
                                                            Total penawaran
                                                        </span>
                                                        <span className="font-mono font-medium text-neutral-700">
                                                            {item.bidCount} tawaran
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 pt-0">
                                            <Link
                                                href={route('auctions.show', item.slug)}
                                                className="w-full h-9 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium text-xs flex items-center justify-center gap-1 transition-colors duration-150"
                                            >
                                                <span>Lihat rincian lot</span>
                                                <span>→</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>
                </main>
            ) : (
                <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    {/* Context Header (No Greeting Headline) */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-neutral-900">
                                {auth.user.is_admin
                                    ? 'Pemantauan Katalog & Pasar Lelang Aktif'
                                    : 'Ringkasan Pasar & Lot Lelang Aktif'}
                            </h1>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                {auth.user.is_admin
                                    ? 'Pantau katalog lelang publik secara real-time atau kelola lot melalui Panel Admin'
                                    : 'Pantau pergerakan harga lot secara real-time dan ajukan penawaran'}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <LiveSyncBadge
                                onManualRefresh={manualRefresh}
                                lastUpdated={lastUpdated}
                            />
                            {auth.user.is_admin ? (
                                <Link
                                    href={route('admin.dashboard')}
                                    className="h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center transition-colors duration-150"
                                >
                                    Buka Panel Admin
                                </Link>
                            ) : (
                                <Link
                                    href={route('user.bids')}
                                    className="h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center transition-colors duration-150"
                                >
                                    Riwayat Tawaran Saya
                                </Link>
                            )}
                            <Link
                                href={route('auctions.index')}
                                className="h-9 px-3.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 font-medium text-xs border border-neutral-200 flex items-center transition-colors duration-150"
                            >
                                Katalog Publik →
                            </Link>
                        </div>
                    </div>

                    {/* Stat Cards: Numbers, Label, and Context Only */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
                        <div className="bg-white rounded-xl border border-neutral-200 p-5">
                            <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-600" />
                                <span>Lot sedang berlangsung</span>
                            </span>
                            <p className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-900 mt-2">
                                {currentStats.active_count}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                {currentStats.active_count > 0
                                    ? 'Sesi aktif terbuka untuk penawaran'
                                    : 'Belum ada sesi lelang yang berjalan'}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl border border-neutral-200 p-5">
                            <span className="text-xs font-medium text-neutral-500">
                                Total penawaran tercatat
                            </span>
                            <p className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-900 mt-2">
                                {currentStats.total_bids}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                Akumulasi tawaran sah di sistem
                            </p>
                        </div>

                        <div className="bg-white rounded-xl border border-neutral-200 p-5">
                            <span className="text-xs font-medium text-neutral-500">
                                Lot selesai & berpemenang
                            </span>
                            <p className="text-2xl sm:text-3xl font-semibold font-mono text-neutral-900 mt-2">
                                {currentStats.settled_count}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                Sesi telah ditutup & ditetapkan pemenang
                            </p>
                        </div>
                    </div>

                    {/* Category Filter Bar */}
                    <section className="bg-white rounded-xl border border-neutral-200 p-2.5">
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className={`h-8 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                                    selectedCategory === 'all'
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                                }`}
                            >
                                Semua kategori
                            </button>
                            {currentCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.slug)}
                                    className={`h-8 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                                        selectedCategory === cat.slug
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Section 1: Real LIVE Auctions Carousel (Max 6 per page) */}
                    <div id="live-auctions" className="space-y-4">
                        {filteredLiveItems.length > 0 ? (
                            <MarketplaceRowCarousel
                                row={{
                                    id: 'row-live',
                                    title: 'Lot Lelang Sedang Berlangsung',
                                    subtitle: 'Daftar barang lelang aktif yang dapat ditawar saat ini',
                                    items: filteredLiveItems,
                                }}
                                nowMs={nowMs}
                            />
                        ) : (
                            <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
                                <h3 className="text-base font-semibold text-neutral-900">
                                    Belum ada lot yang sedang berlangsung
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto leading-relaxed">
                                    Anda dapat meninjau riwayat lot yang telah selesai di bawah atau membuka halaman katalog lengkap.
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2.5">
                                    <Link
                                        href={route('auctions.index')}
                                        className="h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center transition-colors duration-150"
                                    >
                                        Buka katalog lengkap →
                                    </Link>
                                    {auth.user.is_admin && (
                                        <Link
                                            href={route('admin.auctions.create')}
                                            className="h-9 px-4 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs border border-neutral-200 flex items-center transition-colors duration-150"
                                        >
                                            + Tambah lot baru
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Real Closed / Settled Auctions Carousel (Max 6 per page) */}
                    {filteredClosedItems.length > 0 && (
                        <div id="closed-auctions" className="space-y-4">
                            <MarketplaceRowCarousel
                                row={{
                                    id: 'row-closed',
                                    title: 'Lot Lelang Selesai',
                                    subtitle: 'Daftar barang yang telah berakhir masa penawarannya beserta hasil akhir',
                                    items: filteredClosedItems,
                                }}
                                nowMs={nowMs}
                            />
                        </div>
                    )}
                </main>
            )}

            <footer className="bg-white border-t border-neutral-200 mt-auto">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/img/logo.webp"
                            alt="MyBidder.ID"
                            className="w-6 h-6 rounded-md object-contain shrink-0"
                        />
                        <span className="font-semibold text-sm text-neutral-900">
                            MyBidder.ID
                        </span>
                        <span>— Balai Lelang Online Real-Time Terverifikasi</span>
                    </div>
                    <p>
                        &copy; {new Date().getFullYear()} MyBidder.ID. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
