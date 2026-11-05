/**
 * Client-Side Image Optimizer and Compression Utility
 * Resizes and compresses images using HTMLCanvasElement before uploading to Supabase Storage.
 */

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  width: number;
  height: number;
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_AVATAR_RAW_BYTES = 10 * 1024 * 1024; // 10MB raw selection limit before compression
export const MAX_POST_MEDIA_RAW_BYTES = 25 * 1024 * 1024; // 25MB raw selection limit before compression

/**
 * Validates whether a file is an allowable image type.
 */
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Unsupported image format. Please select a JPEG, PNG, WebP, or GIF image.",
    };
  }
  return { valid: true };
}

/**
 * Optimizes an image for avatar usage (square crop, max 512x512, high quality WebP/JPEG).
 */
export async function optimizeAvatarImage(file: File): Promise<OptimizedImageResult> {
  const validation = isValidImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    cropToSquare: true,
    quality: 0.85,
    format: "image/webp",
    fallbackFormat: "image/jpeg",
  });
}

/**
 * Optimizes an image for post attachment (max 1280x1280, preserving aspect ratio).
 */
export async function optimizePostImage(file: File): Promise<OptimizedImageResult> {
  const validation = isValidImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Preserve animated GIFs without flattening canvas
  if (file.type.toLowerCase() === "image/gif") {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      previewUrl,
      originalSize: file.size,
      compressedSize: file.size,
      savedPercentage: 0,
      width: 0,
      height: 0,
    };
  }

  return compressImage(file, {
    maxWidth: 1280,
    maxHeight: 1280,
    cropToSquare: false,
    quality: 0.82,
    format: "image/webp",
    fallbackFormat: "image/jpeg",
  });
}

interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  cropToSquare: boolean;
  quality: number;
  format: "image/webp" | "image/jpeg";
  fallbackFormat: "image/jpeg";
}

function compressImage(file: File, options: CompressionOptions): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let srcX = 0;
        let srcY = 0;
        let srcW = img.naturalWidth || img.width;
        let srcH = img.naturalHeight || img.height;

        let targetW = srcW;
        let targetH = srcH;

        if (options.cropToSquare) {
          // Crop square from center
          const minDim = Math.min(srcW, srcH);
          srcX = (srcW - minDim) / 2;
          srcY = (srcH - minDim) / 2;
          srcW = minDim;
          srcH = minDim;
          targetW = Math.min(minDim, options.maxWidth);
          targetH = targetW;
        } else {
          // Maintain aspect ratio within maxWidth/maxHeight
          if (targetW > options.maxWidth || targetH > options.maxHeight) {
            const ratio = Math.min(options.maxWidth / targetW, options.maxHeight / targetH);
            targetW = Math.round(targetW * ratio);
            targetH = Math.round(targetH * ratio);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { alpha: options.format === "image/webp" });

        if (!ctx) {
          return reject(new Error("Unable to create canvas context for image processing"));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

        const tryExport = (format: string) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                if (format !== options.fallbackFormat) {
                  return tryExport(options.fallbackFormat);
                }
                return reject(new Error("Failed to encode compressed image blob"));
              }

              const ext = format === "image/webp" ? "webp" : "jpg";
              const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
              const compressedFile = new File([blob], `${cleanBaseName}.${ext}`, {
                type: format,
                lastModified: Date.now(),
              });

              const previewUrl = URL.createObjectURL(blob);
              const originalSize = file.size;
              const compressedSize = compressedFile.size;
              const savedPercentage = originalSize > compressedSize
                ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
                : 0;

              resolve({
                file: compressedFile,
                previewUrl,
                originalSize,
                compressedSize,
                savedPercentage,
                width: targetW,
                height: targetH,
              });
            },
            format,
            options.quality
          );
        };

        tryExport(options.format);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image file into memory"));
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes into human-readable string (e.g. 2.45 MB, 180 KB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
