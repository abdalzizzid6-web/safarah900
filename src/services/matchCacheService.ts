// src/services/matchCacheService.ts

const CACHE_TTL_MS: Record<string, number> = {
  live: 60 * 1000,          // 1 minute
  today: 5 * 60 * 1000,     // 5 minutes
  tomorrow: 30 * 60 * 1000, // 30 minutes
  finished: 24 * 60 * 60 * 1000, // 24 hours
  default: 30 * 60 * 1000   // 30 minutes
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<any>> = {};

export const matchCacheService = {
  get: <T>(key: string): T | null => {
    const entry = cache[key];
    if (!entry) return null;

    const ttl = CACHE_TTL_MS[key.split('_')[0]] || CACHE_TTL_MS.default;
    if (Date.now() - entry.timestamp > ttl) {
      delete cache[key];
      return null;
    }
    return entry.data;
  },

  set: <T>(key: string, data: T): void => {
    cache[key] = {
      data,
      timestamp: Date.now()
    };
  },

  clear: (key?: string) => {
    if (key) {
      delete cache[key];
    } else {
      Object.keys(cache).forEach(k => delete cache[k]);
    }
  }
};
