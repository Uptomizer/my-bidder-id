import Spinner from '@/Components/Spinner';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi tindakan',
    message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
    confirmText = 'Ya, lanjutkan',
    processingText = 'Memproses...',
    cancelText = 'Batal',
    variant = 'danger',
    processing = false,
    children = null,
}) {
    if (!isOpen) return null;

    const iconBgClass =
        variant === 'danger'
            ? 'bg-red-50 text-red-600 border border-red-200'
            : variant === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200';

    const confirmBtnClass =
        variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : variant === 'success'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-neutral-900 hover:bg-neutral-800 text-white';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
            <div
                className="fixed inset-0"
                onClick={() => {
                    if (!processing && onClose) onClose();
                }}
            />
            <div className="relative bg-white rounded-2xl border border-neutral-200 max-w-md w-full p-6 shadow-lg z-10">
                <div className="flex items-start gap-3.5">
                    <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}
                    >
                        {variant === 'danger' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        ) : variant === 'success' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8.25h.008v.008H12V8.25z" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-neutral-900">
                            {title}
                        </h3>
                        {message && (
                            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                {children && <div className="mt-4">{children}</div>}

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-150 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onConfirm}
                        className={`h-9 px-4 rounded-lg text-xs font-medium transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2 ${confirmBtnClass}`}
                    >
                        {processing ? (
                            <>
                                <Spinner className="w-3.5 h-3.5 text-white" />
                                <span>{processingText}</span>
                            </>
                        ) : (
                            <span>{confirmText}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
