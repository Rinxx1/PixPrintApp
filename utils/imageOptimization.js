/**
 * Image optimization utilities for Firebase Storage URLs
 */

/**
 * Optimizes image URLs for different quality levels
 * @param {string} originalUrl - The original image URL
 * @param {string} quality - Quality level: 'thumbnail', 'medium', 'high'
 * @returns {string} Optimized URL or original URL if not optimizable
 */
export const optimizeImageUrl = (originalUrl, quality = 'thumbnail') => {
  if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
  
  // For Firebase Storage URLs, add quality parameters
  if (originalUrl.includes('firebasestorage.googleapis.com')) {
    const url = new URL(originalUrl);
    
    // Add compression parameters based on quality level
    switch (quality) {
      case 'thumbnail':
        // For grid thumbnails - very fast loading
        return url.toString() + '&w=200&h=200&fit=crop&auto=compress&q=20';
      case 'medium':
        // For larger previews - balanced quality
        return url.toString() + '&w=400&h=400&fit=crop&auto=compress&q=60';
      case 'high':
        return originalUrl; // Return original for high quality modal view
      default:
        return originalUrl;
    }
  }
  
  return originalUrl;
};

/**
 * Quality presets for different use cases
 */
export const ImageQuality = {
  THUMBNAIL: 'thumbnail',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Get optimized URL for specific dimensions
 * @param {string} originalUrl - The original image URL
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @param {number} quality - Image quality (1-100)
 * @returns {string} Optimized URL
 */
export const optimizeImageWithDimensions = (originalUrl, width, height, quality = 80) => {
  if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
  
  if (originalUrl.includes('firebasestorage.googleapis.com')) {
    const url = new URL(originalUrl);
    return url.toString() + `&w=${width}&h=${height}&fit=crop&auto=compress&q=${quality}`;
  }
  
  return originalUrl;
};

/**
 * Common image optimization presets
 */
export const ImagePresets = {
  AVATAR: (url) => optimizeImageUrl(url, 'thumbnail'),
  GALLERY_GRID: (url) => optimizeImageUrl(url, 'thumbnail'),
  GALLERY_PREVIEW: (url) => optimizeImageUrl(url, 'medium'),
  EVENT_COVER: (url) => optimizeImageUrl(url, 'high'),
  MODAL_VIEW: (url) => optimizeImageUrl(url, 'high')
};