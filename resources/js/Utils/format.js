import axios from 'axios';

/**
 * Format integer amount to Indonesian Rupiah (IDR).
 */
export function formatRupiah(amount) {
    if (amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format timestamp string to localized Indonesian date-time.
 */
export function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Calculate remaining time parts (days, hours, minutes, seconds).
 */
export function getTimeRemaining(endTime) {
    const total = Date.parse(endTime) - Date.now();
    const seconds = Math.max(0, Math.floor((total / 1000) % 60));
    const minutes = Math.max(0, Math.floor((total / 1000 / 60) % 60));
    const hours = Math.max(0, Math.floor((total / (1000 * 60 * 60)) % 24));
    const days = Math.max(0, Math.floor(total / (1000 * 60 * 60 * 24)));

    return {
        total,
        days,
        hours,
        minutes,
        seconds,
        isEnded: total <= 0,
    };
}

let isSyncing = false;
let lastSyncTime = 0;

/**
 * Lightweight ping to auto-close expired auctions on the server in real-time.
 */
export async function syncAuctionEnded() {
    const now = Date.now();
    if (isSyncing || now - lastSyncTime < 2500) return;
    isSyncing = true;
    lastSyncTime = now;
    try {
        await axios.post(route('auctions.sync-ended'));
    } catch {
        // Silently ignore
    } finally {
        isSyncing = false;
    }
}
