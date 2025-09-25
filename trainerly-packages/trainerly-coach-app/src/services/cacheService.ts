/**
 * Local Storage Cache Service for Coach App
 * Provides cache-first loading with background updates
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

export interface CacheConfig {
  maxAge?: number; // Maximum age in milliseconds (default: 5 minutes)
  version?: string; // Cache version for invalidation
}

class CacheService {
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_VERSION = '1.0.0';

  /**
   * Generate cache key with coach ID prefix
   */
  private getCacheKey(coachId: string, key: string): string {
    return `coach_${coachId}_${key}`;
  }

  /**
   * Store data in cache
   */
  set<T>(coachId: string, key: string, data: T, config?: CacheConfig): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: config?.version || this.CACHE_VERSION
      };

      const cacheKey = this.getCacheKey(coachId, key);
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      console.log(`💾 Cache SET: ${key} for coach ${coachId}`);
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Get data from cache if valid
   */
  get<T>(coachId: string, key: string, config?: CacheConfig): T | null {
    try {
      const cacheKey = this.getCacheKey(coachId, key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`📭 Cache MISS: ${key} for coach ${coachId}`);
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const maxAge = config?.maxAge || this.DEFAULT_MAX_AGE;
      const age = Date.now() - cacheItem.timestamp;

      // Check if cache is expired
      if (age > maxAge) {
        console.log(`⏰ Cache EXPIRED: ${key} for coach ${coachId} (age: ${Math.round(age/1000)}s)`);
        this.remove(coachId, key);
        return null;
      }

      // Check version compatibility
      const expectedVersion = config?.version || this.CACHE_VERSION;
      if (cacheItem.version !== expectedVersion) {
        console.log(`🔄 Cache VERSION MISMATCH: ${key} for coach ${coachId}`);
        this.remove(coachId, key);
        return null;
      }

      console.log(`✅ Cache HIT: ${key} for coach ${coachId}`);
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  remove(coachId: string, key: string): void {
    try {
      const cacheKey = this.getCacheKey(coachId, key);
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cache REMOVE: ${key} for coach ${coachId}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache for a specific coach
   */
  clearCoachCache(coachId: string): void {
    try {
      const prefix = `coach_${coachId}_`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleared cache for coach ${coachId} (${keysToRemove.length} items)`);
    } catch (error) {
      console.warn('Failed to clear coach cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('coach_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleared all cache (${keysToRemove.length} items)`);
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  /**
   * Check if data has changed (for update detection)
   */
  hasChanged<T>(coachId: string, key: string, newData: T): boolean {
    const cached = this.get<T>(coachId, key);
    if (!cached) return true;
    
    return JSON.stringify(cached) !== JSON.stringify(newData);
  }

  /**
   * Get cache statistics
   */
  getStats(coachId: string): { totalItems: number; totalSize: number } {
    let totalItems = 0;
    let totalSize = 0;
    const prefix = `coach_${coachId}_`;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          totalItems++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return { totalItems, totalSize };
  }
}

export const cacheService = new CacheService();

// Cache keys constants
export const CACHE_KEYS = {
  COACH_PROFILE: 'profile',
  EXERCISES: 'exercises',
  TRAINING_PLANS: 'training_plans',
  TRAINEES: 'trainees',
  TRAINEE_PROGRESS: (traineeId: string) => `trainee_progress_${traineeId}`,
} as const;
