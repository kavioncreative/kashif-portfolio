/**
 * Unified image preview rendering utility
 * Converts preview_settings into background-image CSS
 * 
 * @param {Object} input
 * @param {Object} input.preview_settings - Percentage-based crop (from portfolio_images)
 * @param {string} input.imageUrl - Image URL for background-image
 * @returns {Object} CSS styles for background-image rendering
 */
export function getImagePreviewStyles(input) {
    const { preview_settings, imageUrl } = input;

    const baseStyles = {
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: 'no-repeat'
    };

    // Priority 1: Modern percentage-based crop settings
    if (preview_settings?.crop && typeof preview_settings.crop.x === 'number') {
        const { x, y, width, height } = preview_settings.crop;

        // DIAGNOSTIC LOGGING
        console.log('🧮 CALC - Input crop:', { x, y, width, height });

        // FOCUS-POINT MODEL (CORRECT APPROACH):
        // The crop window from react-easy-crop represents the user's intended visual focus.
        // The TRUE visual intent is the CENTER of that crop window, not the edges.
        //
        // We use background-size: cover (not calculated scale) because:
        // 1. react-easy-crop zoom ≠ CSS scale
        // 2. Attempting to simulate zoom causes geometry drift
        // 3. cover preserves visual intent across all container aspect ratios
        //
        // background-position with percentage values naturally aligns the focus point:
        // - 50% 50% = center of image aligns with center of container
        // - focusX% focusY% = that point of image aligns with that point of container

        const focusX = x + width / 2;
        const focusY = y + height / 2;

        console.log('🧮 CALC - Focus point (crop center):', { focusX, focusY });
        console.log('🧮 CALC - Using background-size: cover (no scale calculation)');
        console.log('🧮 CALC - Final output:', {
            backgroundSize: 'cover',
            backgroundPosition: `${focusX}% ${focusY}%`
        });

        return {
            ...baseStyles,
            backgroundSize: 'cover',
            backgroundPosition: `${focusX}% ${focusY}%`
        };
    }


    // Priority 3: Fallback to standard cover
    return {
        ...baseStyles,
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
    };
}
