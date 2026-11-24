import { usePage } from '@inertiajs/react';
import { useEffect, useState, useCallback, useRef } from 'react';

export function showToast({ type = 'success', title = '', message = '', duration = 4500 }) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(
            new CustomEvent('app-toast', {
                detail: {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    type,
                    title,
                    message,
                    duration,
                },
            })
        );
    }
}

export default function ToastNotification() {
    const { flash } = usePage().props;
    const [toasts, setToasts] = useState([]);
    const lastFlashRef = useRef({ success: null, error: null, info: null });

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (toast) => {
            const id = toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const duration = toast.duration || 4500;
            const newToast = { ...toast, id, duration };

            setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

            setTimeout(() => {
                removeToast(id);
            }, duration);
        },
        [removeToast]
    );

    useEffect(() => {
        if (flash?.success && flash.success !== lastFlashRef.current.success) {
            lastFlashRef.current.success = flash.success;
            addToast({
                type: 'success',
                title: 'Berhasil',
                message: flash.success,
            });
        } else if (!flash?.success) {
            lastFlashRef.current.success = null;
        }

        if (flash?.error && flash.error !== lastFlashRef.current.error) {
            lastFlashRef.current.error = flash.error;
            addToast({
                type: 'error',
                title: 'Perhatian',
                message: flash.error,
            });
        } else if (!flash?.error) {
            lastFlashRef.current.error = null;
        }

        if (flash?.info && flash.info !== lastFlashRef.current.info) {
            lastFlashRef.current.info = flash.info;
            addToast({
                type: 'info',
                title: 'Informasi',
                message: flash.info,
            });
        } else if (!flash?.info) {
            lastFlashRef.current.info = null;
        }
    }, [flash?.success, flash?.error, flash?.info, addToast]);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail) {
                addToast(e.detail);
            }
        };
        window.addEventListener('app-toast', handler);
        return () => window.removeEventListener('app-toast', handler);
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
            {toasts.map((toast) => {
                const isSuccess = toast.type === 'success';
                const isError = toast.type === 'error';
                const isWarning = toast.type === 'warning';

                const iconStyles = isSuccess
                    ? 'text-emerald-600'
                    : isError
                    ? 'text-red-600'
                    : isWarning
                    ? 'text-amber-600'
                    : 'text-neutral-600';

                return (
                    <div
                        key={toast.id}
                        className="pointer-events-auto bg-white rounded-xl border border-neutral-200 p-4 shadow-md transition-opacity duration-150"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 shrink-0 ${iconStyles}`}>
                                {isSuccess && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isError && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {isWarning && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {!isSuccess && !isError && !isWarning && (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 pr-2">
                                {toast.title && (
                                    <p className="text-xs font-semibold text-neutral-900 leading-tight">
                                        {toast.title}
                                    </p>
                                )}
                                <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                                    {toast.message}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors duration-150 shrink-0"
                                aria-label="Tutup notifikasi"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
