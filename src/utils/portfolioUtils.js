
import { slugify } from './slugify';

/**
 * Generates the public URL for a portfolio
 * @param {Object} portfolio - The portfolio object (must have id and title)
 * @returns {string} The full public URL
 */
export const getPortfolioUrl = (portfolio) => {
    if (!portfolio || !portfolio.id) return '';

    // Ensure we handle both cases: full portfolio object or just the publishedId context
    const id = portfolio.id;
    const title = portfolio.title || 'Portfolio';

    const shortId = id.substring(0, 8);
    const slug = slugify(title);

    // Support both absolute and relative URLs
    const relativeUrl = `/portfolio/${shortId}/${slug}`;
    return `${window.location.origin}${relativeUrl}`;
};

/**
 * Copies the portfolio link to clipboard
 * @param {Object} portfolio - The portfolio object
 * @returns {Promise<boolean>} Success status
 */
export const copyPortfolioToClipboard = async (portfolio) => {
    const url = getPortfolioUrl(portfolio);
    if (!url) return false;

    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (err) {
        console.error('Failed to copy link:', err);
        return false;
    }
};
