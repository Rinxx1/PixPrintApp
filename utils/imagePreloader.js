/**
 * Image Preloader Utility
 * Implements Instagram-style intelligent preloading
 * - Preloads images adjacent to visible ones
 * - Priority-based loading queue
 * - Memory-aware preloading
 */

import { Image } from 'expo-image';

class ImagePreloader {
  constructor() {
    this.preloadQueue = new Map();
    this.preloadedUrls = new Set();
    this.maxConcurrentPreloads = 3;
    this.activePreloads = 0;
  }

  /**
   * Preload adjacent images for smooth scrolling
   * @param {Array} images - Array of image objects with imageUrl property
   * @param {number} currentIndex - Index of currently visible image
   * @param {number} range - Number of images to preload in each direction
   */
  preloadAdjacentImages(images, currentIndex, range = 3) {
    if (!images || images.length === 0) return;

    const startIndex = Math.max(0, currentIndex - range);
    const endIndex = Math.min(images.length - 1, currentIndex + range);

    for (let i = startIndex; i <= endIndex; i++) {
      if (i !== currentIndex && images[i]?.imageUrl) {
        const distance = Math.abs(i - currentIndex);
        const priority = distance === 1 ? 'high' : distance === 2 ? 'normal' : 'low';
        this.preloadImage(images[i].imageUrl, priority);
      }
    }
  }

  /**
   * Preload a single image with priority
   * @param {string} url - Image URL to preload
   * @param {string} priority - 'high', 'normal', or 'low'
   */
  async preloadImage(url, priority = 'normal') {
    if (!url || this.preloadedUrls.has(url) || this.preloadQueue.has(url)) {
      return;
    }

    this.preloadQueue.set(url, { url, priority, timestamp: Date.now() });
    this.processQueue();
  }

  /**
   * Process the preload queue based on priority
   */
  async processQueue() {
    if (this.activePreloads >= this.maxConcurrentPreloads) {
      return;
    }

    // Sort queue by priority
    const sortedQueue = Array.from(this.preloadQueue.values()).sort((a, b) => {
      const priorityWeight = { high: 3, normal: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    for (const item of sortedQueue) {
      if (this.activePreloads >= this.maxConcurrentPreloads) {
        break;
      }

      this.activePreloads++;
      this.preloadQueue.delete(item.url);

      try {
        await Image.prefetch(item.url, 'memory-disk');
        this.preloadedUrls.add(item.url);
      } catch (error) {
        console.warn(`Failed to preload image: ${item.url}`, error);
      } finally {
        this.activePreloads--;
        this.processQueue(); // Continue processing queue
      }
    }
  }

  /**
   * Preload images in batch
   * @param {Array} urls - Array of image URLs
   * @param {string} priority - Priority for all images in batch
   */
  preloadBatch(urls, priority = 'low') {
    urls.forEach(url => this.preloadImage(url, priority));
  }

  /**
   * Clear preload cache and queue
   */
  clear() {
    this.preloadQueue.clear();
    this.preloadedUrls.clear();
  }

  /**
   * Check if image is preloaded
   * @param {string} url - Image URL
   * @returns {boolean}
   */
  isPreloaded(url) {
    return this.preloadedUrls.has(url);
  }
}

export default new ImagePreloader();
