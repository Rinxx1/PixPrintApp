import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

class ImageCache {
  constructor() {
    this.cache = new Map();
    this.cacheDir = `${FileSystem.cacheDirectory}pixprint_images/`;
    this.memoryCache = new Map(); // In-memory cache for faster access
    this.maxMemoryCacheSize = 50; // Maximum number of images to keep in memory
    this.maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    this.ensureCacheDirectoryExists();
  }

  async ensureCacheDirectoryExists() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        console.log('Cache directory created:', this.cacheDir);
      }
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  }

  // Generate a unique filename from URL
  generateCacheKey(url) {
    if (!url) return null;
    
    // Create a simple hash from the URL
    const hash = url.split('').reduce((acc, char) => {
      acc = ((acc << 5) - acc) + char.charCodeAt(0);
      return acc & acc; // Convert to 32-bit integer
    }, 0);
    
    return `img_${Math.abs(hash)}.jpg`;
  }

  // Check if image is cached and not expired
  async isCached(url) {
    try {
      const cacheKey = this.generateCacheKey(url);
      if (!cacheKey) return false;

      // Check memory cache first
      if (this.memoryCache.has(url)) {
        const cached = this.memoryCache.get(url);
        if (Date.now() - cached.timestamp < this.maxCacheAge) {
          return true;
        } else {
          this.memoryCache.delete(url);
        }
      }

      const filePath = `${this.cacheDir}${cacheKey}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        // Check if file is not too old
        const fileAge = Date.now() - fileInfo.modificationTime * 1000;
        if (fileAge < this.maxCacheAge) {
          return true;
        } else {
          // Delete expired file
          await FileSystem.deleteAsync(filePath);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  // Get cached image path
  async getCachedImagePath(url) {
    try {
      const cacheKey = this.generateCacheKey(url);
      if (!cacheKey) return null;

      // Check memory cache first
      if (this.memoryCache.has(url)) {
        const cached = this.memoryCache.get(url);
        if (Date.now() - cached.timestamp < this.maxCacheAge) {
          return cached.path;
        } else {
          this.memoryCache.delete(url);
        }
      }

      const filePath = `${this.cacheDir}${cacheKey}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        const fileAge = Date.now() - fileInfo.modificationTime * 1000;
        if (fileAge < this.maxCacheAge) {
          // Add to memory cache
          this.addToMemoryCache(url, filePath);
          return filePath;
        } else {
          await FileSystem.deleteAsync(filePath);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  // Download and cache image
  async cacheImage(url) {
    try {
      const cacheKey = this.generateCacheKey(url);
      if (!cacheKey) return null;

      const filePath = `${this.cacheDir}${cacheKey}`;
      
      // Check if already cached
      const cached = await this.getCachedImagePath(url);
      if (cached) {
        return cached;
      }

      console.log(`Caching image: ${url}`);
      
      // Download image
      const downloadResult = await FileSystem.downloadAsync(url, filePath);
      
      if (downloadResult.status === 200) {
        // Add to memory cache
        this.addToMemoryCache(url, filePath);
        console.log(`Image cached successfully: ${filePath}`);
        return filePath;
      } else {
        console.error('Failed to download image:', downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error('Error caching image:', error);
      return null;
    }
  }

  // Add to memory cache with size limit
  addToMemoryCache(url, path) {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(url, {
      path,
      timestamp: Date.now()
    });
  }

  // Get image source with caching
  async getImageSource(url, fallbackSource = null) {
    try {
      if (!url || typeof url !== 'string') {
        return fallbackSource;
      }

      // First check if image is cached
      const cachedPath = await this.getCachedImagePath(url);
      if (cachedPath) {
        return { uri: cachedPath };
      }

      // If not cached, return original URL and cache in background
      this.cacheImage(url).catch(error => {
        console.error('Background caching failed:', error);
      });

      return { uri: url };
    } catch (error) {
      console.error('Error getting image source:', error);
      return fallbackSource;
    }
  }

  // Clear old cached images
  async clearExpiredCache() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = `${this.cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        const fileAge = now - fileInfo.modificationTime * 1000;
        if (fileAge > this.maxCacheAge) {
          await FileSystem.deleteAsync(filePath);
          console.log(`Deleted expired cache file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Clear all cache
  async clearAllCache() {
    try {
      await FileSystem.deleteAsync(this.cacheDir);
      this.memoryCache.clear();
      await this.ensureCacheDirectoryExists();
      console.log('All cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache size
  async getCacheSize() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = `${this.cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        totalSize += fileInfo.size || 0;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }
}

// Create singleton instance
const imageCache = new ImageCache();

// Clear expired cache on app start
imageCache.clearExpiredCache().catch(console.error);

export default imageCache;
