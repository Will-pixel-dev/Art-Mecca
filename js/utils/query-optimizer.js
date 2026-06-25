/**
 * Query Optimizer for Firestore
 * Implements caching, debouncing, and batch loading
 */
/**
 * Query Optimizer for Firestore
 */

class QueryOptimizer {
  constructor() {
    this.pendingQueries = new Map();
    this.batchTimeout = null;
    this.batchQueue = [];
  }

  debounceQuery(queryKey, queryFn, delay = 300) {
    return new Promise((resolve, reject) => {
      if (this.pendingQueries.has(queryKey)) {
        clearTimeout(this.pendingQueries.get(queryKey).timeout);
      }
      const timeout = setTimeout(async () => {
        try {
          const result = await queryFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.pendingQueries.delete(queryKey);
        }
      }, delay);
      this.pendingQueries.set(queryKey, { timeout, resolve, reject });
    });
  }

  async getCachedOrFetch(cacheKey, queryFn, ttl = 5 * 60 * 1000) {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for: ${cacheKey}`);
      return cached;
    }
    console.log(`🔄 Cache miss for: ${cacheKey}, fetching from Firestore`);
    const data = await queryFn();
    cacheManager.set(cacheKey, data);
    return data;
  }

  invalidateCache(keyPattern) {
    if (keyPattern.includes('*')) {
      const pattern = keyPattern.replace('*', '');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('artisan_cache_') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      cacheManager.remove(keyPattern);
    }
  }
}

// Create global instance (no export)
const queryOptimizer = new QueryOptimizer();
