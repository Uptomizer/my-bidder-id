import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Pagination from '@/Components/Pagination';
import Spinner from '@/Components/Spinner';
import { showToast } from '@/Components/ToastNotification';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';

const ICON_MAP = {
    gem: '💎',
    laptop: '💻',
    tag: '🏷️',
    car: '🚗',
    palette: '🎨',
    camera: '📷',
    phone: '📱',
    watch: '⌚',
    guitar: '🎸',
    music: '🎸',
    game: '🎮',
    book: '📚',
    shoe: '👟',
    sneaker: '👟',
    fashion: '👔',
    art: '🎨',
    antique: '🏺',
    coin: '🪙',
};

const QUICK_EMOJIS = ['🏷️', '💻', '💎', '⌚', '👟', '🚗', '🎨', '📷', '📱', '🎸', '🎮', '📚'];

function getCategoryEmoji(icon) {
    if (!icon) return '🏷️';
    const clean = String(icon).trim().toLowerCase();
    if (ICON_MAP[clean]) {
        return ICON_MAP[clean];
    }
    return icon;
}

export default function Index({ categories = [] }) {
    const { manualRefresh, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['categories'],
    });

    const liveCategories = polledData?.categories || categories;

    const [searchFilter, setSearchFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingId, setDeletingId] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        icon: '🏷️',
        description: '',
    });

    const handleCreateCategory = (e) => {
        e.preventDefault();
        post(route('admin.categories.store'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                reset();
                manualRefresh();
                broadcastLiveSync('category-created');
            },
        });
    };

    const handleDeleteCategory = (cat) => {
        if (cat.auctions_count > 0) {
            showToast({
                type: 'warning',
                title: 'Kategori sedang digunakan',
                message: `Kategori "${cat.name}" tidak dapat dihapus karena masih digunakan oleh ${cat.auctions_count} barang lelang.`,
            });
            return;
        }
        setCategoryToDelete(cat);
    };

    const confirmDeleteCategory = () => {
        if (!categoryToDelete) return;
        const cat = categoryToDelete;
        setDeletingId(cat.id);
        router.delete(route('admin.categories.destroy', cat.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDeletingId(null);
                setCategoryToDelete(null);
                manualRefresh();
                broadcastLiveSync('category-deleted');
            },
            onError: () => {
                setDeletingId(null);
            },
            onFinish: () => {
                setDeletingId(null);
            },
        });
    };

    const filteredCategories = liveCategories.filter((cat) => {
        const q = searchFilter.toLowerCase().trim();
        if (!q) return true;
        return (
            cat.name.toLowerCase().includes(q) ||
            cat.slug.toLowerCase().includes(q) ||
            (cat.description && cat.description.toLowerCase().includes(q))
        );
    });

    const perPage = 6;
    const totalPages = Math.max(1, Math.ceil(filteredCategories.length / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedCategories = filteredCategories.slice(
        (safePage - 1) * perPage,
        safePage * perPage
    );

    return (
        <AdminLayout title="Manajemen Kategori">
            <Head title="Manajemen Kategori Lelang — MyBidder.ID" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">
                            Manajemen Kategori Lelang
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Kelola kategori barang lelang resmi untuk katalog publik dan formulir publikasi
                        </p>
                    </div>

                    <LiveSyncBadge
                        onManualRefresh={manualRefresh}
                        lastUpdated={lastUpdated}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Form Tambah Kategori (4 Cols) */}
                    <div className="lg:col-span-4 bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                        <div className="border-b border-neutral-100 pb-3">
                            <h3 className="font-semibold text-sm text-neutral-900">
                                Tambah Kategori Baru
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                Muncul otomatis di katalog & navigasi
                            </p>
                        </div>

                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Nama kategori <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Contoh: Kamera Analog & Lensa"
                                    className={`w-full h-9 px-3 rounded-lg border text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors duration-150 ${
                                        errors.name ? 'border-red-400 bg-red-50/30' : 'border-neutral-200 bg-white'
                                    }`}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Simbol kategori
                                </label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-base shrink-0">
                                            {getCategoryEmoji(data.icon)}
                                        </div>
                                        <input
                                            type="text"
                                            value={data.icon}
                                            onChange={(e) => setData('icon', e.target.value)}
                                            placeholder="Simbol..."
                                            className="flex-1 h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                        />
                                    </div>

                                    <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200 flex flex-wrap gap-1.5">
                                        {QUICK_EMOJIS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setData('icon', emoji)}
                                                className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-colors duration-150 ${
                                                    data.icon === emoji
                                                        ? 'bg-neutral-900 text-white'
                                                        : 'bg-white hover:bg-neutral-200/70 border border-neutral-200'
                                                }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {errors.icon && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.icon}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                                    Deskripsi singkat (Opsional)
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows="2"
                                    placeholder="Penjelasan singkat mengenai kategori ini"
                                    className="w-full p-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 resize-none"
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="w-3.5 h-3.5 text-white" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>+ Simpan kategori</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Table Daftar Kategori (8 Cols) */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-neutral-200 overflow-hidden">
                        <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                                <h3 className="font-semibold text-xs text-neutral-900">
                                    Daftar Kategori
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-mono tabular-nums">
                                    {liveCategories.length} kategori
                                </span>
                            </div>

                            <div className="relative w-40 sm:w-48 shrink-0">
                                <input
                                    type="text"
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    placeholder="Cari kategori..."
                                    className="w-full h-8 pl-8 pr-6 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                                />
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                {searchFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchFilter('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                                        title="Hapus pencarian"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs tabular-nums">
                                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                                    <tr>
                                        <th className="py-3 px-4">Kategori</th>
                                        <th className="py-3 px-4">Slug URL</th>
                                        <th className="py-3 px-4 text-right">Total barang</th>
                                        <th className="py-3 px-4 text-right">Tindakan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginatedCategories.length > 0 ? (
                                        paginatedCategories.map((cat) => {
                                            const hasAuctions = cat.auctions_count > 0;
                                            const isDeleting = deletingId === cat.id;

                                            return (
                                                <tr
                                                    key={cat.id}
                                                    className="hover:bg-neutral-50 transition-colors duration-150"
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm shrink-0">
                                                                {getCategoryEmoji(cat.icon)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-medium text-neutral-900">
                                                                    {cat.name}
                                                                </h4>
                                                                {cat.description && (
                                                                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 max-w-xs">
                                                                        {cat.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-4 font-mono text-xs text-neutral-600">
                                                        {cat.slug}
                                                    </td>

                                                    <td className="py-3 px-4 text-right font-mono text-neutral-700">
                                                        {cat.auctions_count} lot
                                                    </td>

                                                    <td className="py-3 px-4 text-right">
                                                        {hasAuctions ? (
                                                            <span
                                                                className="inline-flex items-center h-8 px-2.5 rounded-lg text-xs font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 cursor-not-allowed"
                                                                title={`Digunakan oleh ${cat.auctions_count} lot`}
                                                            >
                                                                Digunakan
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteCategory(cat)}
                                                                disabled={isDeleting}
                                                                className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors duration-150 disabled:opacity-50"
                                                            >
                                                                {isDeleting && (
                                                                    <Spinner className="w-3.5 h-3.5 text-current" />
                                                                )}
                                                                <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="py-10 text-center text-neutral-400 text-xs"
                                            >
                                                Tidak ada kategori yang sesuai dengan pencarian
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={safePage}
                            totalItems={filteredCategories.length}
                            perPage={perPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(categoryToDelete)}
                onClose={() => {
                    if (!deletingId) setCategoryToDelete(null);
                }}
                onConfirm={confirmDeleteCategory}
                title="Hapus kategori"
                message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}" secara permanen?`}
                confirmText="Ya, hapus kategori"
                processingText="Menghapus..."
                variant="danger"
                processing={Boolean(deletingId)}
            />
        </AdminLayout>
    );
}
