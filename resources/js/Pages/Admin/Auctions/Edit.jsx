import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Spinner from '@/Components/Spinner';
import { broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah } from '@/Utils/format';
import { compressImageFiles, formatFileSize } from '@/Utils/imageCompressor';
import { useState } from 'react';

const toLocalDatetimeInput = (dateVal) => {
    const d = new Date(dateVal || Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Edit({ auction, categories }) {
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [filePreviews, setFilePreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [compressingImages, setCompressingImages] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const { data, setData, errors } = useForm({
        title: auction.title,
        category_id: auction.category_id,
        description: auction.description,
        starting_price: auction.starting_price,
        min_increment: auction.min_increment,
        buy_now_price: auction.buy_now_price || '',
        start_time: toLocalDatetimeInput(auction.start_time),
        end_time: toLocalDatetimeInput(auction.end_time),
        status: auction.status,
        images: Array.isArray(auction.images) ? auction.images : [],
        image_files: [],
    });

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setCompressingImages(true);
        try {
            const compressedResults = await compressImageFiles(files);
            const compressedFileObjects = compressedResults.map((r) => r.file);

            setData('image_files', [...data.image_files, ...compressedFileObjects]);

            const newPreviews = compressedResults.map((r) => ({
                name: r.file.name,
                compressedSizeStr: formatFileSize(r.compressedSize),
                savedPercent: r.savedPercent,
                url: r.previewUrl,
            }));
            setFilePreviews((prev) => [...prev, ...newPreviews]);
        } finally {
            setCompressingImages(false);
            e.target.value = '';
        }
    };

    const handleRemoveFile = (index) => {
        const updatedFiles = data.image_files.filter((_, i) => i !== index);
        setData('image_files', updatedFiles);

        URL.revokeObjectURL(filePreviews[index].url);
        setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddImageUrl = () => {
        if (!imageUrlInput.trim()) return;
        setData('images', [...data.images, imageUrlInput.trim()]);
        setImageUrlInput('');
    };

    const handleRemoveExistingImage = (index) => {
        setData('images', data.images.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const executeUpdateSubmit = () => {
        setSubmitting(true);
        router.post(
            route('admin.auctions.update', auction.id),
            {
                ...data,
                start_time: data.start_time ? new Date(data.start_time).toISOString() : new Date().toISOString(),
                end_time: data.end_time ? new Date(data.end_time).toISOString() : new Date(Date.now() + 86400000).toISOString(),
                _method: 'PUT',
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    setShowConfirmModal(false);
                    broadcastLiveSync('auction-updated');
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    const selectedCategory = categories.find((c) => String(c.id) === String(data.category_id));

    return (
        <AdminLayout title="Edit Item Lelang (Draft)">
            <Head title={`Edit ${auction.title} - MyBidder.ID`} />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900">Edit Data Lelang</h2>
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700">
                                📝 Status: Draft
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{auction.title}</p>
                    </div>
                    <Link
                        href={route('admin.auctions.index')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-sm transition-colors"
                    >
                        ← Kembali ke Katalog
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Judul / Nama Barang <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            required
                        />
                        {errors.title && <span className="text-xs text-red-500 mt-1 block">{errors.title}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Status Lelang <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="draft">📝 Tetap Simpan Sebagai Draft</option>
                                <option value="active">🔴 Rilis Langsung Menjadi LIVE</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Harga Pembukaan (OB) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="10000"
                                step="10000"
                                value={data.starting_price}
                                onChange={(e) => setData('starting_price', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                            <span className="text-[11px] font-bold text-amber-600 mt-1 block">
                                {formatRupiah(data.starting_price || 0)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Kelipatan Minimal (Increment) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="10000"
                                step="10000"
                                value={data.min_increment}
                                onChange={(e) => setData('min_increment', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                            <span className="text-[11px] font-bold text-emerald-600 mt-1 block">
                                +{formatRupiah(data.min_increment || 0)}
                            </span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Buy Now Price (Opsional)
                            </label>
                            <input
                                type="number"
                                value={data.buy_now_price}
                                onChange={(e) => setData('buy_now_price', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Waktu Mulai <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Waktu Berakhir (Batas Waktu Periode) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Foto Barang / Image Management */}
                    <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Foto Barang Produk
                        </label>

                        {/* Existing Images */}
                        {data.images.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Foto Saat Ini ({data.images.length}):</p>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {data.images.map((img, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 group shadow-sm">
                                            <img src={img} alt="Current" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingImage(idx)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload New Files */}
                        <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/70 hover:bg-amber-50/20">
                            <input
                                type="file"
                                id="edit-image-upload"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={compressingImages}
                                className="hidden"
                            />
                            <label htmlFor="edit-image-upload" className="cursor-pointer block space-y-1">
                                <span className="text-2xl block">
                                    {compressingImages ? '⏳' : '📸'}
                                </span>
                                <span className="text-xs font-bold text-amber-600 block hover:underline">
                                    {compressingImages
                                        ? '⚡ Mengompresi Gambar ke Format WebP...'
                                        : 'Klik di sini untuk mengunggah foto baru dari komputer'}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                    Otomatis dikompresi ke format WebP ringan
                                </span>
                            </label>
                        </div>

                        {/* Previews for newly uploaded files */}
                        {filePreviews.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-emerald-600 mb-2">
                                    ⚡ Foto Baru Terkompresi ({filePreviews.length} WebP):
                                </p>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {filePreviews.map((item, idx) => (
                                        <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-emerald-300 flex-shrink-0 group shadow-sm">
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                            {item.savedPercent > 0 && (
                                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black shadow">
                                                    -{item.savedPercent}%
                                                </span>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-[9px] text-white truncate text-center font-mono">
                                                {item.compressedSizeStr}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(idx)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-90 hover:opacity-100 transition-opacity shadow"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add URL */}
                        <div className="pt-2">
                            <p className="text-xs text-slate-600 mb-1.5 font-semibold">Atau tambahkan URL gambar eksternal:</p>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddImageUrl}
                                    className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                                >
                                    + Tambah URL
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Deskripsi Lengkap <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            required
                        />
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                        <Link
                            href={route('admin.auctions.index')}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Batal
                        </Link>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                    setData('status', 'active');
                                    setShowConfirmModal(true);
                                }}
                                className="px-5 py-3.5 rounded-2xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60"
                            >
                                🚀 Simpan & Rilis LIVE
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3.5 rounded-2xl font-black text-sm bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Spinner className="w-4 h-4 text-slate-950" />
                                        <span>Menyimpan Perubahan...</span>
                                    </>
                                ) : (
                                    <span>✓ Perbarui Data Lelang</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Pop-up Konfirmasi Simpan / Rilis Item Lelang */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!submitting) setShowConfirmModal(false);
                        }}
                    />
                    <div className="relative bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl z-10 space-y-5">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                                {data.status === 'active' ? '🚀' : '📝'}
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-900">
                                    {data.status === 'active'
                                        ? 'Konfirmasi Rilis Item Lelang (LIVE)'
                                        : 'Konfirmasi Perbarui Data Draft'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Pastikan nama barang, harga, dan deskripsi telah sesuai dengan keinginan.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Nama / Judul Barang
                                    </span>
                                    <p className="font-black text-slate-900 text-sm mt-0.5">
                                        {data.title || '(Belum diisi)'}
                                    </p>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase shrink-0 ${
                                        data.status === 'active'
                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                            : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {data.status === 'active' ? '🔴 Rilis LIVE' : '📝 Draft'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2.5 border-t border-slate-200/80">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Harga Awal (OB)
                                    </span>
                                    <p className="font-black text-amber-600 text-sm mt-0.5">
                                        {formatRupiah(data.starting_price || 0)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Kelipatan Bid
                                    </span>
                                    <p className="font-bold text-emerald-600 text-sm mt-0.5">
                                        +{formatRupiah(data.min_increment || 0)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Kategori
                                    </span>
                                    <p className="font-bold text-slate-700 text-xs mt-0.5 truncate">
                                        {selectedCategory?.name || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2.5 border-t border-slate-200/80">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Deskripsi Lengkap Barang
                                </span>
                                <div className="max-h-32 overflow-y-auto bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                                    {data.description || '(Belum ada deskripsi)'}
                                </div>
                            </div>
                        </div>

                        {data.status === 'active' && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                                ⚠️ <strong>Perhatian:</strong> Setelah dirilis menjadi <strong>LIVE</strong>, barang ini tidak dapat diedit atau dihapus lagi.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setShowConfirmModal(false)}
                                className="py-3 px-4 rounded-xl text-xs font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                <span>✏️ Edit / Ubah Data</span>
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={executeUpdateSubmit}
                                className="py-3 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Spinner className="w-4 h-4 text-white" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>
                                        {data.status === 'active' ? '🚀 Ya, Rilis LIVE' : '✓ Ya, Simpan Draft'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
