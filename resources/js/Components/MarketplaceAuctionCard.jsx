import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import SlotPriceTicker from '@/Components/SlotPriceTicker';
import { formatRupiah } from '@/Utils/format';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80';

function formatCountdownShort(endTimeMs, nowMs) {
    if (!endTimeMs) return '00:00:00';
    const diff = Math.max(0, endTimeMs - nowMs);
    if (diff <= 0) return '00:00:00';
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function MarketplaceAuctionCard({ item, nowMs }) {
    const { auth } = usePage().props;
    const isAdmin = Boolean(auth?.user?.is_admin);
    const [imgSrc, setImgSrc] = useState(item.image);
    const isRecentlyUpdated = nowMs - item.lastUpdatedTick < 1200;
    const isEnded =
        item.status === 'ended' ||
        item.status === 'settled' ||
        (item.endTimeMs && item.endTimeMs <= nowMs);

    return (
        <Link
            href={route('auctions.show', item.slug)}
            className={`group shrink-0 w-[252px] sm:w-[264px] bg-white rounded-xl border transition-colors duration-150 flex flex-col justify-between overflow-hidden cursor-pointer ${
                isRecentlyUpdated
                    ? 'border-emerald-600'
                    : 'border-neutral-200 hover:border-neutral-400'
            }`}
        >
            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                <img
                    src={imgSrc}
                    alt={item.title}
                    onError={() => setImgSrc(FALLBACK_IMAGE)}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />

                {/* Signature detail: Monospace Lot Status & Timer bar */}
                {isEnded ? (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900/90 text-neutral-200 text-xs font-mono font-medium">
                        <span>Selesai</span>
                    </div>
                ) : (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900/90 text-white text-xs font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span>Live</span>
                    </div>
                )}

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-neutral-900/75 text-white text-xs font-mono tabular-nums">
                    {item.bidCount} tawaran
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-neutral-950/85 text-white text-xs font-mono tabular-nums">
                    <span className="text-neutral-300">
                        {isEnded ? 'Status' : 'Sisa waktu'}
                    </span>
                    <span className="font-medium text-white">
                        {isEnded ? 'Ditutup' : formatCountdownShort(item.endTimeMs, nowMs)}
                    </span>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <span className="inline-block text-xs font-medium text-neutral-500 mb-1">
                        {item.categoryLabel}
                    </span>

                    <h3 className="font-semibold text-sm text-neutral-900 leading-snug line-clamp-2 min-h-[40px] group-hover:text-amber-700 transition-colors duration-150">
                        {item.title}
                    </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2 tabular-nums">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Harga awal</span>
                        <span className="font-mono text-neutral-700">
                            {formatRupiah(item.openBid)}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
                        <div className="flex items-center justify-between mb-0.5 text-xs">
                            <span className="font-medium text-neutral-600">
                                {isEnded ? 'Harga akhir' : 'Tawaran tertinggi'}
                            </span>
                            <span className="text-neutral-400 truncate max-w-[90px]">
                                {item.lastBidder}
                            </span>
                        </div>

                        <SlotPriceTicker value={item.highestBid} delta={item.lastDelta} />
                    </div>

                    <div
                        className={`w-full h-9 px-3 rounded-lg font-medium text-xs transition-colors duration-150 flex items-center justify-center ${
                            isEnded || isAdmin
                                ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                        }`}
                    >
                        <span>
                            {isEnded
                                ? 'Lihat hasil lelang'
                                : isAdmin
                                ? 'Pantau lot'
                                : 'Tawar sekarang'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
