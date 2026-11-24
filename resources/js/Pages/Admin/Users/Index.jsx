import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import LiveSyncBadge from '@/Components/LiveSyncBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Pagination from '@/Components/Pagination';
import { useLivePolling, broadcastLiveSync } from '@/Hooks/useLivePolling';

export default function Index({ users, filters }) {
    const [targetUser, setTargetUser] = useState(null);
    const [processingToggle, setProcessingToggle] = useState(false);

    const { manualRefresh, fetchUrl, isNavigatingPage, lastUpdated, polledData } = useLivePolling({
        intervalMs: 1000,
        only: ['users'],
    });

    const liveUsers = polledData?.users || users;

    const handleToggleStatus = (user) => {
        setTargetUser(user);
    };

    const confirmToggleUser = () => {
        if (!targetUser) return;
        setProcessingToggle(true);
        router.post(
            route('admin.users.toggle-status', targetUser.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setTargetUser(null);
                    manualRefresh();
                    broadcastLiveSync('user-status-toggled');
                },
                onFinish: () => {
                    setProcessingToggle(false);
                },
            }
        );
    };

    return (
        <AdminLayout title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna — MyBidder.ID" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">Manajemen Akun Penawar & Administrator</h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Kelola status akses akun peserta lelang dan pantau riwayat partisipasi penawaran
                        </p>
                    </div>

                    <LiveSyncBadge
                        onManualRefresh={manualRefresh}
                        lastUpdated={lastUpdated}
                    />
                </div>

                {/* Filter */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-neutral-200">
                    <input
                        type="text"
                        placeholder="Cari nama, email, atau nomor telepon..."
                        defaultValue={filters.search}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                router.get(
                                    route('admin.users.index'),
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

                    <select
                        defaultValue={filters.role}
                        onChange={(e) =>
                            router.get(
                                route('admin.users.index'),
                                { ...filters, role: e.target.value },
                                { preserveState: true }
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua peran</option>
                        <option value="user">Penawar (User)</option>
                        <option value="admin">Administrator</option>
                    </select>

                    <select
                        defaultValue={filters.status}
                        onChange={(e) =>
                            router.get(
                                route('admin.users.index'),
                                { ...filters, status: e.target.value },
                                { preserveState: true }
                            )
                        }
                        className="h-9 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-900 text-xs"
                    >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="suspended">Dibekukan (Suspended)</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs tabular-nums">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-5 py-3.5">Nama lengkap</th>
                                    <th className="px-5 py-3.5">Kontak</th>
                                    <th className="px-5 py-3.5">Peran</th>
                                    <th className="px-5 py-3.5 text-right">Total bid</th>
                                    <th className="px-5 py-3.5 text-right">Menang</th>
                                    <th className="px-5 py-3.5">Status akun</th>
                                    <th className="px-5 py-3.5 text-right">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {liveUsers.data.map((u) => (
                                    <tr key={u.id} className="hover:bg-neutral-50 transition-colors duration-150">
                                        <td className="px-5 py-3.5 font-medium text-neutral-900">
                                            {u.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-neutral-600">
                                            <p>{u.email}</p>
                                            <p className="text-[11px] font-mono text-neutral-400">{u.phone || '-'}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                                    u.role === 'admin'
                                                        ? 'bg-neutral-900 text-white'
                                                        : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                                }`}
                                            >
                                                {u.role === 'admin' ? 'Admin' : 'Penawar'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono text-neutral-700">
                                            {u.bids_count}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono font-medium text-neutral-900">
                                            {u.won_auctions_count}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {u.status === 'active' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                    Dibekukan
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            {u.role !== 'admin' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(u)}
                                                    className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors duration-150 ${
                                                        u.status === 'active'
                                                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    }`}
                                                >
                                                    {u.status === 'active' ? 'Bekukan akses' : 'Aktifkan kembali'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        paginator={liveUsers}
                        onNavigateUrl={fetchUrl}
                        isLoading={isNavigatingPage}
                    />
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(targetUser)}
                onClose={() => {
                    if (!processingToggle) setTargetUser(null);
                }}
                onConfirm={confirmToggleUser}
                title={targetUser?.status === 'active' ? 'Bekukan akun penawar' : 'Aktifkan kembali akun'}
                message={
                    targetUser?.status === 'active'
                        ? `Apakah Anda yakin ingin membekukan akses akun "${targetUser?.name}"? Pengguna tidak dapat masuk atau mengajukan penawaran.`
                        : `Apakah Anda yakin ingin mengaktifkan kembali akun "${targetUser?.name}"?`
                }
                confirmText={targetUser?.status === 'active' ? 'Ya, bekukan akun' : 'Ya, aktifkan'}
                processingText="Memproses..."
                variant={targetUser?.status === 'active' ? 'danger' : 'success'}
                processing={processingToggle}
            />
        </AdminLayout>
    );
}
