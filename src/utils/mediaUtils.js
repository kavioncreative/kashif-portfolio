
/**
 * Detects if a URL or filename refers to a video format
 * @param {string} url 
 * @returns {boolean}
 */
export const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.endsWith(ext)) || lowerUrl.includes('video');
};

/**
 * Detects if a URL or filename refers to an animated GIF
 * @param {string} url 
 * @returns {boolean}
 */
export const isGif = (url) => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.gif');
};

/**
 * Detects if a URL or filename refers to any animated media (GIF or video)
 * @param {string} url 
 * @returns {boolean}
 */
export const isAnimated = (url) => {
    return isVideo(url) || isGif(url);
};
