import Spinner from '@/Components/Spinner';

export default function Pagination({
    paginator = null,
    onNavigateUrl = null,
    isLoading = false,
    currentPage = 1,
    totalItems = 0,
    perPage = 6,
    onPageChange = null,
    className = '',
}) {
    if (paginator && typeof paginator === 'object' && 'current_page' in paginator) {
        const lastPage = paginator.last_page || 1;
        const total = paginator.total || 0;
        const from = paginator.from || (total > 0 ? 1 : 0);
        const to = paginator.to || 0;
        const links = Array.isArray(paginator.links) ? paginator.links : [];

        if (total === 0) {
            return null;
        }

        const handleLinkClick = (e, url, active) => {
            e.preventDefault();
            if (!url || active || isLoading) return;
            if (onNavigateUrl) {
                onNavigateUrl(url);
            }
        };

        const currentPageNum = paginator.current_page || 1;
        const firstPageUrl =
            paginator.first_page_url ||
            links.find((l) => String(l.label) === '1')?.url ||
            null;
        const lastPageUrl =
            paginator.last_page_url ||
            links.find((l) => String(l.label) === String(lastPage))?.url ||
            null;

        return (
            <div
                className={`px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
            >
                <div className="flex items-center gap-2 text-neutral-500 tabular-nums">
                    <span>
                        Menampilkan <strong className="font-medium text-neutral-900">{from}–{to}</strong> dari{' '}
                        <strong className="font-medium text-neutral-900">{total}</strong>
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="font-mono text-neutral-500">
                        Maks. {paginator.per_page || 6}/hal
                    </span>
                    {isLoading && <Spinner className="w-3.5 h-3.5 text-neutral-600" />}
                </div>

                {lastPage > 1 ? (
                    <div className="flex flex-wrap items-center justify-center gap-1 tabular-nums">
                        <button
                            type="button"
                            disabled={currentPageNum <= 1 || !firstPageUrl || isLoading}
                            onClick={(e) => handleLinkClick(e, firstPageUrl, currentPageNum <= 1)}
                            title="Ke halaman pertama"
                            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                currentPageNum > 1 && firstPageUrl
                                    ? 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200/60 cursor-not-allowed'
                            }`}
                        >
                            « Awal
                        </button>

                        {links.map((link, idx) => {
                            const labelText = String(link.label || '')
                                .replace('&laquo; Previous', '‹ Sebelumnya')
                                .replace('Next &raquo;', 'Selanjutnya ›')
                                .replace('&laquo;', '‹')
                                .replace('&raquo;', '›')
                                .replace('Previous', 'Sebelumnya')
                                .replace('Next', 'Selanjutnya');

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={!link.url || link.active || isLoading}
                                    onClick={(e) => handleLinkClick(e, link.url, link.active)}
                                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                        link.active
                                            ? 'bg-neutral-900 text-white'
                                            : link.url
                                            ? 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200/60 cursor-not-allowed'
                                    }`}
                                >
                                    {labelText}
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            disabled={currentPageNum >= lastPage || !lastPageUrl || isLoading}
                            onClick={(e) => handleLinkClick(e, lastPageUrl, currentPageNum >= lastPage)}
                            title="Ke halaman terakhir"
                            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                currentPageNum < lastPage && lastPageUrl
                                    ? 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200/60 cursor-not-allowed'
                            }`}
                        >
                            Akhir »
                        </button>
                    </div>
                ) : (
                    <span className="font-mono text-xs text-neutral-500 tabular-nums">
                        Hal 1/1
                    </span>
                )}
            </div>
        );
    }

    if (totalItems <= 0) {
        return null;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const fromItem = (safePage - 1) * perPage + 1;
    const toItem = Math.min(safePage * perPage, totalItems);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div
            className={`px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
        >
            <div className="flex items-center gap-2 text-neutral-500 tabular-nums">
                <span>
                    Menampilkan <strong className="font-medium text-neutral-900">{fromItem}–{toItem}</strong> dari{' '}
                    <strong className="font-medium text-neutral-900">{totalItems}</strong>
                </span>
                <span className="text-neutral-300">•</span>
                <span className="font-mono text-neutral-500">
                    Maks. {perPage}/hal
                </span>
            </div>

            {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-1 tabular-nums">
                    <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => onPageChange && onPageChange(1)}
                        title="Ke halaman pertama"
                        className="h-8 px-2.5 rounded-lg text-xs font-medium bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                        « Awal
                    </button>

                    <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => onPageChange && onPageChange(safePage - 1)}
                        className="h-8 px-3 rounded-lg text-xs font-medium bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                        ‹ Sebelumnya
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange && onPageChange(p)}
                            className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                p === safePage
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                            }`}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => onPageChange && onPageChange(safePage + 1)}
                        className="h-8 px-3 rounded-lg text-xs font-medium bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                        Selanjutnya ›
                    </button>

                    <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => onPageChange && onPageChange(totalPages)}
                        title="Ke halaman terakhir"
                        className="h-8 px-2.5 rounded-lg text-xs font-medium bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                        Akhir »
                    </button>
                </div>
            ) : (
                <span className="font-mono text-xs text-neutral-500 tabular-nums">
                    Hal 1/1
                </span>
            )}
        </div>
    );
}
