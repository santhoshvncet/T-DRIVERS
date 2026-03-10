// Image compression and conversion utilities

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
}

/**
 * Compress an image from data URL
 * Reduces 5MB images to ~200KB while maintaining quality
 */
export const compressImage = (
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const { maxWidth = 1280, maxHeight = 1280, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        // Log compression stats (for debugging)
        const originalSize = Math.round((dataUrl.length * 3) / 4 / 1024);
        const compressedSize = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
        console.log(
          `Image compressed: ${originalSize}KB → ${compressedSize}KB ` +
          `(${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`
        );

        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    img.src = dataUrl;
  });
};

/**
 * Convert data URL to Blob for FormData upload
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};

/**
 * Get file size from data URL (in KB)
 */
export const getDataUrlSizeKB = (dataUrl: string): number => {
  // Base64 encoding increases size by ~33%, so divide by 4/3
  return Math.round((dataUrl.length * 3) / 4 / 1024);
};

/**
 * Check if image needs compression based on size
 */
export const needsCompression = (
  dataUrl: string,
  maxSizeKB: number = 500
): boolean => {
  return getDataUrlSizeKB(dataUrl) > maxSizeKB;
};

/**
 * Smart compress - only compress if needed
 */
export const smartCompress = async (
  dataUrl: string,
  options: CompressionOptions & { maxSizeKB?: number } = {}
): Promise<string> => {
  const { maxSizeKB = 500, ...compressionOptions } = options;

  if (!needsCompression(dataUrl, maxSizeKB)) {
    console.log("Image already small enough, skipping compression");
    return dataUrl;
  }

  return compressImage(dataUrl, compressionOptions);
};