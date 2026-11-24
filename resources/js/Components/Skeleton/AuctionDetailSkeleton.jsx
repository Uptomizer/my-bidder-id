import Skeleton from './Skeleton';
import { MarketplaceNavbarSkeleton, MarketplaceFooterSkeleton } from './MarketplaceSkeleton';

export default function AuctionDetailSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900 font-sans antialiased">
            <MarketplaceNavbarSkeleton />

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 mb-6">
                    <Skeleton className="w-16 h-4 rounded-md" variant="subtle" />
                    <span className="text-slate-300">/</span>
                    <Skeleton className="w-24 h-4 rounded-md" variant="subtle" />
                    <span className="text-slate-300">/</span>
                    <Skeleton className="w-56 h-4 rounded-md" />
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Image Gallery & Description (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Main Image Stage */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm overflow-hidden">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative">
                                <Skeleton className="w-full h-full rounded-2xl" />
                                <div className="absolute top-4 left-4">
                                    <Skeleton className="w-28 h-7 rounded-full" />
                                </div>
                            </div>

                            {/* Thumbnails */}
                            <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <Skeleton
                                        key={idx}
                                        className="w-20 h-20 rounded-xl flex-shrink-0"
                                        variant={idx === 0 ? 'default' : 'subtle'}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Detailed Specifications & Description */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                            <Skeleton className="w-64 h-7 rounded-xl" />
                            <div className="space-y-2.5 pt-2">
                                <Skeleton className="w-full h-4 rounded-md" variant="subtle" />
                                <Skeleton className="w-11/12 h-4 rounded-md" variant="subtle" />
                                <Skeleton className="w-4/5 h-4 rounded-md" variant="subtle" />
                                <Skeleton className="w-5/6 h-4 rounded-md" variant="subtle" />
                            </div>

                            {/* Verification & Terms Guarantee (2 Boxes) */}
                            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60">
                                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="w-36 h-3.5 rounded-md" />
                                        <Skeleton className="w-full h-3 rounded-sm" variant="subtle" />
                                        <Skeleton className="w-4/5 h-3 rounded-sm" variant="subtle" />
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/60">
                                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="w-36 h-3.5 rounded-md" />
                                        <Skeleton className="w-full h-3 rounded-sm" variant="subtle" />
                                        <Skeleton className="w-4/5 h-3 rounded-sm" variant="subtle" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Timer, Price, Bidding & Live History (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Auction Status & Countdown Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="w-32 h-4 rounded-md" variant="subtle" />
                                <Skeleton className="w-24 h-6 rounded-full" variant="subtle" />
                            </div>

                            {/* Big Countdown Timer */}
                            <div className="mb-6">
                                <Skeleton className="w-full h-14 rounded-2xl" variant="subtle" />
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Skeleton className="w-full h-7 rounded-xl" />
                                <Skeleton className="w-3/4 h-7 rounded-xl" />
                            </div>

                            {/* Current Highest Bid Highlight (Dark Box) */}
                            <div className="mt-6 p-5 rounded-2xl bg-slate-900 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="w-44 h-3.5 rounded-md" variant="dark" />
                                    <Skeleton className="w-24 h-3.5 rounded-md" variant="dark" />
                                </div>
                                <Skeleton className="w-56 h-10 rounded-xl" variant="dark" />
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <Skeleton className="w-32 h-3.5 rounded-md" variant="dark" />
                                    <Skeleton className="w-32 h-3.5 rounded-md" variant="dark" />
                                </div>
                            </div>

                            {/* Fast Bid 2x2 Grid */}
                            <div className="mt-6 space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="w-40 h-3.5 rounded-md" variant="subtle" />
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.from({ length: 4 }).map((_, idx) => (
                                            <Skeleton
                                                key={idx}
                                                className="h-9 rounded-xl"
                                                variant={idx === 0 ? 'default' : 'subtle'}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Amount Input */}
                                <div className="space-y-2">
                                    <Skeleton className="w-48 h-3.5 rounded-md" variant="subtle" />
                                    <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                    <Skeleton className="w-64 h-3 rounded-sm" variant="subtle" />
                                </div>

                                {/* Submit Button */}
                                <Skeleton className="w-full h-14 rounded-2xl" />
                            </div>
                        </div>

                        {/* Live Bid History Box */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-36 h-5 rounded-md" />
                                    <Skeleton className="w-14 h-5 rounded-full" variant="subtle" />
                                </div>
                                <Skeleton className="w-28 h-3.5 rounded-sm" variant="subtle" />
                            </div>

                            <div className="divide-y divide-slate-100">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <div key={idx} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Skeleton className="w-7 h-7 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="w-24 h-3.5 rounded-md" />
                                                <Skeleton className="w-16 h-2.5 rounded-sm" variant="subtle" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-28 h-4 rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MarketplaceFooterSkeleton />
        </div>
    );
}
