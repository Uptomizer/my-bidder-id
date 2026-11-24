import Skeleton from './Skeleton';

export default function AuthSkeleton({ path = '/login' }) {
    const isRegister = (path || '').toLowerCase().includes('/register');

    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950">
            {/* Ambient Glow Matching GuestLayout */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Container Konten di Tengah */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                {/* Logo & Teks Branding Website di Atas Form */}
                <div className="text-center mb-6 flex flex-col items-center">
                    <Skeleton className="w-14 h-14 rounded-2xl mb-3" variant="dark" />
                    <Skeleton className="w-44 h-8 rounded-lg" variant="dark" />
                    <Skeleton className="w-56 h-3 rounded-sm mt-2" variant="dark" />
                    <Skeleton className="w-48 h-5 rounded-md mt-4" variant="dark" />
                    <Skeleton className="w-64 h-3.5 rounded-sm mt-1.5" variant="dark" />
                </div>

                {/* Card Form di Tengah */}
                <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 space-y-4">
                    {isRegister ? (
                        <>
                            <div className="space-y-1.5">
                                <Skeleton className="w-28 h-3.5 rounded-md" variant="subtle" />
                                <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="w-28 h-3.5 rounded-md" variant="subtle" />
                                <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="w-36 h-3.5 rounded-md" variant="subtle" />
                                <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Skeleton className="w-24 h-3.5 rounded-md" variant="subtle" />
                                    <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                                </div>
                                <div className="space-y-1.5">
                                    <Skeleton className="w-28 h-3.5 rounded-md" variant="subtle" />
                                    <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                                </div>
                            </div>
                            <Skeleton className="w-full h-12 rounded-xl mt-2" />
                        </>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <Skeleton className="w-28 h-3.5 rounded-md" variant="subtle" />
                                <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="w-32 h-3.5 rounded-md" variant="subtle" />
                                    <Skeleton className="w-20 h-3 rounded-sm" variant="subtle" />
                                </div>
                                <Skeleton className="w-full h-10 rounded-xl" variant="subtle" />
                            </div>
                            <div className="pt-1">
                                <Skeleton className="w-44 h-4 rounded-md" variant="subtle" />
                            </div>
                            <Skeleton className="w-full h-12 rounded-xl mt-2" />
                            <div className="pt-3 border-t border-slate-100 flex justify-center">
                                <Skeleton className="w-56 h-4 rounded-md" variant="subtle" />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Copyright */}
                <div className="mt-6">
                    <Skeleton className="w-64 h-3 rounded-sm" variant="dark" />
                </div>
            </div>
        </div>
    );
}
