import Skeleton from './Skeleton';

export default function AdminSkeleton({ path = '/admin/dashboard', contentOnly = false }) {
    const cleanPath = (path || '/admin/dashboard').toLowerCase();
    const isDashboard = cleanPath === '/admin' || cleanPath.includes('/admin/dashboard');
    const isForm = cleanPath.includes('/create') || cleanPath.includes('/edit');
    const isReports = cleanPath.includes('/admin/reports');

    const mainContent = (
        <>
            {isDashboard ? (
                        <>
                            {/* Header & LiveSyncBadge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="space-y-1.5">
                                    <Skeleton className="w-64 h-6 rounded-lg" />
                                    <Skeleton className="w-96 h-3.5 rounded-md max-w-full" variant="subtle" />
                                </div>
                                <Skeleton className="w-52 h-8 rounded-2xl" variant="subtle" />
                            </div>

                            {/* 4 KPI Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="w-28 h-3.5 rounded-md" variant="subtle" />
                                            <Skeleton className="w-9 h-9 rounded-xl" variant="subtle" />
                                        </div>
                                        <Skeleton className="w-28 h-8 rounded-xl" />
                                        <Skeleton className="w-36 h-3.5 rounded-md" variant="subtle" />
                                    </div>
                                ))}
                            </div>

                            {/* 7 Cols Recent Bids Stream + 5 Cols Pending Payments Queue */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                        <div className="space-y-1.5">
                                            <Skeleton className="w-48 h-5 rounded-md" />
                                            <Skeleton className="w-64 h-3.5 rounded-sm" variant="subtle" />
                                        </div>
                                        <Skeleton className="w-24 h-4 rounded-md" variant="subtle" />
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="py-3.5 flex items-center justify-between">
                                                <div className="space-y-1.5">
                                                    <Skeleton className="w-56 h-4 rounded-md" />
                                                    <Skeleton className="w-44 h-3 rounded-sm" variant="subtle" />
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <Skeleton className="w-24 h-4 rounded-md ml-auto" />
                                                    <Skeleton className="w-16 h-2.5 rounded-sm ml-auto" variant="subtle" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                        <div className="space-y-1.5">
                                            <Skeleton className="w-40 h-5 rounded-md" />
                                            <Skeleton className="w-52 h-3.5 rounded-sm" variant="subtle" />
                                        </div>
                                        <Skeleton className="w-16 h-4 rounded-md" variant="subtle" />
                                    </div>
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                                            >
                                                <div className="space-y-1.5">
                                                    <Skeleton className="w-44 h-4 rounded-md" />
                                                    <Skeleton className="w-36 h-3 rounded-sm" variant="subtle" />
                                                    <Skeleton className="w-24 h-3.5 rounded-md" />
                                                </div>
                                                <Skeleton className="w-16 h-7 rounded-xl" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : isForm ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <Skeleton className="w-56 h-6 rounded-lg" />
                                    <Skeleton className="w-80 h-3.5 rounded-md max-w-full" variant="subtle" />
                                </div>
                                <Skeleton className="w-36 h-9 rounded-xl" variant="subtle" />
                            </div>

                            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                                <div className="space-y-4">
                                    <Skeleton className="w-48 h-5 rounded-md" />
                                    <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                        <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                    </div>
                                    <Skeleton className="w-full h-32 rounded-2xl" variant="subtle" />
                                </div>

                                <div className="space-y-4">
                                    <Skeleton className="w-44 h-5 rounded-md" />
                                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-2">
                                        <Skeleton className="w-12 h-12 rounded-2xl" />
                                        <Skeleton className="w-56 h-4 rounded-md" />
                                        <Skeleton className="w-72 h-3 rounded-sm" variant="subtle" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                    <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                    <Skeleton className="w-full h-12 rounded-2xl" variant="subtle" />
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <Skeleton className="w-16 h-5 rounded-md" variant="subtle" />
                                    <Skeleton className="w-56 h-12 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Header Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <Skeleton className="w-64 h-6 rounded-lg" />
                                    <Skeleton className="w-96 h-3.5 rounded-md max-w-full" variant="subtle" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-48 h-8 rounded-2xl" variant="subtle" />
                                    <Skeleton className="w-36 h-10 rounded-xl" />
                                </div>
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <Skeleton className="w-64 h-9 rounded-xl" variant="subtle" />
                                <Skeleton className="w-40 h-9 rounded-xl" variant="subtle" />
                                <Skeleton className="w-40 h-9 rounded-xl" variant="subtle" />
                            </div>

                            {/* 6 KPI Summary Cards on Reports Page */}
                            {isReports && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2"
                                        >
                                            <Skeleton className="w-24 h-3 rounded-sm" variant="subtle" />
                                            <Skeleton className="w-20 h-7 rounded-lg" />
                                            <Skeleton className="w-28 h-2.5 rounded-sm" variant="subtle" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Table Container */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                    <Skeleton className="w-56 h-4 rounded-md" />
                                    <Skeleton className="w-32 h-3.5 rounded-sm" variant="subtle" />
                                </div>

                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 grid grid-cols-6 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-3.5 w-20 rounded-sm" variant="subtle" />
                                    ))}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                                <div className="space-y-1.5">
                                                    <Skeleton className="w-48 h-4 rounded-md" />
                                                    <Skeleton className="w-28 h-3 rounded-sm" variant="subtle" />
                                                </div>
                                            </div>
                                            <Skeleton className="w-24 h-4 rounded-md hidden sm:block" variant="subtle" />
                                            <Skeleton className="w-28 h-4 rounded-md" />
                                            <Skeleton className="w-20 h-5 rounded-full hidden md:block" variant="subtle" />
                                            <Skeleton className="w-28 h-8 rounded-xl" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
        </>
    );

    if (contentOnly) {
        return <div className="p-4 lg:p-8">{mainContent}</div>;
    }

    return (
        <div className="min-h-screen bg-[#f4f5f7] text-slate-900 font-sans antialiased">
            {/* Sidebar Desktop (Fixed 1:1 dengan AdminLayout.jsx) */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30 flex-shrink-0 shadow-sm">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3 flex-shrink-0 bg-white">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1">
                        <Skeleton className="w-28 h-5 rounded-md" />
                        <Skeleton className="w-16 h-2.5 rounded-sm" variant="subtle" />
                    </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                    {Array.from({ length: 7 }).map((_, idx) => (
                        <Skeleton
                            key={idx}
                            className="w-full h-10 rounded-xl"
                            variant={idx === 0 ? 'default' : 'subtle'}
                        />
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-200 space-y-2 flex-shrink-0 bg-white">
                    <Skeleton className="w-full h-8 rounded-xl" variant="subtle" />
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="w-24 h-3.5 rounded-md" />
                            <Skeleton className="w-16 h-2.5 rounded-sm" variant="subtle" />
                        </div>
                        <Skeleton className="w-7 h-7 rounded-lg" variant="subtle" />
                    </div>
                </div>
            </aside>

            <div className="lg:pl-64 flex flex-col min-w-0 min-h-screen">
                <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Skeleton className="lg:hidden w-9 h-9 rounded-lg" variant="subtle" />
                        <Skeleton className="w-56 h-6 rounded-lg" />
                    </div>
                    <Skeleton className="hidden sm:block w-48 h-7 rounded-full" variant="subtle" />
                </header>
                <main className="flex-1 p-4 lg:p-8">{mainContent}</main>
            </div>
        </div>
    );
}
