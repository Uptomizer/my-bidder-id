import { useId } from 'react';

export default function Spinner({ className = 'w-4 h-4', gradient = false }) {
    const gradientId = useId();

    return (
        <svg
            className={`animate-spin shrink-0 ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            {gradient && (
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#171717" />
                        <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                </defs>
            )}
            <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="9.5"
                stroke="currentColor"
                strokeWidth="2.25"
            />
            <path
                stroke={gradient ? `url(#${gradientId})` : 'currentColor'}
                strokeWidth="2.25"
                strokeLinecap="round"
                d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5"
            />
        </svg>
    );
}
