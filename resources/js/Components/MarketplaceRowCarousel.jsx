import { useEffect, useRef, useState } from 'react';
import MarketplaceAuctionCard from '@/Components/MarketplaceAuctionCard';
import Pagination from '@/Components/Pagination';

export default function MarketplaceRowCarousel({ row, nowMs }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const perPage = 6;
    const totalItems = Array.isArray(row?.items) ? row.items.length : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedItems = Array.isArray(row?.items)
        ? row.items.slice((safePage - 1) * perPage, safePage * perPage)
        : [];

    const checkScrollButtons = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    };

    useEffect(() => {
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        return () => window.removeEventListener('resize', checkScrollButtons);
    }, [row.items.length, safePage]);

    const scrollByAmount = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = Math.max(260, el.clientWidth * 0.78);
        el.scrollBy({
            left: direction === 'right' ? amount : -amount,
            behavior: 'smooth',
        });
    };

    if (!row.items || row.items.length === 0) {
        return null;
    }

    return (
        <section className="relative bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                                {row.title}
                            </h2>
                            <span className="font-mono text-xs text-neutral-500 tabular-nums">
                                ({row.items.length} lot)
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{row.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => scrollByAmount('left')}
                            disabled={!canScrollLeft}
                            aria-label="Geser ke kiri"
                            className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByAmount('right')}
                            disabled={!canScrollRight}
                            aria-label="Geser ke kanan"
                            className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={checkScrollButtons}
                    className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar py-1"
                >
                    {paginatedItems.map((item) => (
                        <MarketplaceAuctionCard
                            key={item.id}
                            item={item}
                            nowMs={nowMs}
                        />
                    ))}
                </div>
            </div>

            <Pagination
                currentPage={safePage}
                totalItems={totalItems}
                perPage={perPage}
                onPageChange={setCurrentPage}
            />
        </section>
    );
}
