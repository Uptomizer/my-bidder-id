import { Head, router } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import Pagination from '@/Components/Pagination';
import { useLivePolling } from '@/Hooks/useLivePolling';

export default function Notifications({ notifications }) {
    const { polledData, manualRefresh, fetchUrl, isNavigatingPage } = useLivePolling({
        intervalMs: 1000,
        only: ['notifications'],
    });

    const liveNotifications = polledData?.notifications || notifications;

    const handleMarkAllRead = () => {
        router.post(
            route('notifications.read-all'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => manualRefresh(),
            }
        );
    };

    const handleNotificationClick = (item) => {
        router.post(
            route('notifications.read', item.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    manualRefresh();
                    if (item.url) {
                        router.visit(item.url);
                    }
                },
            }
        );
    };

    return (
        <UserLayout>
            <Head title="Pusat Notifikasi — MyBidder.ID" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                            Pusat Notifikasi
                        </h1>
                        <p className="text-xs text-neutral-500 mt-1">
                            Pemberitahuan status penawaran, verifikasi alamat pemenang, dan pelunasan
                        </p>
                    </div>

                    {liveNotifications.data.some((n) => !n.is_read) && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="h-9 px-3.5 rounded-lg text-xs font-medium bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors duration-150"
                        >
                            Tandai semua dibaca
                        </button>
                    )}
                </div>

                {liveNotifications.data.length > 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                        {liveNotifications.data.map((item) => {
                            const isRejected =
                                item.type === 'payment_rejected' ||
                                item.type === 'bid_disqualified';
                            const isPositive =
                                item.type === 'payment_verified' ||
                                item.type === 'auction_won';

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors duration-150 cursor-pointer ${
                                        !item.is_read
                                            ? 'bg-amber-50/30 hover:bg-neutral-50'
                                            : 'hover:bg-neutral-50'
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                            isRejected
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : isPositive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            {isRejected ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            ) : isPositive ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                            )}
                                        </svg>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4
                                                className={`text-xs sm:text-sm ${
                                                    !item.is_read
                                                        ? 'font-semibold text-neutral-900'
                                                        : 'font-medium text-neutral-700'
                                                }`}
                                            >
                                                {item.title}
                                            </h4>
                                            <span className="text-xs font-mono text-neutral-400 whitespace-nowrap tabular-nums">
                                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                                            {item.message}
                                        </p>
                                    </div>

                                    {!item.is_read && (
                                        <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                                    )}
                                </div>
                            );
                        })}

                        <Pagination
                            paginator={liveNotifications}
                            onNavigateUrl={fetchUrl}
                            isLoading={isNavigatingPage}
                        />
                    </div>
                ) : (
                    <div className="text-center py-14 bg-white rounded-xl border border-neutral-200 p-8">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-500 mx-auto flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">Belum ada notifikasi</h3>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                            Saat Anda menawar atau memenangkan lot, pemberitahuan akan tampil di sini
                        </p>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
