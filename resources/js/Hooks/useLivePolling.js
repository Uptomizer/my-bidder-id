import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const SYNC_CHANNEL_NAME = 'mybidder_live_sync_channel';

/**
 * Broadcast an instant sync signal across all open browser tabs/windows.
 */
export function broadcastLiveSync(reason = 'update') {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    try {
        const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.postMessage({ type: 'SYNC_NOW', reason, timestamp: Date.now() });
        bc.close();
    } catch {
        // Ignore if BroadcastChannel is unsupported
    }
}

/**
 * Silent background AJAX JSON polling hook (Always LIVE, 1-second interval + Reload support).
 * Fetches updated data via XHR every 1 second without triggering Inertia page reloads or refreshing the page.
 */
export function useLivePolling({
    intervalMs = 1000,
    only = null,
    onData = null,
} = {}) {
    const [lastUpdated, setLastUpdated] = useState(() => new Date());
    const [polledData, setPolledData] = useState(null);
    const [isNavigatingPage, setIsNavigatingPage] = useState(false);
    const isFetchingRef = useRef(false);
    const onDataRef = useRef(onData);

    useEffect(() => {
        onDataRef.current = onData;
    }, [onData]);

    const applyProps = useCallback(
        (props) => {
            if (!props) return;
            let filteredProps = props;
            if (only && Array.isArray(only) && only.length > 0) {
                filteredProps = {};
                only.forEach((key) => {
                    if (key in props) {
                        filteredProps[key] = props[key];
                    }
                });
            }

            setPolledData(filteredProps);
            if (onDataRef.current) {
                onDataRef.current(filteredProps);
            }
            setLastUpdated(new Date());
        },
        [only]
    );

    const performReload = useCallback(async () => {
        if (isFetchingRef.current || typeof window === 'undefined') return;
        isFetchingRef.current = true;

        try {
            const response = await axios.get(window.location.href, {
                headers: {
                    'X-Live-Poll': '1',
                    Accept: 'application/json',
                },
                timeout: 5000,
            });

            applyProps(response?.data?.props);
        } catch {
            // Silently ignore network hiccups during background poll
        } finally {
            isFetchingRef.current = false;
        }
    }, [applyProps]);

    /**
     * Seamlessly fetch a paginated or filtered URL in the background without refreshing the page or triggering GlobalPageLoader.
     */
    const fetchUrl = useCallback(
        async (targetUrl) => {
            if (!targetUrl || typeof window === 'undefined') return;
            setIsNavigatingPage(true);
            isFetchingRef.current = true;

            try {
                window.history.pushState(window.history.state, '', targetUrl);
                const response = await axios.get(targetUrl, {
                    headers: {
                        'X-Live-Poll': '1',
                        Accept: 'application/json',
                    },
                    timeout: 8000,
                });

                applyProps(response?.data?.props);
            } catch {
                // Ignore
            } finally {
                isFetchingRef.current = false;
                setIsNavigatingPage(false);
            }
        },
        [applyProps]
    );

    const manualRefresh = useCallback(async () => {
        await performReload();
        broadcastLiveSync('manual-reload');
    }, [performReload]);

    // Listen to instant Cross-Tab BroadcastChannel events
    useEffect(() => {
        if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
            return;
        }

        let bc = null;
        try {
            bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
            bc.onmessage = (event) => {
                if (event?.data?.type === 'SYNC_NOW') {
                    performReload();
                }
            };
        } catch {
            // Ignore
        }

        return () => {
            if (bc) {
                bc.close();
            }
        };
    }, [performReload]);

    // Also refresh immediately when tab regains visibility/focus
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleVisibilityOrFocus = () => {
            if (!document.hidden) {
                performReload();
            }
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        };
    }, [performReload]);

    // Continuous 1-second (1000ms) real-time background polling (no pause)
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.hidden) return;
            performReload();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs, performReload]);

    return {
        isLive: true,
        toggleLive: () => {},
        manualRefresh,
        fetchUrl,
        isNavigatingPage,
        lastUpdated,
        polledData,
    };
}
