import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import CountdownTimer from '@/Components/CountdownTimer';
import Pagination from '@/Components/Pagination';
import { useLivePolling } from '@/Hooks/useLivePolling';
import { formatRupiah } from '@/Utils/format';

export default function MyBids({ auctions }) {
    const { polledData, manualRefresh, fetchUrl, isNavigatingPage } = useLivePolling({
        intervalMs: 1000,
        only: ['auctions'],
    });

    const liveAuctions = polledData?.auctions || auctions;

    return (
        <UserLayout>
            <Head title="Riwayat Penawaran Saya — MyBidder.ID" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                        Riwayat Penawaran Saya
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Pantau posisi penawaran Anda pada setiap lot secara real-time
                    </p>
                </div>

                {liveAuctions.data.length > 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs tabular-nums">
                                <thead className="bg-neutral-50 font-medium text-neutral-500 border-b border-neutral-200">
                                    <tr>
                                        <th className="px-5 py-3.5">Barang lelang</th>
                                        <th className="px-5 py-3.5 text-right">Tawaran saya</th>
                                        <th className="px-5 py-3.5 text-right">Harga tertinggi</th>
                                        <th className="px-5 py-3.5">Status posisi</th>
                                        <th className="px-5 py-3.5">Sisa waktu</th>
                                        <th className="px-5 py-3.5 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {liveAuctions.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={
                                                            item.image ||
                                                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'
                                                        }
                                                        alt={item.title}
                                                        className="w-11 h-11 rounded-lg object-cover border border-neutral-200 shrink-0"
                                                    />
                                                    <div>
                                                        <Link
                                                            href={route('auctions.show', item.slug)}
                                                            className="font-semibold text-neutral-900 hover:text-amber-700 transition-colors duration-150 line-clamp-1 max-w-xs"
                                                        >
                                                            {item.title}
                                                        </Link>
                                                        <span className="text-[11px] text-neutral-500 block">
                                                            {item.category_name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-medium text-neutral-800">
                                                {formatRupiah(item.user_highest_bid)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-semibold text-neutral-900">
                                                {formatRupiah(item.current_price)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {item.bidding_status === 'won' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Menang
                                                    </span>
                                                )}
                                                {item.bidding_status === 'lost' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                                        Selesai (Kalah)
                                                    </span>
                                                )}
                                                {item.bidding_status === 'leading' &&
                                                    (new Date(item.end_time) <= new Date() ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Menang (Finalisasi)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                            <span>Tertinggi</span>
                                                        </span>
                                                    ))}
                                                {item.bidding_status === 'outbid' &&
                                                    (new Date(item.end_time) <= new Date() ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                                                            Terlampaui
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                            Terlampaui
                                                        </span>
                                                    ))}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <CountdownTimer endTime={item.end_time} onEnd={manualRefresh} />
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    href={route('auctions.show', item.slug)}
                                                    className="inline-flex items-center h-8 px-3 rounded-lg font-medium text-xs bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                                                >
                                                    {item.bidding_status === 'outbid' ? 'Tawar lagi' : 'Rincian'}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            paginator={liveAuctions}
                            onNavigateUrl={fetchUrl}
                            isLoading={isNavigatingPage}
                        />
                    </div>
                ) : (
                    <div className="text-center py-14 bg-white rounded-xl border border-neutral-200 p-8">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-500 mx-auto flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">Belum ada penawaran</h3>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                            Anda belum mengajukan penawaran pada lot manapun
                        </p>
                        <Link
                            href={route('auctions.index')}
                            className="inline-flex items-center h-9 mt-4 px-4 rounded-lg text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors duration-150"
                        >
                            Buka katalog lelang
                        </Link>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
