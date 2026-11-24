import { usePage } from '@inertiajs/react';
import MarketplaceNavbar from '@/Components/MarketplaceNavbar';
import ToastNotification from '@/Components/ToastNotification';

export default function UserLayout({
    children,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    onSearchSubmit,
}) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900 font-sans antialiased">
            <ToastNotification />

            <MarketplaceNavbar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                onSearchSubmit={onSearchSubmit}
            />

            {flash?.success && (
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">{flash.success}</p>
                    </div>
                </div>
            )}

            {flash?.error && (
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                        <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium">{flash.error}</p>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>

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
                        &copy; {new Date().getFullYear()} Nirwansyah Bara Samudera (3126500050)
                    </p>
                </div>
            </footer>
        </div>
    );
}
