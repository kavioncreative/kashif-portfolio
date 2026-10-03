import { supabase } from '../lib/supabase';

/**
 * Uploads a cropped preview image to Supabase Storage
 * 
 * @param {Blob} imageBlob - PNG blob from getCroppedPreviewImage
 * @param {string} portfolioId - Portfolio UUID
 * @param {string} imageId - Image UUID
 * @returns {Promise<string>} Public URL of uploaded preview image
 */
export async function uploadPreviewImage(imageBlob, portfolioId, imageId) {
    try {
        console.log('📤 Uploading preview image to Supabase Storage...');
        console.log('📦 Blob size:', (imageBlob.size / 1024).toFixed(2), 'KB');

        // Convert Blob to File (required by Supabase)
        // Use timestamp for cache-busting so browser/React see a new URL every time
        const fileName = `${imageId}-preview-${Date.now()}.png`;
        const file = new File([imageBlob], fileName, { type: 'image/png' });

        // File path: portfolioId/imageId-preview-timestamp.png
        const filePath = `${portfolioId}/${fileName}`;

        console.log('📁 Upload path:', filePath);

        // Upload to Supabase Storage (upsert to overwrite existing)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio-previews')
            .upload(filePath, file, {
                upsert: true,           // Overwrite if exists
                contentType: 'image/png'
            });

        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            throw uploadError;
        }

        console.log('✅ Upload successful:', uploadData);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('portfolio-previews')
            .getPublicUrl(filePath);

        console.log('🌐 Public URL:', publicUrl);

        return publicUrl;

    } catch (error) {
        console.error('❌ Failed to upload preview image:', error);
        throw error;
    }
}
