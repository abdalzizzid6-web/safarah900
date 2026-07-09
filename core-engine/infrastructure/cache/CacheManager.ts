export class CacheManager {
  private cache: Map<string, { data: any; expiresAt: Date }> = new Map();
  public metrics = { hits: 0, misses: 0 };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }
    this.metrics.hits++;
    return entry.data as T;
  }

  async set(key: string, data: any, ttlSeconds: number): Promise<void> {
    const expiresAt = new Date(new Date().getTime() + ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
