import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Spinner from '@/Components/Spinner';
import { broadcastLiveSync } from '@/Hooks/useLivePolling';
import { formatRupiah } from '@/Utils/format';
import { compressImageFiles, formatFileSize } from '@/Utils/imageCompressor';
import { useState } from 'react';

const OB_PRESETS = [500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000];
const INC_PRESETS = [25000, 50000, 100000, 250000, 500000, 1000000];

const toLocalDatetimeInput = (dateObj = new Date()) => {
    const d = new Date(dateObj);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Create({ categories }) {
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [filePreviews, setFilePreviews] = useState([]);
    const [compressingImages, setCompressingImages] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const defaultStartTime = toLocalDatetimeInput(new Date());
    const defaultEndTime = toLocalDatetimeInput(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

    const { data, setData, post, processing, errors, transform } = useForm({
        title: '',
        category_id: categories[0]?.id || '',
        description: '',
        starting_price: 1000000,
        min_increment: 50000,
        buy_now_price: '',
        start_time: defaultStartTime,
        end_time: defaultEndTime,
        status: 'active',
        images: [],
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
                originalSizeStr: formatFileSize(r.originalSize),
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

    const handleRemoveImageUrl = (index) => {
        setData('images', data.images.filter((_, i) => i !== index));
    };

    const setDurationOffsetMs = (offsetMs) => {
        const now = new Date();
        const startStr = toLocalDatetimeInput(now);
        const endStr = toLocalDatetimeInput(new Date(now.getTime() + offsetMs));
        setData((prev) => ({
            ...prev,
            start_time: startStr,
            end_time: endStr,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const executeReleaseSubmit = () => {
        transform((formData) => ({
            ...formData,
            start_time: formData.start_time ? new Date(formData.start_time).toISOString() : new Date().toISOString(),
            end_time: formData.end_time ? new Date(formData.end_time).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        }));
        post(route('admin.auctions.store'), {
            forceFormData: true,
            onSuccess: () => {
                setShowConfirmModal(false);
                broadcastLiveSync('auction-created');
            },
            onError: () => {
                setShowConfirmModal(false);
            },
        });
    };

    const selectedCategory = categories.find((c) => String(c.id) === String(data.category_id));

    return (
        <AdminLayout title="Tambah Barang Lelang Baru">
            <Head title="Tambah Barang Lelang - MyBidder.ID" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Form Rilis Barang Lelang</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Lengkapi foto barang, tentukan harga pembukaan (OB), kelipatan bid, nama barang, serta batas waktu sesi.
                        </p>
                    </div>
                    <Link
                        href={route('admin.auctions.index')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-sm transition-colors"
                    >
                        ← Kembali ke Katalog
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                    {/* Section 1: Informasi Dasar Produk */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="text-amber-600 font-bold text-sm">1.</span>
                            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                                Informasi Dasar Barang
                            </h3>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Nama / Judul Barang Lelang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Rolex Submariner Ref 16800 Vintage 1982 Original Box & Papers"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                            {errors.title && <span className="text-xs text-red-500 mt-1 block">{errors.title}</span>}
                        </div>

                        {/* Category & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Kategori Barang <span className="text-red-500">*</span>
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
                                {errors.category_id && <span className="text-xs text-red-500 mt-1 block">{errors.category_id}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Status Sesi Lelang <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="active">Active (Langsung LIVE dapat ditawar)</option>
                                    <option value="draft">Draft (Simpan sementara di arsip)</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Deskripsi Lengkap, Kelengkapan & Kondisi Fisik <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={5}
                                placeholder="Jelaskan spesifikasi detail barang, keaslian dokumen/sertifikat, nomor seri, kelengkapan kotak (box), dan kondisi fisik secara transparan..."
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                            {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description}</span>}
                        </div>
                    </div>

                    {/* Section 2: Foto Barang (Upload File & URL) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="text-amber-600 font-bold text-sm">2.</span>
                            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                                Unggah Foto Barang
                            </h3>
                        </div>

                        {/* File Upload Box */}
                        <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-6 text-center transition-all bg-slate-50/70 hover:bg-amber-50/20">
                            <input
                                type="file"
                                id="image-upload"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={compressingImages}
                                className="hidden"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer block space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto border border-amber-200">
                                    {compressingImages ? <Spinner className="w-6 h-6 text-amber-600" /> : '📸'}
                                </div>
                                <span className="text-sm font-bold text-slate-800 block hover:text-amber-600 transition-colors">
                                    {compressingImages
                                        ? '⚡ Mengompresi & Mengoptimalkan Gambar ke WebP...'
                                        : 'Klik untuk memilih foto dari komputer'}
                                </span>
                                <span className="text-xs text-slate-500 block">
                                    Otomatis dikompresi ke format WebP ringan agar tidak membebani server & mempercepat loading website
                                </span>
                            </label>
                        </div>

                        {/* Previews for Uploaded Files */}
                        {filePreviews.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-emerald-600 mb-2.5">
                                    ⚡ Foto Terkompresi & Siap Diunggah ({filePreviews.length} file WebP):
                                </p>
                                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                    {filePreviews.map((item, idx) => (
                                        <div key={idx} className="relative w-32 h-32 rounded-2xl overflow-hidden border border-emerald-300 flex-shrink-0 group bg-slate-50 shadow-sm">
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                            {item.savedPercent > 0 && (
                                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black shadow">
                                                    -{item.savedPercent}%
                                                </span>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-1 text-[9px] text-white truncate text-center font-mono">
                                                {item.compressedSizeStr}
                                                {item.savedPercent > 0 ? ` (dari ${item.originalSizeStr})` : ''}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(idx)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-90 hover:opacity-100 transition-opacity shadow"
                                                title="Hapus foto ini"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* External URL Support */}
                        <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Atau tambahkan tautan URL gambar online:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://images.unsplash.com/... atau URL foto langsung"
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

                            {data.images.length > 0 && (
                                <div className="flex gap-3 mt-3 overflow-x-auto pb-2 no-scrollbar">
                                    {data.images.map((img, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 group shadow-sm">
                                            <img src={img} alt="URL Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImageUrl(idx)}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Nominal Penawaran (OB, Kelipatan, Buy Now) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="text-amber-600 font-bold text-sm">3.</span>
                            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                                Aturan Harga & Nominal Penawaran (Bid)
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {/* Open Bid */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Harga Pembukaan (OB) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">Rp</span>
                                    <input
                                        type="number"
                                        min="10000"
                                        step="10000"
                                        value={data.starting_price}
                                        onChange={(e) => setData('starting_price', parseInt(e.target.value) || 0)}
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-black"
                                        required
                                    />
                                </div>
                                <span className="text-xs font-bold text-amber-600 mt-1 block">
                                    {formatRupiah(data.starting_price)}
                                </span>
                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {OB_PRESETS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setData('starting_price', p)}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                                                data.starting_price === p
                                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                            }`}
                                        >
                                            {p >= 1000000 ? `${p / 1000000}Jt` : `${p / 1000}Rb`}
                                        </button>
                                    ))}
                                </div>
                                {errors.starting_price && <span className="text-xs text-red-500 mt-1 block">{errors.starting_price}</span>}
                            </div>

                            {/* Min Increment */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Syarat Kelipatan (Increment) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">Rp</span>
                                    <input
                                        type="number"
                                        min="10000"
                                        step="10000"
                                        value={data.min_increment}
                                        onChange={(e) => setData('min_increment', parseInt(e.target.value) || 0)}
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-black"
                                        required
                                    />
                                </div>
                                <span className="text-xs font-bold text-emerald-600 mt-1 block">
                                    +{formatRupiah(data.min_increment)}
                                </span>
                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {INC_PRESETS.map((inc) => (
                                        <button
                                            key={inc}
                                            type="button"
                                            onClick={() => setData('min_increment', inc)}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                                                data.min_increment === inc
                                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                            }`}
                                        >
                                            +{inc >= 1000000 ? `${inc / 1000000}Jt` : `${inc / 1000}Rb`}
                                        </button>
                                    ))}
                                </div>
                                {errors.min_increment && <span className="text-xs text-red-500 mt-1 block">{errors.min_increment}</span>}
                            </div>

                            {/* Buy Now Price */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Buy Now Price (Opsional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">Rp</span>
                                    <input
                                        type="number"
                                        placeholder="Kosongkan jika murni lelang"
                                        value={data.buy_now_price}
                                        onChange={(e) => setData('buy_now_price', e.target.value ? parseInt(e.target.value) : '')}
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <span className="text-xs text-slate-500 mt-1 block">
                                    {data.buy_now_price ? formatRupiah(data.buy_now_price) : 'Tanpa opsi beli langsung'}
                                </span>
                                {errors.buy_now_price && <span className="text-xs text-red-500 mt-1 block">{errors.buy_now_price}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Periode & Durasi Sesi Lelang */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-600 font-bold text-sm">4.</span>
                                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                                    Periode & Waktu Pelaksanaan Lelang
                                </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-slate-500">Durasi Cepat:</span>
                                {[
                                    { label: '2 Menit', ms: 2 * 60 * 1000 },
                                    { label: '5 Menit', ms: 5 * 60 * 1000 },
                                    { label: '1 Jam', ms: 60 * 60 * 1000 },
                                    { label: '1 Hari', ms: 24 * 60 * 60 * 1000 },
                                    { label: '3 Hari', ms: 3 * 24 * 60 * 60 * 1000 },
                                    { label: '7 Hari', ms: 7 * 24 * 60 * 60 * 1000 },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => setDurationOffsetMs(preset.ms)}
                                        className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-amber-100 hover:border-amber-300 text-[10px] font-semibold transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Waktu Mulai Lelang <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                                {errors.start_time && <span className="text-xs text-red-500 mt-1 block">{errors.start_time}</span>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Batas Waktu Penutupan (End Time) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    required
                                />
                                {errors.end_time && <span className="text-xs text-red-500 mt-1 block">{errors.end_time}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
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
                                disabled={processing}
                                onClick={() => {
                                    setData('status', 'draft');
                                    setShowConfirmModal(true);
                                }}
                                className="px-5 py-3.5 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all disabled:opacity-60"
                            >
                                📝 Simpan Sebagai Draft
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-8 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="w-4 h-4 text-slate-950" />
                                        <span>Menyimpan & Mengunggah...</span>
                                    </>
                                ) : (
                                    <span>✓ Rilis Item Lelang Sekarang</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Pop-up Konfirmasi Rilis Item Lelang */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div
                        className="fixed inset-0"
                        onClick={() => {
                            if (!processing) setShowConfirmModal(false);
                        }}
                    />
                    <div className="relative bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl z-10 space-y-5">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                                🚀
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-slate-900">
                                    Konfirmasi Rilis Item Lelang
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Periksa kembali nama barang, harga, dan deskripsi sebelum disimpan.
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
                                    {data.status === 'active' ? '🔴 Langsung LIVE' : '📝 Draft'}
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
                                ⚠️ <strong>Perhatian:</strong> Barang yang dirilis dengan status <strong>LIVE</strong> tidak dapat diedit atau dihapus lagi setelah dipublikasikan.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => setShowConfirmModal(false)}
                                className="py-3 px-4 rounded-xl text-xs font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                <span>✏️ Edit / Ubah Data</span>
                            </button>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={executeReleaseSubmit}
                                className="py-3 px-4 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="w-4 h-4 text-white" />
                                        <span>Merilis...</span>
                                    </>
                                ) : (
                                    <span>
                                        {data.status === 'active' ? '🚀 Ya, Rilis LIVE' : '📝 Ya, Simpan Draft'}
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
