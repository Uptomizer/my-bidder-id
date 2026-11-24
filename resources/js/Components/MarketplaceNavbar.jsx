import { Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import ConfirmModal from '@/Components/ConfirmModal';

export default function MarketplaceNavbar({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    onSearchSubmit,
}) {
    const { auth, global_categories } = usePage().props;
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [localSearch, setLocalSearch] = useState('');
    const [localCategory, setLocalCategory] = useState('all');
    const [unreadCount, setUnreadCount] = useState(auth?.unread_notifications || 0);
    const [recentNotifications, setRecentNotifications] = useState(
        Array.isArray(auth?.recent_notifications) ? auth.recent_notifications.slice(0, 5) : []
    );
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const categoryRef = useRef(null);
    const mobileCategoryRef = useRef(null);

    const handleConfirmLogout = () => {
        setLoggingOut(true);
        router.post(
            route('logout'),
            {},
            {
                onFinish: () => {
                    setLoggingOut(false);
                    setShowLogoutModal(false);
                },
            }
        );
    };

    const categoriesList = useMemo(() => {
        const base = [{ id: 'all', name: 'Semua kategori' }];
        if (Array.isArray(global_categories)) {
            global_categories.forEach((cat) => {
                base.push({
                    id: cat.slug || String(cat.id),
                    name: cat.name,
                });
            });
        }
        return base;
    }, [global_categories]);

    useEffect(() => {
        if (!auth?.user) return;
        setUnreadCount(auth.unread_notifications || 0);
        if (Array.isArray(auth?.recent_notifications)) {
            setRecentNotifications(auth.recent_notifications.slice(0, 5));
        }

        const pollUnread = async () => {
            if (document.hidden) return;
            try {
                const res = await axios.get(route('notifications.unread-count'));
                if (typeof res?.data?.unread_count === 'number') {
                    setUnreadCount(res.data.unread_count);
                }
                if (Array.isArray(res?.data?.recent_notifications)) {
                    setRecentNotifications(res.data.recent_notifications.slice(0, 5));
                }
            } catch {
                // Ignore
            }
        };

        const interval = setInterval(pollUnread, 1000);
        return () => clearInterval(interval);
    }, [auth?.user, auth?.unread_notifications, auth?.recent_notifications]);

    const handleNotificationItemClick = async (item) => {
        setNotifDropdownOpen(false);
        if (!item.is_read) {
            setRecentNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            try {
                await axios.post(
                    route('notifications.read', item.id),
                    {},
                    { headers: { Accept: 'application/json' } }
                );
            } catch {
                // Ignore
            }
        }
        if (item.url) {
            router.visit(item.url);
        } else {
            router.visit(route('notifications.index'));
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        try {
            await axios.post(
                route('notifications.read-all'),
                {},
                { headers: { Accept: 'application/json' } }
            );
        } catch {
            // Ignore
        }
    };

    const effectiveSearch = searchQuery !== undefined ? searchQuery : localSearch;
    const effectiveCategory = selectedCategory !== undefined ? selectedCategory : localCategory;

    const activeCategoryObj =
        categoriesList.find((c) => c.id === effectiveCategory) || categoriesList[0];

    const handleSearchChange = (val) => {
        if (onSearchChange) {
            onSearchChange(val);
        } else {
            setLocalSearch(val);
        }
    };

    const handleCategorySelect = (catId) => {
        if (onCategoryChange) {
            onCategoryChange(catId);
        } else {
            setLocalCategory(catId);
            const params = {};
            if (catId && catId !== 'all') params.category = catId;
            if (effectiveSearch.trim()) params.search = effectiveSearch.trim();
            router.get(route('auctions.index'), params, { preserveState: true });
        }
        setCategoryDropdownOpen(false);
    };

    const handleSearchFormSubmit = () => {
        if (onSearchSubmit) {
            onSearchSubmit();
        } else {
            const params = {};
            if (effectiveSearch.trim()) params.search = effectiveSearch.trim();
            if (effectiveCategory && effectiveCategory !== 'all') params.category = effectiveCategory;
            router.get(route('auctions.index'), params, { preserveState: true });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifDropdownOpen(false);
            }
            const clickedInsideDesktopCat = categoryRef.current && categoryRef.current.contains(e.target);
            const clickedInsideMobileCat = mobileCategoryRef.current && mobileCategoryRef.current.contains(e.target);
            if (!clickedInsideDesktopCat && !clickedInsideMobileCat) {
                setCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderSearchAndCategory = (isMobile = false) => (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSearchFormSubmit();
            }}
            className={
                isMobile
                    ? 'flex md:hidden w-full items-center gap-2 mt-2'
                    : 'hidden md:flex flex-1 max-w-xl items-center gap-2 mx-4'
            }
        >
            <div className="relative shrink-0" ref={isMobile ? mobileCategoryRef : categoryRef}>
                <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="h-9 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200 text-neutral-700 text-xs font-medium flex items-center gap-2 transition-colors duration-150 whitespace-nowrap"
                >
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                    <span className="hidden sm:inline max-w-[130px] truncate">{activeCategoryObj.name}</span>
                    <span className="sm:hidden">Kategori</span>
                    <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-150 ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {categoryDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50">
                        <div className="px-3.5 py-1.5 text-xs font-medium text-neutral-400">
                            Kategori lelang
                        </div>
                        {categoriesList.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategorySelect(cat.id)}
                                className={`w-full h-8 text-left px-3.5 text-xs font-medium flex items-center justify-between transition-colors duration-150 ${
                                    effectiveCategory === cat.id
                                        ? 'bg-neutral-100 text-neutral-900 font-semibold'
                                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                }`}
                            >
                                <span>{cat.name}</span>
                                {effectiveCategory === cat.id && (
                                    <svg className="w-3.5 h-3.5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative flex-1 flex items-center">
                <input
                    type="text"
                    value={effectiveSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Cari barang lelang..."
                    className="w-full h-9 pl-3.5 pr-10 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors duration-150"
                />
                <button
                    type="submit"
                    aria-label="Cari"
                    className="absolute right-1 h-7 px-2.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors duration-150"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>
        </form>
    );

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <img
                            src="/img/logo.webp"
                            alt="MyBidder.ID"
                            className="w-8 h-8 rounded-lg object-contain shrink-0"
                        />
                        <span className="text-base font-semibold text-neutral-900">
                            MyBidder.ID
                        </span>
                    </Link>

                    <Link
                        href={route('auctions.index')}
                        className="hidden lg:inline-flex text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-150"
                    >
                        Katalog Lelang
                    </Link>
                </div>

                {renderSearchAndCategory(false)}

                <div className="flex items-center gap-2 shrink-0">
                    {auth?.user ? (
                        <div className="flex items-center gap-2">
                            {/* Notification Pop-up (5 Notifikasi Terbaru + Show More) */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotifDropdownOpen(!notifDropdownOpen);
                                        setProfileDropdownOpen(false);
                                    }}
                                    className={`relative h-9 w-9 rounded-lg flex items-center justify-center border transition-colors duration-150 ${
                                        notifDropdownOpen
                                            ? 'bg-neutral-900 text-white border-neutral-900'
                                            : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                                    }`}
                                    title="Notifikasi"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-mono font-medium text-white tabular-nums">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden z-50">
                                        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-neutral-900">
                                                    Notifikasi terbaru
                                                </span>
                                                {unreadCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-800 text-[11px] font-mono tabular-nums">
                                                        {unreadCount} baru
                                                    </span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleMarkAllNotificationsRead}
                                                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-150"
                                                >
                                                    Tandai dibaca
                                                </button>
                                            )}
                                        </div>

                                        <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                                            {recentNotifications.slice(0, 5).length > 0 ? (
                                                recentNotifications.slice(0, 5).map((item) => {
                                                    const isRejected =
                                                        item.type === 'payment_rejected' ||
                                                        item.type === 'bid_disqualified';
                                                    const isVerified =
                                                        item.type === 'payment_verified' ||
                                                        item.type === 'auction_won';

                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => handleNotificationItemClick(item)}
                                                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-150 ${
                                                                !item.is_read
                                                                    ? 'bg-amber-50/40 hover:bg-neutral-50'
                                                                    : 'hover:bg-neutral-50'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                                                                    isRejected
                                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                                        : isVerified
                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                                }`}
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                                    {isRejected ? (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    ) : isVerified ? (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                                    ) : (
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                                                    )}
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p
                                                                        className={`text-xs truncate ${
                                                                            !item.is_read
                                                                                ? 'font-semibold text-neutral-900'
                                                                                : 'font-medium text-neutral-700'
                                                                        }`}
                                                                    >
                                                                        {item.title}
                                                                    </p>
                                                                    <span className="text-[11px] font-mono text-neutral-400 shrink-0 tabular-nums">
                                                                        {new Date(item.created_at).toLocaleDateString(
                                                                            'id-ID',
                                                                            {
                                                                                day: 'numeric',
                                                                                month: 'short',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                            }
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                                    {item.message}
                                                                </p>
                                                            </div>
                                                            {!item.is_read && (
                                                                <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-4 py-8 text-center">
                                                    <p className="text-xs font-medium text-neutral-700">
                                                        Belum ada notifikasi
                                                    </p>
                                                    <p className="text-xs text-neutral-500 mt-0.5">
                                                        Pemberitahuan aktivitas lelang Anda akan tampil di sini
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2.5 bg-neutral-50 border-t border-neutral-200">
                                            <Link
                                                href={route('notifications.index')}
                                                onClick={() => setNotifDropdownOpen(false)}
                                                className="w-full h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors duration-150"
                                            >
                                                <span>Show More Notifikasi (Lihat Semua)</span>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfileDropdownOpen(!profileDropdownOpen);
                                        setNotifDropdownOpen(false);
                                    }}
                                    className="h-9 flex items-center gap-2 pl-2 pr-2.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 transition-colors duration-150"
                                >
                                    <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center text-white font-medium text-xs">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:block text-xs font-medium text-neutral-800 max-w-[110px] truncate">
                                        {auth.user.name}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {profileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50">
                                        <div className="px-3.5 py-2 border-b border-neutral-100">
                                            <p className="text-xs font-semibold text-neutral-900 truncate">{auth.user.name}</p>
                                            <p className="text-[11px] text-neutral-500 truncate">{auth.user.email}</p>
                                        </div>
                                        {auth.user.is_admin ? (
                                            <div className="py-1">
                                                <Link
                                                    href={route('admin.dashboard')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                                    </svg>
                                                    <span>Panel Admin</span>
                                                </Link>
                                                <Link
                                                    href={route('admin.auctions.index')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    <span>Manajemen Lelang</span>
                                                </Link>
                                                <Link
                                                    href={route('admin.categories.index')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    <span>Manajemen Kategori</span>
                                                </Link>
                                                <Link
                                                    href={route('profile.edit')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                    </svg>
                                                    <span>Profil Admin</span>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="py-1">
                                                <Link
                                                    href={route('profile.edit')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                    </svg>
                                                    <span>Profil Saya</span>
                                                </Link>
                                                <Link
                                                    href={route('user.bids')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                                    </svg>
                                                    <span>Tawaran Saya</span>
                                                </Link>
                                                <Link
                                                    href={route('user.wins')}
                                                    className="h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                                >
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Kemenangan & Bayar</span>
                                                </Link>
                                            </div>
                                        )}
                                        <div className="border-t border-neutral-100 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProfileDropdownOpen(false);
                                                    setShowLogoutModal(true);
                                                }}
                                                className="w-full h-8 px-3.5 flex items-center gap-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>Keluar</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('login')}
                                className="h-9 px-3 rounded-lg text-neutral-600 hover:text-neutral-900 text-xs font-medium flex items-center transition-colors duration-150"
                            >
                                Masuk
                            </Link>
                            <Link
                                href={route('register')}
                                className="h-9 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium flex items-center transition-colors duration-150"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-2.5 md:hidden">
                {renderSearchAndCategory(true)}
            </div>

            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
                title="Keluar dari akun"
                message="Apakah Anda yakin ingin mengakhiri sesi akun MyBidder.ID Anda saat ini?"
                confirmText="Ya, keluar"
                processingText="Memproses..."
                cancelText="Batal"
                variant="danger"
                processing={loggingOut}
            />
        </header>
    );
}
