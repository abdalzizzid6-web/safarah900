
import fs from "fs";
import path from "path";

type CacheItem<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheItem<any>>();

export const serverCache = {
  get: <T>(key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      return null;
    }
    return item.data as T;
  },
  set: <T>(key: string, data: T, ttlMs: number) => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  },
  readStaticFile: <T>(filename: string): T | null => {
    const cacheKey = `static_file_${filename}`;
    const cached = serverCache.get<T>(cacheKey);
    if (cached) return cached;

    const filePath = path.join(process.cwd(), 'public', 'data', filename);
    if (!fs.existsSync(filePath)) return null;
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data) as T;
      serverCache.set(cacheKey, parsed, 30 * 60 * 1000); // 30 mins cache for static files
      return parsed;
    } catch (e) {
      console.error(`Error reading static file ${filename}:`, e);
      return null;
    }
  }
};
