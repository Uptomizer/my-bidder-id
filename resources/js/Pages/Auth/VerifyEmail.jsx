import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout
            title="Verifikasi Email Anda"
            subtitle="Terima kasih telah mendaftar di MyBidder.ID! Mohon verifikasi alamat email Anda melalui tautan yang baru saja kami kirimkan."
        >
            <Head title="Verifikasi Email - MyBidder.ID" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda daftarkan.
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                    {processing ? 'Mengirim Ulang...' : 'Kirim Ulang Email Verifikasi'}
                </button>

                <div className="pt-2 text-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                    >
                        Keluar Akun
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
