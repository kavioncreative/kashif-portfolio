/**
 * Generates a cropped image from react-easy-crop output
 * 
 * @param {string} imageSrc - Source image URL
 * @param {Object} croppedAreaPixels - Pixel coordinates from react-easy-crop onCropComplete
 * @param {number} croppedAreaPixels.x - X offset in pixels
 * @param {number} croppedAreaPixels.y - Y offset in pixels
 * @param {number} croppedAreaPixels.width - Crop width in pixels
 * @param {number} croppedAreaPixels.height - Crop height in pixels
 * @returns {Promise<Blob>} PNG image blob of the cropped area
 */
export async function getCroppedPreviewImage(imageSrc, croppedAreaPixels) {
    return new Promise((resolve, reject) => {
        // Create image element
        const image = new Image();

        // Handle cross-origin images (e.g., from Supabase storage)
        image.crossOrigin = 'anonymous';

        image.onload = () => {
            try {
                // Create canvas with exact crop dimensions
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    throw new Error('Failed to get canvas context');
                }

                // Set canvas size to match crop area exactly (preserving aspect ratio)
                canvas.width = croppedAreaPixels.width;
                canvas.height = croppedAreaPixels.height;

                // Draw the cropped portion of the image 1:1
                ctx.drawImage(
                    image,
                    croppedAreaPixels.x,           // Source X
                    croppedAreaPixels.y,           // Source Y
                    croppedAreaPixels.width,       // Source Width
                    croppedAreaPixels.height,      // Source Height
                    0,                              // Destination X
                    0,                              // Destination Y
                    croppedAreaPixels.width,       // Destination Width
                    croppedAreaPixels.height       // Destination Height
                );

                // Convert canvas to blob (WebP for better compression)
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas toBlob returned null'));
                        }
                    },
                    'image/webp',
                    0.8 // High quality but compressed
                );

            } catch (error) {
                reject(error);
            }
        };

        image.onerror = () => {
            reject(new Error(`Failed to load image: ${imageSrc}`));
        };

        // Start loading the image
        image.src = imageSrc;
    });
}

/**
 * Helper function to convert Blob to File (optional, for uploads)
 * 
 * @param {Blob} blob - Image blob
 * @param {string} filename - Desired filename
 * @returns {File} File object
 */
export function blobToFile(blob, filename) {
    return new File([blob], filename, { type: blob.type });
}
