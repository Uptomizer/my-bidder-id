/**
 * Base atomic Skeleton component with smooth shimmer wave animation.
 */
export default function Skeleton({
    className = '',
    variant = 'default',
    rounded = 'rounded-xl',
    ...props
}) {
    const variantClass =
        variant === 'dark'
            ? 'skeleton-shimmer-dark'
            : variant === 'subtle'
            ? 'skeleton-shimmer-subtle'
            : 'skeleton-shimmer';

    return (
        <div
            className={`${variantClass} ${rounded} ${className}`}
            {...props}
        />
    );
}
