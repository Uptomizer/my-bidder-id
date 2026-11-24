import { Head, useForm } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import Spinner from '@/Components/Spinner';
import Pagination from '@/Components/Pagination';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah } from '@/Utils/format';
import { compressImageFile, formatFileSize } from '@/Utils/imageCompressor';
import { useState } from 'react';

export default function MyWins({ wins }) {
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [verificationAuction, setVerificationAuction] = useState(null);
    const [compressingProof, setCompressingProof] = useState(false);
    const [proofCompressionInfo, setProofCompressionInfo] = useState(null);

    const { polledData, manualRefresh, fetchUrl, isNavigatingPage } = useLivePolling({
        intervalMs: 1000,
        only: ['wins'],
    });

    const liveWins = polledData?.wins || wins;

    const {
        data: verifData,
        setData: setVerifData,
        post: postVerif,
        processing: processingVerif,
        errors: verifErrors,
    } = useForm({
        full_name: '',
        phone: '',
        address: '',
        postal_code: '',
        address_detail: '',
        notes: '',
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        proof_image: null,
        bank_name: '',
        account_name: '',
        account_number: '',
    });

    const handleOpenVerificationModal = (win) => {
        const existing = win.verification_data || {};
        setVerifData({
            full_name: existing.full_name || '',
            phone: existing.phone || '',
            address: existing.address || '',
            postal_code: existing.postal_code || '',
            address_detail: existing.address_detail || '',
            notes: existing.notes || '',
        });
        setVerificationAuction(win);
    };

    const handleVerificationSubmit = (e) => {
        e.preventDefault();
        if (!verificationAuction) return;

        postVerif(route('user.verification.submit', verificationAuction.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setVerificationAuction(null);
                manualRefresh();
                broadcastLiveSync('winner-verification-submitted');
            },
        });
    };

    const handleOpenPaymentModal = (win) => {
        setSelectedAuction(win);
        setProofCompressionInfo(null);
        reset();
    };

    const handleProofFileChange = async (e) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        setCompressingProof(true);
        try {
            const result = await compressImageFile(rawFile);
            setData('proof_image', result.file);
            setProofCompressionInfo({
                originalSizeStr: formatFileSize(result.originalSize),
                compressedSizeStr: formatFileSize(result.compressedSize),
                savedPercent: result.savedPercent,
                previewUrl: result.previewUrl,
            });
        } finally {
            setCompressingProof(false);
        }
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        post(route('user.payment.submit', selectedAuction.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedAuction(null);
                reset();
                manualRefresh();
                broadcastLiveSync('payment-submitted');
            },
        });
    };

    return (
        <UserLayout>
            <Head title="Kemenangan Lelang & Pembayaran — MyBidder.ID" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                        Kemenangan Lelang Saya
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Lengkapi formulir verifikasi data & alamat pemenang terlebih dahulu untuk disetujui Admin (1x24 jam) sebelum melanjutkan ke pembayaran
                    </p>
                </div>

                {liveWins.data.length > 0 ? (
                    <div className="space-y-4">
                        {liveWins.data.map((item) => {
                            const vStatus = item.verification_status || 'unsubmitted';
                            const vData = item.verification_data || {};

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={
                                                    item.image ||
                                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'
                                                }
                                                alt={item.title}
                                                className="w-16 h-16 rounded-lg object-cover border border-neutral-200 shrink-0"
                                            />
                                            <div className="tabular-nums">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium text-neutral-500">
                                                        {item.category}
                                                    </span>
                                                    {item.invoice_number && (
                                                        <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[11px] font-medium text-neutral-700">
                                                            {item.invoice_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-base text-neutral-900 line-clamp-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    Tagihan pemenang:{' '}
                                                    <strong className="text-neutral-900 font-mono font-semibold">
                                                        {formatRupiah(item.winning_price)}
                                                    </strong>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto justify-end">
                                            <div>
                                                {item.payment ? (
                                                    item.payment.status === 'verified' ? (
                                                        <div className="text-right space-y-1">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Lunas — Siap kirim
                                                            </span>
                                                            {item.payment.shipping_status === 'shipped' ? (
                                                                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-left max-w-xs mt-1">
                                                                    <p className="font-semibold text-neutral-900">
                                                                        Barang telah dikirim ({item.payment.courier_name})
                                                                    </p>
                                                                    <div className="flex items-center justify-between gap-2 mt-1 bg-white px-2 py-1 rounded border border-neutral-200">
                                                                        <span className="font-mono font-medium text-neutral-800 text-[11px] truncate">
                                                                            {item.payment.tracking_number}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(
                                                                                    item.payment.tracking_number
                                                                                );
                                                                            }}
                                                                            className="text-[11px] text-neutral-700 hover:text-neutral-900 font-medium shrink-0"
                                                                        >
                                                                            Salin
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 mt-1">
                                                                    Sedang dikemas oleh Admin
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : item.payment.status === 'pending' ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                            Menunggu verifikasi pembayaran
                                                        </span>
                                                    ) : (
                                                        <div className="text-right">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                                Bukti pembayaran ditolak
                                                            </span>
                                                            {item.payment.admin_notes && (
                                                                <p className="text-[11px] text-red-600 mt-1 max-w-xs text-right">
                                                                    Alasan: {item.payment.admin_notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )
                                                ) : vStatus === 'unsubmitted' ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                                                        Tahap 1: Belum isi form verifikasi
                                                    </span>
                                                ) : vStatus === 'pending' ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                        Menunggu approve Admin (1x24 jam)
                                                    </span>
                                                ) : vStatus === 'rejected' ? (
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                            Data verifikasi perlu diperbaiki
                                                        </span>
                                                        {vData.verification_note && (
                                                            <p className="text-[11px] text-red-600 mt-1 max-w-xs text-right">
                                                                Catatan Admin: {vData.verification_note}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Data terverifikasi — Siap bayar
                                                    </span>
                                                )}
                                            </div>

                                            {(!item.payment || item.payment.status === 'rejected') && (
                                                <>
                                                    {(vStatus === 'unsubmitted' || vStatus === 'rejected') && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenVerificationModal(item)}
                                                            className="h-9 px-4 rounded-lg font-medium text-xs bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150"
                                                        >
                                                            {vStatus === 'rejected'
                                                                ? 'Perbaiki form verifikasi'
                                                                : 'Isi form verifikasi pemenang'}
                                                        </button>
                                                    )}

                                                    {vStatus === 'pending' && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenVerificationModal(item)}
                                                                className="h-9 px-3 rounded-lg font-medium text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors duration-150"
                                                            >
                                                                Lihat / ubah data
                                                            </button>
                                                            <span
                                                                className="h-9 px-3 rounded-lg font-medium text-xs bg-neutral-100 text-neutral-400 border border-neutral-200 flex items-center cursor-not-allowed"
                                                                title="Menunggu persetujuan verifikasi data oleh Admin (1x24 jam)"
                                                            >
                                                                Menunggu approve Admin
                                                            </span>
                                                        </div>
                                                    )}

                                                    {vStatus === 'approved' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenPaymentModal(item)}
                                                            className="h-9 px-4 rounded-lg font-medium text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-150"
                                                        >
                                                            {item.payment
                                                                ? 'Unggah ulang bukti transfer'
                                                                : 'Lanjut ke pembayaran'}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {!item.payment && (
                                        <div
                                            className={`rounded-lg p-3 border text-xs ${
                                                vStatus === 'approved'
                                                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                                    : vStatus === 'pending'
                                                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                                                    : vStatus === 'rejected'
                                                    ? 'bg-red-50/60 border-red-200 text-red-900'
                                                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                                            }`}
                                        >
                                            {vStatus === 'unsubmitted' && (
                                                <p>
                                                    <strong className="font-semibold">Tahap sebelum pembayaran:</strong> Klik tombol{' '}
                                                    <strong className="font-semibold">Isi form verifikasi pemenang</strong> untuk mengisi nama lengkap, nomor telepon aktif, alamat, dan kode pos. Admin akan memverifikasi data Anda dalam waktu maksimal 1x24 jam.
                                                </p>
                                            )}

                                            {vStatus === 'pending' && (
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold">
                                                        Formulir verifikasi sedang dicek Admin (Estimasi 1x24 jam)
                                                    </p>
                                                    <p className="text-neutral-600">
                                                        Penerima: {vData.full_name} ({vData.phone}) — {vData.address}, Kode pos {vData.postal_code}
                                                        {vData.address_detail ? ` (${vData.address_detail})` : ''}. Notifikasi akan masuk otomatis setelah disetujui untuk lanjut ke pembayaran.
                                                    </p>
                                                </div>
                                            )}

                                            {vStatus === 'rejected' && (
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold">
                                                        Admin meminta perbaikan formulir data pemenang
                                                    </p>
                                                    <p>
                                                        Catatan Admin: {vData.verification_note || 'Mohon lengkapi data alamat dan nomor telepon aktif yang dapat dihubungi.'}
                                                    </p>
                                                </div>
                                            )}

                                            {vStatus === 'approved' && (
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-emerald-900">
                                                        Data & alamat pengiriman telah terverifikasi oleh Admin
                                                    </p>
                                                    <p className="text-emerald-800">
                                                        Penerima: {vData.full_name} ({vData.phone}) — {vData.address} ({vData.postal_code}). Silakan klik Lanjut ke pembayaran untuk mengunggah bukti transfer.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                            <Pagination
                                paginator={liveWins}
                                onNavigateUrl={fetchUrl}
                                isLoading={isNavigatingPage}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-14 bg-white rounded-xl border border-neutral-200 p-8">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-500 mx-auto flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">Belum ada kemenangan</h3>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                            Ikuti penawaran pada katalog lelang aktif untuk memenangkan lot pilihan Anda
                        </p>
                    </div>
                )}
            </div>

            {/* POP-UP 1: Formulir Verifikasi Data & Alamat Pemenang Sebelum Pembayaran */}
            {verificationAuction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-xl w-full shadow-lg relative max-h-[92vh] overflow-y-auto">
                        <div className="flex items-start justify-between pb-4 border-b border-neutral-200 mb-4">
                            <div>
                                <span className="text-xs font-mono text-neutral-500 block">
                                    Tahap 1 sebelum pembayaran
                                </span>
                                <h3 className="font-semibold text-base text-neutral-900 mt-0.5">
                                    Formulir Verifikasi Data & Alamat Pemenang
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                                    {verificationAuction.title} — <span className="font-mono font-medium text-neutral-900">{formatRupiah(verificationAuction.winning_price)}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setVerificationAuction(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 mb-4 text-xs text-neutral-600 leading-relaxed">
                            Pastikan nomor telepon aktif dan alamat pengiriman diisi dengan benar. Setelah dikirim, Admin akan melakukan verifikasi maksimal 1x24 jam dan mengirimkan notifikasi begitu Anda siap melanjutkan ke pembayaran.
                        </div>

                        <form onSubmit={handleVerificationSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                        Nama lengkap penerima <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nama lengkap sesuai identitas"
                                        value={verifData.full_name}
                                        onChange={(e) => setVerifData('full_name', e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                        required
                                    />
                                    {verifErrors.full_name && (
                                        <span className="text-xs text-red-600 mt-1 block">{verifErrors.full_name}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                        Nomor telepon aktif (Bisa dihubungi) <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 081234567890"
                                        value={verifData.phone}
                                        onChange={(e) => setVerifData('phone', e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                        required
                                    />
                                    {verifErrors.phone && (
                                        <span className="text-xs text-red-600 mt-1 block">{verifErrors.phone}</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Alamat lengkap pengiriman <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, provinsi"
                                    value={verifData.address}
                                    onChange={(e) => setVerifData('address', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                                {verifErrors.address && (
                                    <span className="text-xs text-red-600 mt-1 block">{verifErrors.address}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                        Kode pos <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 12190"
                                        value={verifData.postal_code}
                                        onChange={(e) => setVerifData('postal_code', e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                        required
                                    />
                                    {verifErrors.postal_code && (
                                        <span className="text-xs text-red-600 mt-1 block">{verifErrors.postal_code}</span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                        Alamat lainnya / No. apartemen (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="No. apartemen, gedung, lantai, blok, patokan"
                                        value={verifData.address_detail}
                                        onChange={(e) => setVerifData('address_detail', e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    />
                                    {verifErrors.address_detail && (
                                        <span className="text-xs text-red-600 mt-1 block">{verifErrors.address_detail}</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Pelengkap lainnya / catatan pengiriman (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Jam penerimaan paket, instruksi khusus kurir, atau kontak alternatif"
                                    value={verifData.notes}
                                    onChange={(e) => setVerifData('notes', e.target.value)}
                                    className="w-full p-3 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                />
                                {verifErrors.notes && (
                                    <span className="text-xs text-red-600 mt-1 block">{verifErrors.notes}</span>
                                )}
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                                <button
                                    type="button"
                                    disabled={processingVerif}
                                    onClick={() => setVerificationAuction(null)}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingVerif}
                                    className="h-9 px-5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {processingVerif ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                            <span>Mengirim data...</span>
                                        </>
                                    ) : (
                                        <span>Kirim data verifikasi</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POP-UP 2: Payment Upload Modal */}
            {selectedAuction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-lg w-full shadow-lg relative">
                        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-5">
                            <div>
                                <span className="text-xs font-mono text-emerald-700 block">
                                    Data terverifikasi Admin
                                </span>
                                <h3 className="font-semibold text-base text-neutral-900 mt-0.5">
                                    Konfirmasi Pembayaran Lelang
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedAuction(null)}
                                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 mb-5 text-xs text-neutral-700 space-y-1.5 tabular-nums">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-neutral-900">
                                    Rekening resmi MyBidder.ID Settlement
                                </p>
                                {selectedAuction.invoice_number && (
                                    <span className="font-mono text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                                        {selectedAuction.invoice_number}
                                    </span>
                                )}
                            </div>
                            <p>Bank Central Asia (BCA): <strong className="font-mono">8820-192-888</strong> a/n PT MyBidder Indonesia</p>
                            <p>Bank Mandiri: <strong className="font-mono">141-00-9876543-1</strong> a/n PT MyBidder Indonesia</p>
                            <p className="pt-1 text-neutral-500">
                                Total tagihan lelang: <strong className="text-neutral-900 font-mono font-semibold">{formatRupiah(selectedAuction.winning_price)}</strong>
                            </p>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Bank pengirim
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: BCA, Mandiri, BRI, BNI"
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                                {errors.bank_name && <span className="text-xs text-red-600">{errors.bank_name}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Nama pemilik rekening
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nama lengkap pada rekening pengirim"
                                    value={data.account_name}
                                    onChange={(e) => setData('account_name', e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                    required
                                />
                                {errors.account_name && <span className="text-xs text-red-600">{errors.account_name}</span>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Nomor rekening (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nomor rekening pengirim"
                                    value={data.account_number}
                                    onChange={(e) => setData('account_number', e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-xs focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Unggah foto struk / bukti transfer
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProofFileChange}
                                    disabled={compressingProof}
                                    className="w-full text-xs text-neutral-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-neutral-100 file:text-neutral-800 hover:file:bg-neutral-200"
                                    required
                                />
                                {compressingProof && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                                        <Spinner className="w-3.5 h-3.5 text-neutral-700" />
                                        <span>Mengompresi gambar bukti transfer...</span>
                                    </div>
                                )}
                                {proofCompressionInfo && !compressingProof && (
                                    <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                                        <img
                                            src={proofCompressionInfo.previewUrl}
                                            alt="Preview Bukti"
                                            className="w-11 h-11 rounded-md object-cover border border-emerald-300 shrink-0"
                                        />
                                        <div className="text-xs text-emerald-900">
                                            <p className="font-medium">
                                                Gambar terkompresi (WebP)
                                            </p>
                                            <p className="text-[11px] font-mono text-emerald-700 mt-0.5 tabular-nums">
                                                Ukuran: {proofCompressionInfo.compressedSizeStr}
                                                {proofCompressionInfo.savedPercent > 0
                                                    ? ` (-${proofCompressionInfo.savedPercent}% dari ${proofCompressionInfo.originalSizeStr})`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {errors.proof_image && <span className="text-xs text-red-600 mt-1 block">{errors.proof_image}</span>}
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                                <button
                                    type="button"
                                    disabled={processing || compressingProof}
                                    onClick={() => setSelectedAuction(null)}
                                    className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || compressingProof}
                                    className="h-9 px-5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Spinner className="w-3.5 h-3.5 text-white" />
                                            <span>Mengunggah...</span>
                                        </>
                                    ) : (
                                        <span>Kirim bukti pembayaran</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}
