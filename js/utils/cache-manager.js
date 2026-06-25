/**
 * Cache Manager for Firestore Data
 * Stores frequently accessed data in localStorage
 */

/**
 * Cache Manager for Firestore Data
 */

class CacheManager {
  constructor() {
    this.cachePrefix = 'artisan_cache_';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  get(key) {
    try {
      const cached = localStorage.getItem(this.cachePrefix + key);
      if (!cached) return null;
      const data = JSON.parse(cached);
      const now = Date.now();
      if (now - data.timestamp > this.cacheDuration) {
        localStorage.removeItem(this.cachePrefix + key);
        return null;
      }
      return data.value;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  set(key, value) {
    try {
      const data = {
        timestamp: Date.now(),
        value: value
      };
      localStorage.setItem(this.cachePrefix + key, JSON.stringify(data));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  remove(key) {
    localStorage.removeItem(this.cachePrefix + key);
  }

  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  isValid(key) {
    const data = this.get(key);
    return data !== null;
  }
}

// Create global instance (no export)
const cacheManager = new CacheManager();
