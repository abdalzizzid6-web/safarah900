
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
    const filePath = path.join(process.cwd(), 'public', 'data', filename);
    if (!fs.existsSync(filePath)) return null;
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading static file ${filename}:`, e);
      return null;
    }
  }
};
