<?php

namespace App\Http\Controllers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class Controller
{
    /**
     * Compress, resize, and convert an uploaded image to lightweight WebP format before storing.
     * Falls back to standard file storage if GD cannot process the stream.
     */
    protected function storeCompressedImage(
        UploadedFile $file,
        string $directory,
        int $maxWidth = 1280,
        int $maxHeight = 1280,
        int $quality = 78
    ): string {
        $realPath = $file->getRealPath();

        if (! $realPath || ! extension_loaded('gd') || ! function_exists('imagecreatefromstring')) {
            return $file->store($directory, 'public');
        }

        $rawBytes = @file_get_contents($realPath);
        if (! $rawBytes) {
            return $file->store($directory, 'public');
        }

        $sourceImage = @imagecreatefromstring($rawBytes);
        if (! $sourceImage) {
            return $file->store($directory, 'public');
        }

        $origWidth = imagesx($sourceImage);
        $origHeight = imagesy($sourceImage);

        if ($origWidth <= 0 || $origHeight <= 0) {
            imagedestroy($sourceImage);

            return $file->store($directory, 'public');
        }

        // Calculate proportional target dimensions
        $newWidth = $origWidth;
        $newHeight = $origHeight;

        if ($origWidth > $maxWidth || $origHeight > $maxHeight) {
            $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
            $newWidth = max(1, (int) round($origWidth * $ratio));
            $newHeight = max(1, (int) round($origHeight * $ratio));
        }

        $canvas = imagecreatetruecolor($newWidth, $newHeight);
        if (! $canvas) {
            imagedestroy($sourceImage);

            return $file->store($directory, 'public');
        }

        // Preserve transparency for PNG/WebP
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 255, 255, 255, 127);
        imagefilledrectangle($canvas, 0, 0, $newWidth, $newHeight, $transparent);

        imagecopyresampled(
            $canvas,
            $sourceImage,
            0,
            0,
            0,
            0,
            $newWidth,
            $newHeight,
            $origWidth,
            $origHeight
        );

        ob_start();
        if (function_exists('imagewebp')) {
            $ext = 'webp';
            imagewebp($canvas, null, $quality);
        } else {
            $ext = 'jpg';
            imagejpeg($canvas, null, $quality);
        }
        $compressedBytes = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($canvas);

        if (! $compressedBytes) {
            return $file->store($directory, 'public');
        }

        $filename = trim($directory, '/') . '/' . Str::random(40) . '.' . $ext;
        Storage::disk('public')->put($filename, $compressedBytes);

        return $filename;
    }
}
