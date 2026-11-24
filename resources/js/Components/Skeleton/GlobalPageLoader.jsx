import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Spinner from '@/Components/Spinner';

function extractPathname(urlInput) {
    if (!urlInput) {
        return typeof window !== 'undefined' ? window.location.pathname : '/';
    }
    if (typeof urlInput === 'object' && urlInput.pathname) {
        return urlInput.pathname;
    }
    if (typeof urlInput === 'string') {
        try {
            if (urlInput.startsWith('http://') || urlInput.startsWith('https://')) {
                return new URL(urlInput).pathname;
            }
            return urlInput.split('?')[0].split('#')[0];
        } catch {
            return urlInput.split('?')[0].split('#')[0];
        }
    }
    return '/';
}

export default function GlobalPageLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [targetPath, setTargetPath] = useState(() =>
        typeof window !== 'undefined' ? window.location.pathname : '/'
    );

    const showTimerRef = useRef(null);
    const exitTimerRef = useRef(null);

    useEffect(() => {
        const clearTimers = () => {
            if (showTimerRef.current) {
                clearTimeout(showTimerRef.current);
                showTimerRef.current = null;
            }
            if (exitTimerRef.current) {
                clearTimeout(exitTimerRef.current);
                exitTimerRef.current = null;
            }
        };

        const unbindStart = router.on('start', (event) => {
            const visit = event?.detail?.visit;

            // Skip background polling or partial reloads
            if (visit?.only && Array.isArray(visit.only) && visit.only.length > 0) {
                return;
            }

            // Skip non-GET form submissions
            if (visit?.method && visit.method.toLowerCase() !== 'get') {
                return;
            }

            clearTimers();
            const path = extractPathname(visit?.url);
            setTargetPath(path);

            showTimerRef.current = setTimeout(() => {
                setIsLoading(true);
                setIsExiting(false);
            }, 70);
        });

        const handleFinish = () => {
            if (showTimerRef.current) {
                clearTimeout(showTimerRef.current);
                showTimerRef.current = null;
            }

            setIsExiting(true);
            exitTimerRef.current = setTimeout(() => {
                setIsLoading(false);
                setIsExiting(false);
            }, 80);
        };

        const unbindFinish = router.on('finish', handleFinish);

        const unbindError = router.on('error', () => {
            clearTimers();
            setIsLoading(false);
            setIsExiting(false);
        });

        const unbindCancel = router.on('cancel', () => {
            clearTimers();
            setIsLoading(false);
            setIsExiting(false);
        });

        return () => {
            unbindStart();
            unbindFinish();
            unbindError();
            unbindCancel();
            clearTimers();
        };
    }, []);

    if (!isLoading) {
        return null;
    }

    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/';
    const path = (targetPath || '/').toLowerCase();
    const isInternalAdminNav = currentPath.startsWith('/admin') && path.startsWith('/admin');

    const renderMinimalLoader = () => (
        <div className="flex items-center justify-center p-2.5 rounded-full bg-white/90 border border-neutral-200/80 shadow-xs">
            <Spinner className="w-5 h-5 text-neutral-900" gradient={true} />
        </div>
    );

    if (isInternalAdminNav) {
        return (
            <div
                className={`fixed top-14 left-0 lg:left-64 right-0 bottom-0 z-10 flex items-center justify-center bg-[#fafafa]/60 pointer-events-auto transition-opacity duration-100 ease-out ${
                    isExiting ? 'opacity-0' : 'opacity-100'
                }`}
                aria-busy="true"
                aria-live="polite"
            >
                {renderMinimalLoader()}
            </div>
        );
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[#fafafa]/60 pointer-events-auto transition-opacity duration-100 ease-out ${
                isExiting ? 'opacity-0' : 'opacity-100'
            }`}
            aria-busy="true"
            aria-live="polite"
        >
            {renderMinimalLoader()}
        </div>
    );
}
