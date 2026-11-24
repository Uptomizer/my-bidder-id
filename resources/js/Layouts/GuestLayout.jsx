import { Link } from '@inertiajs/react';
import FloatingBackgroundIcons from '@/Components/FloatingBackgroundIcons';
import ToastNotification from '@/Components/ToastNotification';

export default function GuestLayout({ children, title, subtitle }) {
    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950">
            <ToastNotification />
            {/* Siluet Background Bergambar dengan Efek Sedikit Blur (Fixed tidak bergerak saat scroll) */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=2000&q=85"
                    alt="Auction Hall Silhouette"
                    className="w-full h-full object-cover object-center filter blur-[2.5px] scale-105 brightness-[0.70] contrast-[1.08]"
                />
                {/* Gradient tint overlay untuk kedalaman visual */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/85 backdrop-blur-[1px]" />
                {/* Ambient glow effects */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Animasi SVG Uang, Waktu, Delivery, Auction bergerak halus dari kiri ke kanan */}
                <FloatingBackgroundIcons />
            </div>

            {/* Container Konten di Tengah */}
            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
                {/* Logo & Teks Branding Website di Atas Form */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex flex-col items-center group">
                        <img
                            src="/img/logo.webp"
                            alt="MyBidder.ID"
                            className="w-14 h-14 rounded-2xl object-contain shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300 mb-3"
                        />
                        <span className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
                            MyBidder<span className="text-red-500">.ID</span>
                        </span>
                        <span className="block text-[11px] font-extrabold uppercase tracking-widest text-amber-400 mt-1">
                            Platform Marketplace Lelang Online Live
                        </span>
                    </Link>

                    {title && (
                        <h2 className="text-lg font-bold text-white/95 mt-4">
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Card Form di Tengah */}
                <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 transition-all">
                    {children}
                </div>

                {/* Footer Copyright */}
                <div className="mt-6 text-center">
                    <p className="text-[11px] text-slate-400">
                        &copy; {new Date().getFullYear()} MyBidder.ID &bull; Jaminan Keamanan Penawaran 100%
                    </p>
                </div>
            </div>
        </div>
    );
}
