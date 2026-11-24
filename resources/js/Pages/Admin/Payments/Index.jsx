import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Pagination from '@/Components/Pagination';
import Spinner from '@/Components/Spinner';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah, formatDateTime } from '@/Utils/format';
import { useState } from 'react';

const COMMON_COURIERS = ['JNE', 'J&T Express', 'SiCepat', 'POS Indonesia', 'Anteraja', 'TIKI', 'GoSend'];

export default function Index({ payments, filters }) {
    const [previewImage, setPreviewImage] = useState(null);
    const [rejectPayment, setRejectPayment] = useState(null);
    const [shippingPayment, setShippingPayment] = useState(null);
    const [verifyTarget, setVerifyTarget] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const { manualRefresh, fetchUrl, isNavigatingPage, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['payments'],
    });

    const livePayments = polledData?.payments || payments;

    const { data: rejectData, setData: setRejectData, post: postReject, processing: processingReject, reset: resetReject } = useForm({
        admin_notes: 'Struk transfer tidak jelas atau nominal tidak sesuai tagihan.',
    });

    const { data: shippingData, setData: setShippingData, post: postShipping, processing: processingShipping, reset: resetShipping, errors: shippingErrors } = useForm({
        courier_name: 'JNE',
        tracking_number: '',
        shipping_notes: '',
    });

    const handleVerify = (payment) => {
        setVerifyTarget(payment);
    };

    const confirmVerifyPayment = () => {
        if (!verifyTarget) return;
        setVerifying(true);
        router.post(
            route('admin.payments.verify', verifyTarget.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setVerifyTarget(null);
                    manualRefresh();
                    broadcastLiveSync('payment-verified');
                },
                onFinish: () => {
                    setVerifying(false);
                },
            }
        );
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        postReject(route('admin.payments.reject', rejectPayment.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setRejectPayment(null);
                resetReject();
                manualRefresh();
                broadcastLiveSync('payment-rejected');
            },
        });
    };

    const handleOpenShippingModal = (payment) => {
        setShippingPayment(payment);
        setShippingData({
            courier_name: payment.courier_name || 'JNE',
            tracking_number: payment.tracking_number || '',
            shipping_notes: payment.shipping_notes || '',
        });
    };

    const handleShippingSubmit = (e) => {
        e.preventDefault();
        postShipping(route('admin.payments.shipping', shippingPayment.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setShippingPayment(null);
                resetShipping();
                manualRefresh();
            },
        });
    };

    return (
        <AdminLayout title="Validasi Pembayaran & Status Pengiriman">
            <Head title="Validasi Pembayaran & Pengiriman — MyBidder.ID" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">Validasi Pembayaran & Pelunasan Lelang</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Periksa bukti transfer pemenang lelang, konfirmasi pelunasan, dan catat nomor resi pengiriman
                        </p>
                    </div>

                    <LiveSyncBadge
                        onManualRefresh={manualRefresh}
                        lastUpdated={lastUpdated}
                    />
                </div>

                {/* Filter */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200">
                    <select
                        defaultValue={filters.status}
                        onChange={(e) =>
                            router.get(
                                route('admin.payments.index'),
                                { ...filters, status: e.target.value },
                                { preserveState: true }
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua status pembayaran</option>
                        <option value="pending">Menunggu validasi</option>
                        <option value="verified">Terverifikasi (Lunas)</option>
                        <option value="rejected">Ditolak</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Cari nama penawar atau lot..."
                        defaultValue={filters.search}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                router.get(
                                    route('admin.payments.index'),
                                    {
                                        ...filters,
                                        search: e.target.value,
                                    },
                                    { preserveState: true }
                                );
                            }
                        }}
                        className="h-9 px-3.5 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs w-64 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-900">
                            Daftar Transaksi Pembayaran Masuk
                        </span>
                        <span className="text-neutral-500 font-mono tabular-nums">
                            {livePayments.total} transaksi
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3.5">Barang lelang</th>
                                    <th className="px-5 py-3.5">Pemenang</th>
                                    <th className="px-5 py-3.5 text-right">Total tagihan</th>
                                    <th className="px-5 py-3.5">Bukti transfer</th>
                                    <th className="px-5 py-3.5">Bank pengirim</th>
                                    <th className="px-5 py-3.5">Status & pengiriman</th>
                                    <th className="px-5 py-3.5 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {livePayments.data.length > 0 ? (
                                    livePayments.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-neutral-900 line-clamp-1 max-w-xs">{p.auction.title}</p>
                                                <span className="text-[11px] font-mono text-neutral-400">Lot #{p.auction_id}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-neutral-900">{p.user.name}</p>
                                                <span className="text-[11px] text-neutral-500">{p.user.email}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-semibold text-neutral-900 text-sm">
                                                {formatRupiah(p.amount)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage(p.proof_image)}
                                                    className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 block relative group"
                                                >
                                                    <img src={p.proof_image} alt="Bukti" className="w-full h-full object-cover" />
                                                    <span className="absolute inset-0 bg-neutral-950/40 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                        Lihat
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-5 py-3.5 text-neutral-700">
                                                <p className="font-medium text-neutral-900">{p.bank_name || 'Transfer Bank'}</p>
                                                <p className="text-[11px] text-neutral-500">{p.account_name}</p>
                                                {p.account_number && (
                                                    <p className="text-[11px] font-mono text-neutral-400">{p.account_number}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {p.status === 'verified' && (
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Lunas
                                                        </span>
                                                        {p.shipping_status === 'shipped' ? (
                                                            <div className="text-[11px]">
                                                                <span className="font-medium text-neutral-900 block">
                                                                    Terkirim ({p.courier_name})
                                                                </span>
                                                                <p className="text-neutral-600 font-mono">Resi: {p.tracking_number}</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="text-[11px] text-neutral-500">
                                                                    Siap dikirim
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {p.status === 'pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                        Menunggu validasi
                                                    </span>
                                                )}
                                                {p.status === 'rejected' && (
                                                    <div>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                            Ditolak
                                                        </span>
                                                        {p.admin_notes && (
                                                            <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">{p.admin_notes}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                                {p.status === 'pending' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(p)}
                                                            className="h-8 px-3 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                                                        >
                                                            Validasi lunas
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRejectPayment(p)}
                                                            className="h-8 px-3 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors duration-150"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </>
                                                )}

                                                {p.status === 'verified' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenShippingModal(p)}
                                                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                                            p.shipping_status === 'shipped'
                                                                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                                                                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                                                        }`}
                                                    >
                                                        {p.shipping_status === 'shipped' ? 'Ubah resi' : 'Input resi pengiriman'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-neutral-400">
                                            Tidak ada data pembayaran
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        paginator={livePayments}
                        onNavigateUrl={fetchUrl}
                        isLoading={isNavigatingPage}
                    />
                </div>
            </div>

            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/75" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2 border border-neutral-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center transition-colors duration-150"
                        >
                            ✕
                        </button>
                        <img src={previewImage} alt="Bukti Transfer Full" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
                    </div>
                </div>
            )}

            {rejectPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-lg relative text-neutral-900">
                        <h3 className="font-semibold text-base text-neutral-900 mb-1.5">
                            Tolak Bukti Pembayaran
                        </h3>
                        <p className="text-xs text-neutral-600 mb-4">
                            Pemenang <strong className="text-neutral-900">{rejectPayment.user.name}</strong> akan menerima catatan penolakan ini untuk mengunggah ulang bukti transfer.
                        </p>

                        <form onSubmit={handleRejectSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Catatan alasan penolakan
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectData.admin_notes}
                                    onChange={(e) => setRejectData('admin_notes', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={processingReject}
                                    onClick={() => setRejectPayment(null)}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingReject}
                                    className="h-9 px-4 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {processingReject ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <span>Tolak bukti</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {shippingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-lg w-full shadow-lg relative text-neutral-900">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
                            <h3 className="font-semibold text-base text-neutral-900">
                                Input Resi & Status Pengiriman
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShippingPayment(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-neutral-600 mb-4">
                            Lot <strong className="text-neutral-900">"{shippingPayment.auction.title}"</strong> dimenangkan oleh <strong className="text-neutral-900">{shippingPayment.user.name}</strong>.
                        </p>

                        <form onSubmit={handleShippingSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Ekspedisi / nama kurir
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {COMMON_COURIERS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setShippingData('courier_name', c)}
                                            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                                                shippingData.courier_name === c
                                                    ? 'bg-neutral-900 text-white'
                                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={shippingData.courier_name}
                                    onChange={(e) => setShippingData('courier_name', e.target.value)}
                                    placeholder="Contoh: JNE / J&T Express / SiCepat"
                                    className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                                {shippingErrors.courier_name && (
                                    <span className="text-xs text-red-600 mt-1 block">{shippingErrors.courier_name}</span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Nomor resi pengiriman
                                </label>
                                <input
                                    type="text"
                                    value={shippingData.tracking_number}
                                    onChange={(e) => setShippingData('tracking_number', e.target.value)}
                                    placeholder="Contoh: JNE88291039847"
                                    className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs font-mono focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                                {shippingErrors.tracking_number && (
                                    <span className="text-xs text-red-600 mt-1 block">{shippingErrors.tracking_number}</span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Catatan pengiriman (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={shippingData.shipping_notes}
                                    onChange={(e) => setShippingData('shipping_notes', e.target.value)}
                                    placeholder="Contoh: Packing kayu & asuransi pengiriman"
                                    className="w-full p-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                                <button
                                    type="button"
                                    disabled={processingShipping}
                                    onClick={() => setShippingPayment(null)}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingShipping}
                                    className="h-9 px-5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {processingShipping ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>Simpan & kirim resi</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(verifyTarget)}
                onClose={() => {
                    if (!verifying) setVerifyTarget(null);
                }}
                onConfirm={confirmVerifyPayment}
                title="Verifikasi pembayaran lelang"
                message={`Verifikasi pembayaran sebesar ${formatRupiah(verifyTarget?.amount || 0)} dari ${verifyTarget?.user?.name} untuk lot "${verifyTarget?.auction?.title}"? Status transaksi akan berubah menjadi Lunas.`}
                confirmText="Ya, verifikasi lunas"
                processingText="Memverifikasi..."
                variant="success"
                processing={verifying}
            />
        </AdminLayout>
    );
}
