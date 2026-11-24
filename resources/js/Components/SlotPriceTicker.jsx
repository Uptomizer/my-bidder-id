import { useEffect, useRef, useState } from 'react';
import { formatRupiah } from '@/Utils/format';

function formatCompactDelta(delta) {
    if (!delta || delta <= 0) return '';
    if (delta >= 1000000) {
        const jt = delta / 1000000;
        return `+Rp${Number.isInteger(jt) ? jt : jt.toFixed(1)}jt`;
    }
    if (delta >= 1000) {
        return `+Rp${Math.round(delta / 1000)}rb`;
    }
    return `+Rp${delta}`;
}

export default function SlotPriceTicker({ value, delta = 0 }) {
    const prevValueRef = useRef(value);
    const [animState, setAnimState] = useState({
        current: value,
        previous: value,
        rollKey: 0,
        isRolling: false,
        lastDelta: 0,
    });

    useEffect(() => {
        if (value > prevValueRef.current) {
            const diff = delta > 0 ? delta : value - prevValueRef.current;
            const prev = prevValueRef.current;
            prevValueRef.current = value;

            setAnimState((s) => ({
                current: value,
                previous: prev,
                rollKey: s.rollKey + 1,
                isRolling: true,
                lastDelta: diff,
            }));

            const timer = setTimeout(() => {
                setAnimState((s) => ({
                    ...s,
                    isRolling: false,
                }));
            }, 950);

            return () => clearTimeout(timer);
        } else if (value !== prevValueRef.current) {
            prevValueRef.current = value;
            setAnimState((s) => ({
                ...s,
                current: value,
                previous: value,
                isRolling: false,
            }));
        }
    }, [value, delta]);

    const currentStr = formatRupiah(animState.current);
    const prevStr = formatRupiah(animState.previous);

    return (
        <div className="relative flex items-center justify-between tabular-nums">
            <div className="relative h-6 overflow-hidden flex items-center">
                {animState.isRolling ? (
                    <div key={animState.rollKey} className="relative h-6 w-full flex items-center">
                        <span className="absolute left-0 top-0 h-6 flex items-center font-semibold text-sm text-emerald-700 whitespace-nowrap animate-slot-exit">
                            {prevStr}
                        </span>
                        <span className="h-6 flex items-center font-semibold text-sm text-emerald-700 whitespace-nowrap animate-slot-enter">
                            {currentStr}
                        </span>
                    </div>
                ) : (
                    <span className="h-6 flex items-center font-semibold text-sm text-neutral-900 whitespace-nowrap transition-colors duration-200">
                        {currentStr}
                    </span>
                )}
            </div>

            {animState.isRolling && animState.lastDelta > 0 && (
                <span
                    key={`delta-${animState.rollKey}`}
                    className="absolute -top-4 right-0 px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono font-medium pointer-events-none z-20"
                >
                    +{formatCompactDelta(animState.lastDelta).replace('+', '')}
                </span>
            )}
        </div>
    );
}
