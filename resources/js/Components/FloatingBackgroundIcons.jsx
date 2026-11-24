export default function FloatingBackgroundIcons() {
    const icons = [
        {
            id: 'auction-gavel-1',
            type: 'auction',
            top: '7%',
            duration: '22s',
            delay: '-4s',
            bobDuration: '4.2s',
            color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-amber-500/10',
            label: 'LELANG LIVE',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 4l3 3-8 8-3-3 8-8z" fill="currentColor" fillOpacity="0.2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 7l3-3-2-2-3 3M6 18l-3 3 2 2 3-3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-6 6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 21h8" />
                </svg>
            ),
        },
        {
            id: 'money-cash-1',
            type: 'money',
            top: '18%',
            duration: '32s',
            delay: '-18s',
            bobDuration: '5.1s',
            color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/10',
            label: 'IDR RUPIAH',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="6" width="20" height="12" rx="2.5" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
                    <circle cx="12" cy="12" r="3.2" stroke="currentColor" />
                    <path strokeLinecap="round" d="M6 12h.01M18 12h.01" />
                </svg>
            ),
        },
        {
            id: 'delivery-truck-1',
            type: 'delivery',
            top: '30%',
            duration: '18s',
            delay: '-9s',
            bobDuration: '3.6s',
            color: 'text-sky-400 border-sky-500/30 bg-sky-500/10 shadow-sky-500/10',
            label: 'PENGIRIMAN CEPAT',
            svg: (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 5h12v11H1z" fill="currentColor" fillOpacity="0.2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 8h4.5l3.5 4.5V16h-8V8z" fill="currentColor" fillOpacity="0.25" />
                    <circle cx="5.5" cy="17.5" r="2.2" stroke="currentColor" fill="currentColor" fillOpacity="0.4" />
                    <circle cx="16.5" cy="17.5" r="2.2" stroke="currentColor" fill="currentColor" fillOpacity="0.4" />
                    <path strokeLinecap="round" d="M-2 9h2M-4 12h3" />
                </svg>
            ),
        },
        {
            id: 'time-clock-1',
            type: 'time',
            top: '42%',
            duration: '36s',
            delay: '-26s',
            bobDuration: '4.8s',
            color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 shadow-orange-500/10',
            label: 'COUNTDOWN TIMER',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
            ),
        },
        {
            id: 'auction-paddle-2',
            type: 'auction',
            top: '55%',
            duration: '26s',
            delay: '-12s',
            bobDuration: '3.9s',
            color: 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-rose-500/10',
            label: 'BIDDER #88',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="9" r="7" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v6M9 22h6" />
                    <path strokeLinecap="round" d="M10 8h4M10 10.5h4" />
                </svg>
            ),
        },
        {
            id: 'money-coins-2',
            type: 'money',
            top: '67%',
            duration: '30s',
            delay: '-20s',
            bobDuration: '4.5s',
            color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-yellow-500/10',
            label: 'SALDO TERJAMIN',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <ellipse cx="12" cy="6" rx="8" ry="3" fill="currentColor" fillOpacity="0.25" stroke="currentColor" />
                    <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" />
                    <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" stroke="currentColor" />
                    <path d="M9 9.5h6M9 14.5h6" strokeLinecap="round" stroke="currentColor" />
                </svg>
            ),
        },
        {
            id: 'delivery-box-2',
            type: 'delivery',
            top: '78%',
            duration: '21s',
            delay: '-6s',
            bobDuration: '3.7s',
            color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-cyan-500/10',
            label: 'ASURANSI AMAN',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25m-9-14.25L12 12.75m-9-5.25v9l9 5.25m0-9v9"
                        fill="currentColor"
                        fillOpacity="0.2"
                    />
                </svg>
            ),
        },
        {
            id: 'time-stopwatch-2',
            type: 'time',
            top: '89%',
            duration: '40s',
            delay: '-30s',
            bobDuration: '5.4s',
            color: 'text-violet-400 border-violet-500/30 bg-violet-500/10 shadow-violet-500/10',
            label: 'WAKTU PRESISI',
            svg: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="14" r="7.5" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v3.5l2 2M10 2.5h4M12 2.5v3.5M18 7l1.5-1.5" />
                </svg>
            ),
        },
    ];

    return (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            {icons.map((item) => (
                <div
                    key={item.id}
                    className="absolute left-0 animate-float-horizontal pointer-events-none"
                    style={{
                        top: item.top,
                        animationDuration: item.duration,
                        animationDelay: item.delay,
                    }}
                >
                    <div
                        className="animate-gentle-bob"
                        style={{
                            animationDuration: item.bobDuration,
                        }}
                    >
                        <div
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-sm transition-opacity opacity-45 hover:opacity-75 ${item.color}`}
                        >
                            {item.svg}
                            <span className="text-[10px] font-black tracking-widest whitespace-nowrap uppercase drop-shadow-sm">
                                {item.label}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
