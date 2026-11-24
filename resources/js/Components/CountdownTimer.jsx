import { useEffect, useState } from 'react';
import { getTimeRemaining, syncAuctionEnded } from '@/Utils/format';

export default function CountdownTimer({ endTime, onEnd, size = 'md' }) {
    const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(endTime));

    useEffect(() => {
        if (timeLeft.isEnded) {
            syncAuctionEnded();
            if (onEnd) onEnd();
            return;
        }

        const interval = setInterval(() => {
            const remaining = getTimeRemaining(endTime);
            setTimeLeft(remaining);

            if (remaining.isEnded) {
                clearInterval(interval);
                syncAuctionEnded();
                if (onEnd) onEnd();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [endTime, onEnd]);

    if (timeLeft.isEnded) {
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono tabular-nums">
                00:00:00 • Selesai
            </span>
        );
    }

    if (size === 'lg') {
        return (
            <div className="grid grid-cols-4 gap-2 text-center tabular-nums">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <span className="block text-2xl font-semibold font-mono text-neutral-900">
                        {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">
                        Hari
                    </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <span className="block text-2xl font-semibold font-mono text-neutral-900">
                        {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">
                        Jam
                    </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <span className="block text-2xl font-semibold font-mono text-neutral-900">
                        {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">
                        Menit
                    </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                    <span className="block text-2xl font-semibold font-mono text-red-600">
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">
                        Detik
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium tabular-nums bg-neutral-900/90 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span>
                {timeLeft.days > 0 && `${timeLeft.days}h `}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    );
}
