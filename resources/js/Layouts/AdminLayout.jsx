import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ToastNotification from '@/Components/ToastNotification';
import ConfirmModal from '@/Components/ConfirmModal';

export default function AdminLayout({ children, title = 'Panel Admin' }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [activePendingMenu, setActivePendingMenu] = useState(null);

    useEffect(() => {
        setActivePendingMenu(null);
    }, [title]);

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

    const navItems = [
        {
            name: 'Ringkasan',
            href: route('admin.dashboard'),
            active: route().current('admin.dashboard'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Manajemen Lelang',
            href: route('admin.auctions.index'),
            active: route().current('admin.auctions.*'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
        },
        {
            name: 'Manajemen Kategori',
            href: route('admin.categories.index'),
            active: route().current('admin.categories.*'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
        },
        {
            name: 'Verifikasi Penawaran',
            href: route('admin.bids.index'),
            active: route().current('admin.bids.*'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
        {
            name: 'Validasi Pembayaran',
            href: route('admin.payments.index'),
            active: route().current('admin.payments.*'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            name: 'Manajemen Pengguna',
            href: route('admin.users.index'),
            active: route().current('admin.users.*'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Laporan & Rekap',
            href: route('admin.reports.index'),
            active: route().current('admin.reports.*'),
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans antialiased">
            <ToastNotification />

            {/* Desktop Sidebar (256px / w-64, 4px grid rhythm, 36px nav rows) */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200 fixed inset-y-0 left-0 z-30 shrink-0">
                <div className="h-14 flex items-center px-5 border-b border-neutral-200 gap-2.5 shrink-0">
                    <img
                        src="/img/logo.webp"
                        alt="MyBidder.ID"
                        className="w-8 h-8 rounded-lg object-contain shrink-0"
                    />
                    <div className="leading-tight">
                        <span className="font-semibold text-sm text-neutral-900">
                            MyBidder.ID
                        </span>
                        <span className="block text-[11px] text-neutral-500">
                            Administrasi Lelang
                        </span>
                    </div>
                </div>

                <div className="px-5 pt-5 pb-2">
                    <span className="text-xs font-medium text-neutral-400">
                        Navigasi
                    </span>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isItemActive = activePendingMenu
                            ? activePendingMenu === item.name
                            : item.active;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setActivePendingMenu(item.name)}
                                className={`h-9 flex items-center gap-2.5 px-3 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                    isItemActive
                                        ? 'bg-neutral-900 text-white'
                                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                                }`}
                            >
                                <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${isItemActive ? 'text-white' : 'text-neutral-400'}`}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-neutral-200 space-y-2 shrink-0 bg-white">
                    <Link
                        href="/"
                        className="h-9 flex items-center gap-2.5 px-3 text-xs font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-150"
                    >
                        <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Buka Katalog Publik</span>
                    </Link>

                    <div className="pt-2 px-2 border-t border-neutral-100 flex items-center justify-between">
                        <div className="text-xs truncate max-w-[150px]">
                            <p className="font-medium text-neutral-900 truncate">{auth.user.name}</p>
                            <span className="text-[11px] text-neutral-500">Administrator</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(true)}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                            title="Keluar dari akun"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-64 flex flex-col min-w-0 min-h-screen">
                <header className="sticky top-0 z-20 h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-sm font-semibold text-neutral-900">{title}</h1>
                    </div>
                </header>

                {sidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 flex">
                        <div className="fixed inset-0 bg-neutral-950/50" onClick={() => setSidebarOpen(false)} />
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white p-4 border-r border-neutral-200">
                            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/img/logo.webp"
                                        alt="MyBidder.ID"
                                        className="w-7 h-7 rounded-md object-contain shrink-0"
                                    />
                                    <span className="font-semibold text-sm text-neutral-900">
                                        MyBidder.ID
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <nav className="mt-4 space-y-1 flex-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`h-9 flex items-center gap-2.5 px-3 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                            item.active
                                                ? 'bg-neutral-900 text-white'
                                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                                        }`}
                                    >
                                        <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${item.active ? 'text-white' : 'text-neutral-400'}`}>
                                            {item.icon}
                                        </span>
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </nav>
                            <div className="pt-3 border-t border-neutral-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSidebarOpen(false);
                                        setShowLogoutModal(true);
                                    }}
                                    className="w-full h-9 flex items-center gap-2.5 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Keluar dari akun</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.success && (
                    <div className="mx-4 lg:mx-8 mt-4">
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">{flash.success}</p>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="mx-4 lg:mx-8 mt-4">
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                            <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">{flash.error}</p>
                        </div>
                    </div>
                )}

                <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full">
                    {children}
                </main>
            </div>

            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
                title="Keluar dari akun"
                message="Apakah Anda yakin ingin mengakhiri sesi Administrator MyBidder.ID?"
                confirmText="Ya, keluar"
                processingText="Memproses..."
                cancelText="Batal"
                variant="danger"
                processing={loggingOut}
            />
        </div>
    );
}
