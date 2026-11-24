import UserLayout from '@/Layouts/UserLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const isAdmin = Boolean(auth?.user?.is_admin);

    return (
        <UserLayout>
            <Head title="Profil & Pengaturan Akun - MyBidder.ID" />

            <div className="space-y-6 max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-amber-500/20">
                            👤
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {isAdmin
                                    ? 'Pengaturan Akun & Profil Administrator'
                                    : 'Pengaturan Akun & Profil Penawar'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                {isAdmin
                                    ? 'Kelola informasi identitas dan kata sandi keamanan akun Administrator MyBidder.ID.'
                                    : 'Kelola informasi akun, kata sandi keamanan, dan preferensi akun MyBidder.ID Anda.'}
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <Link
                            href={route('admin.dashboard')}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 self-start sm:self-auto"
                        >
                            ← Kembali ke Panel Admin
                        </Link>
                    )}
                </div>

                {/* Edit Profile Form */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                {/* Update Password Form */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                {/* Delete Account Danger Zone - Hanya untuk User biasa, Admin tidak dapat menghapus profil */}
                {!isAdmin && (
                    <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
