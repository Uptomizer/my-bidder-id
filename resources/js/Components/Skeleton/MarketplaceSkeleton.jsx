import Skeleton from './Skeleton';

/**
 * Exact 1:1 Skeleton for MarketplaceNavbar (Top Utility Strip + Main Bar with Category Dropdown & Search)
 */
export function MarketplaceNavbarSkeleton() {
    return (
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
            {/* Top Utility Strip */}
            <div className="bg-slate-100 border-b border-slate-200/80 py-1.5 px-4 hidden sm:block">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-40 h-3.5 rounded-md" />
                        <Skeleton className="w-44 h-3.5 rounded-md" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-28 h-3.5 rounded-md" />
                        <Skeleton className="w-24 h-3.5 rounded-md" />
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* LEFT: Logo & Brand Text */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="space-y-1">
                            <Skeleton className="w-28 sm:w-32 h-5 rounded-md" />
                            <Skeleton className="w-20 h-2.5 rounded-sm" />
                        </div>
                    </div>

                    {/* CENTER: Kategori Dropdown + Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2 mx-4">
                        <Skeleton className="h-11 w-40 rounded-xl flex-shrink-0" variant="subtle" />
                        <Skeleton className="h-11 flex-1 rounded-xl" variant="subtle" />
                    </div>

                    {/* RIGHT: Notification & Profile / Auth */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Skeleton className="w-10 h-10 rounded-xl" variant="subtle" />
                        <Skeleton className="w-28 sm:w-36 h-10 rounded-xl" />
                    </div>
                </div>

                {/* Mobile Search & Category Row */}
                <div className="flex md:hidden w-full items-center gap-2 mt-2.5">
                    <Skeleton className="h-11 w-28 rounded-xl flex-shrink-0" variant="subtle" />
                    <Skeleton className="h-11 flex-1 rounded-xl" variant="subtle" />
                </div>
            </div>
        </header>
    );
}

/**
 * Exact 1:1 Skeleton for Marketplace Footer
 */
export function MarketplaceFooterSkeleton() {
    return (
        <footer className="bg-white border-t border-slate-200 mt-auto">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-28 h-5 rounded-md" />
                    <Skeleton className="w-64 h-4 rounded-md hidden sm:block" />
                </div>
                <Skeleton className="w-72 h-4 rounded-md" />
            </div>
        </footer>
    );
}

/**
 * Exact 1:1 Skeleton for Landing.jsx ('/')
 * Includes: Navbar + Dark Live Ticker Strip + 8/4 Hero Grid + Category Strip + 3 Row Carousels
 */
export function LandingSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
            <MarketplaceNavbarSkeleton />

            {/* Live Ticker Strip (bg-slate-900) */}
            <div className="bg-slate-900 border-b border-slate-800">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Skeleton className="w-16 h-5 rounded" variant="dark" />
                        <Skeleton className="w-72 sm:w-96 h-4 rounded-md" variant="dark" />
                    </div>
                    <Skeleton className="w-40 h-6 rounded-full" variant="dark" />
                </div>
            </div>

            {/* Main Container */}
            <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Hero Banner (8 Cols) + Side Promo Cards (4 Cols) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Main Sliding Hero Banner (8 Cols) */}
                    <div className="lg:col-span-8 rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm flex flex-col justify-between min-h-[260px]">
                        <div className="space-y-3 max-w-xl">
                            <Skeleton className="w-40 h-6 rounded-full" />
                            <Skeleton className="w-full h-9 sm:h-10 rounded-xl" />
                            <Skeleton className="w-4/5 h-9 sm:h-10 rounded-xl" />
                            <Skeleton className="w-3/4 h-4 rounded-md pt-1" variant="subtle" />
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <Skeleton className="w-44 h-10 rounded-xl" />
                            <div className="flex items-center gap-1.5">
                                <Skeleton className="w-7 h-2 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Side Promo & Live Stats Cards (4 Cols) */}
                    <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
                        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="w-28 h-3.5 rounded-md" />
                                <Skeleton className="w-24 h-8 rounded-lg" />
                                <Skeleton className="w-40 h-3.5 rounded-md" variant="subtle" />
                            </div>
                            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                        </div>

                        <div className="bg-white rounded-3xl border border-amber-200/80 p-5 shadow-sm flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="w-32 h-3.5 rounded-md" />
                                <Skeleton className="w-40 h-5 rounded-md" />
                                <Skeleton className="w-28 h-4 rounded-md" variant="subtle" />
                            </div>
                            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                        </div>
                    </div>
                </section>

                {/* Quick Marketplace Category Strip */}
                <section className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <Skeleton
                                key={idx}
                                className="h-9 w-28 rounded-xl flex-shrink-0"
                                variant={idx === 0 ? 'default' : 'subtle'}
                            />
                        ))}
                    </div>
                </section>

                {/* 3 MarketplaceRowCarousel Sections */}
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, rowIdx) => (
                        <section
                            key={rowIdx}
                            className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm"
                        >
                            {/* Row Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2.5">
                                        <Skeleton className="w-52 sm:w-64 h-6 rounded-lg" />
                                        <Skeleton className="w-16 h-5 rounded-full" variant="subtle" />
                                    </div>
                                    <Skeleton className="w-72 h-3.5 rounded-md" variant="subtle" />
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <Skeleton className="w-8 h-8 rounded-full" variant="subtle" />
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                </div>
                            </div>

                            {/* Horizontal Track of 250px Cards */}
                            <div className="flex gap-4 overflow-hidden py-2 px-0.5">
                                {Array.from({ length: 5 }).map((_, cardIdx) => (
                                    <div
                                        key={cardIdx}
                                        className="flex-shrink-0 w-[235px] sm:w-[250px] bg-white rounded-2xl border border-slate-200 flex flex-col justify-between overflow-hidden shadow-sm"
                                    >
                                        {/* Aspect 4/3 Image */}
                                        <div className="relative aspect-[4/3] bg-slate-100">
                                            <Skeleton className="w-full h-full rounded-none" />
                                            <div className="absolute top-2.5 left-2.5">
                                                <Skeleton className="w-12 h-5 rounded-md" />
                                            </div>
                                            <div className="absolute top-2.5 right-2.5">
                                                <Skeleton className="w-14 h-5 rounded-md" />
                                            </div>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <Skeleton className="w-full h-6 rounded-lg" />
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                                            <div className="space-y-1.5">
                                                <Skeleton className="w-20 h-4 rounded-md" variant="subtle" />
                                                <Skeleton className="w-full h-4 rounded-md" />
                                                <Skeleton className="w-4/5 h-4 rounded-md" />
                                                <Skeleton className="w-full h-3 rounded-sm pt-1" variant="subtle" />
                                            </div>

                                            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Skeleton className="w-14 h-3 rounded-sm" variant="subtle" />
                                                    <Skeleton className="w-20 h-3.5 rounded-sm" />
                                                </div>
                                                <Skeleton className="w-full h-12 rounded-xl" variant="subtle" />
                                                <Skeleton className="w-full h-9 rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            <MarketplaceFooterSkeleton />
        </div>
    );
}

/**
 * Exact 1:1 Skeleton for Auctions/Index.jsx ('/auctions')
 */
export function CatalogSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
            <MarketplaceNavbarSkeleton />

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Hero Section */}
                <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 mb-8 shadow-sm space-y-4">
                    <Skeleton className="w-48 h-6 rounded-full" />
                    <Skeleton className="w-full max-w-2xl h-10 sm:h-12 rounded-xl" />
                    <Skeleton className="w-full max-w-xl h-4 rounded-md" variant="subtle" />
                </div>

                {/* Filter Tabs & Controls */}
                <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <Skeleton className="w-28 h-9 rounded-xl" />
                            <Skeleton className="w-28 h-9 rounded-xl" variant="subtle" />
                            <Skeleton className="w-24 h-9 rounded-xl" variant="subtle" />
                            <Skeleton className="w-20 h-9 rounded-xl" variant="subtle" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-16 h-4 rounded-md" variant="subtle" />
                            <Skeleton className="w-44 h-9 rounded-xl" variant="subtle" />
                        </div>
                    </div>

                    {/* Category Pills Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-8 w-28 rounded-xl flex-shrink-0"
                                variant={i === 0 ? 'default' : 'subtle'}
                            />
                        ))}
                    </div>
                </div>

                {/* 4-Col Auction Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="relative aspect-[4/3] bg-slate-100">
                                <Skeleton className="w-full h-full rounded-none" />
                                <div className="absolute top-3 left-3">
                                    <Skeleton className="w-20 h-5 rounded-md" />
                                </div>
                                <div className="absolute top-3 right-3">
                                    <Skeleton className="w-14 h-5 rounded-md" />
                                </div>
                                <div className="absolute bottom-3 left-3 right-3">
                                    <Skeleton className="w-32 h-6 rounded-lg" />
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="w-full h-5 rounded-md" />
                                    <Skeleton className="w-3/4 h-5 rounded-md" />
                                    <Skeleton className="w-full h-3.5 rounded-sm pt-1" variant="subtle" />
                                </div>

                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="w-20 h-3.5 rounded-sm" variant="subtle" />
                                        <Skeleton className="w-24 h-4 rounded-sm" />
                                    </div>
                                    <Skeleton className="w-full h-11 rounded-2xl" variant="subtle" />
                                    <Skeleton className="w-full h-10 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <MarketplaceFooterSkeleton />
        </div>
    );
}

/**
 * Exact 1:1 Skeleton for User Pages (/my-bids, /my-wins, /notifications, /profile)
 */
export default function MarketplaceSkeleton({ path = '/' }) {
    const cleanPath = (path || '/').toLowerCase();

    if (cleanPath.startsWith('/auctions')) {
        return <CatalogSkeleton />;
    }

    if (cleanPath.startsWith('/my-bids')) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
                <MarketplaceNavbarSkeleton />
                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="w-72 h-8 rounded-xl" />
                            <Skeleton className="w-96 h-4 rounded-md max-w-full" variant="subtle" />
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 grid grid-cols-6 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-4 w-24 rounded-md" variant="subtle" />
                                ))}
                            </div>
                            <div className="divide-y divide-slate-100">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                            <div className="space-y-1.5">
                                                <Skeleton className="w-48 h-4 rounded-md" />
                                                <Skeleton className="w-24 h-3 rounded-sm" variant="subtle" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-28 h-4 rounded-md hidden sm:block" />
                                        <Skeleton className="w-28 h-5 rounded-md" />
                                        <Skeleton className="w-20 h-6 rounded-full hidden md:block" />
                                        <Skeleton className="w-24 h-6 rounded-lg hidden lg:block" />
                                        <Skeleton className="w-20 h-8 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
                <MarketplaceFooterSkeleton />
            </div>
        );
    }

    if (cleanPath.startsWith('/my-wins')) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
                <MarketplaceNavbarSkeleton />
                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="w-64 h-8 rounded-xl" />
                            <Skeleton className="w-full max-w-lg h-4 rounded-md" variant="subtle" />
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
                                        <div className="space-y-2">
                                            <Skeleton className="w-20 h-3.5 rounded-sm" variant="subtle" />
                                            <Skeleton className="w-64 h-5 rounded-md" />
                                            <Skeleton className="w-48 h-4 rounded-md" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 self-end md:self-center">
                                        <Skeleton className="w-28 h-7 rounded-full" variant="subtle" />
                                        <Skeleton className="w-44 h-10 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                <MarketplaceFooterSkeleton />
            </div>
        );
    }

    if (cleanPath.startsWith('/notifications')) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
                <MarketplaceNavbarSkeleton />
                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="w-56 h-8 rounded-xl" />
                                <Skeleton className="w-80 h-4 rounded-md max-w-full" variant="subtle" />
                            </div>
                            <Skeleton className="w-36 h-9 rounded-xl" variant="subtle" />
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-5 flex items-start gap-4">
                                    <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="w-48 h-4 rounded-md" />
                                            <Skeleton className="w-20 h-3 rounded-sm" variant="subtle" />
                                        </div>
                                        <Skeleton className="w-3/4 h-3.5 rounded-sm" variant="subtle" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
                <MarketplaceFooterSkeleton />
            </div>
        );
    }

    if (cleanPath.startsWith('/profile')) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
                <MarketplaceNavbarSkeleton />
                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                            <div className="space-y-2">
                                <Skeleton className="w-64 h-6 rounded-lg" />
                                <Skeleton className="w-80 h-4 rounded-md max-w-full" variant="subtle" />
                            </div>
                        </div>
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                                <Skeleton className="w-48 h-5 rounded-md" />
                                <Skeleton className="w-72 h-3.5 rounded-sm" variant="subtle" />
                                <div className="space-y-4 max-w-xl pt-2">
                                    <Skeleton className="w-full h-11 rounded-xl" variant="subtle" />
                                    <Skeleton className="w-full h-11 rounded-xl" variant="subtle" />
                                    <Skeleton className="w-32 h-10 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
                <MarketplaceFooterSkeleton />
            </div>
        );
    }

    return <LandingSkeleton />;
}
