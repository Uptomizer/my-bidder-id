/**
 * Format file size in bytes into human-readable KB / MB string.
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Client-side HTML5 Canvas image compressor & WebP converter.
 * Shrinks image dimensions and file size before upload to save bandwidth, storage, and database load.
 */
export function compressImageFile(
    file,
    { maxWidth = 1280, maxHeight = 1280, quality = 0.78 } = {}
) {
    return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            resolve({
                file,
                originalSize: file?.size || 0,
                compressedSize: file?.size || 0,
                savedPercent: 0,
                previewUrl: file ? URL.createObjectURL(file) : '',
            });
            return;
        }

        const originalSize = file.size;
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            try {
                let targetWidth = img.naturalWidth || img.width;
                let targetHeight = img.naturalHeight || img.height;

                if (targetWidth > maxWidth || targetHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
                    targetWidth = Math.max(1, Math.round(targetWidth * ratio));
                    targetHeight = Math.max(1, Math.round(targetHeight * ratio));
                }

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve({
                        file,
                        originalSize,
                        compressedSize: originalSize,
                        savedPercent: 0,
                        previewUrl: objectUrl,
                    });
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve({
                                file,
                                originalSize,
                                compressedSize: originalSize,
                                savedPercent: 0,
                                previewUrl: objectUrl,
                            });
                            return;
                        }

                        // Use the compressed WebP blob if it is smaller or converted to WebP
                        const baseName = file.name.replace(/\.[^/.]+$/, '');
                        const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
                        const compressedFile = new File([blob], `${baseName}.${ext}`, {
                            type: blob.type || 'image/webp',
                            lastModified: Date.now(),
                        });

                        const finalFile =
                            compressedFile.size < originalSize || ext === 'webp'
                                ? compressedFile
                                : file;
                        const compressedSize = finalFile.size;
                        const savedPercent =
                            originalSize > compressedSize
                                ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
                                : 0;

                        URL.revokeObjectURL(objectUrl);
                        const previewUrl = URL.createObjectURL(finalFile);

                        resolve({
                            file: finalFile,
                            originalSize,
                            compressedSize,
                            savedPercent,
                            previewUrl,
                        });
                    },
                    'image/webp',
                    quality
                );
            } catch {
                resolve({
                    file,
                    originalSize,
                    compressedSize: originalSize,
                    savedPercent: 0,
                    previewUrl: objectUrl,
                });
            }
        };

        img.onerror = () => {
            resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                savedPercent: 0,
                previewUrl: objectUrl,
            });
        };

        img.src = objectUrl;
    });
}

/**
 * Compress an array/FileList of images in parallel.
 */
export async function compressImageFiles(files, options = {}) {
    const fileArray = Array.from(files || []);
    return Promise.all(fileArray.map((f) => compressImageFile(f, options)));
}
