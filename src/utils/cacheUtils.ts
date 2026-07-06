export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getCached<T>(
  cacheKey: string,
  memoryCache: Record<string, { data: any; expiresAt: number }>,
  storageName: string,
  forceIgnoreExpiry: boolean = false
): T | null {
  const item = memoryCache[cacheKey];
  if (item && (item.expiresAt > Date.now() || forceIgnoreExpiry)) {
    return item.data as T;
  }
  // Try localstorage backup cache
  try {
    const raw = localStorage.getItem(storageName);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt > Date.now() || forceIgnoreExpiry) {
        // Populate memory cache
        memoryCache[cacheKey] = parsed;
        return parsed.data as T;
      }
    }
  } catch (e) {
    console.warn("Storage read error", e);
  }
  return null;
}

export function setCache<T>(
  cacheKey: string,
  data: T,
  memoryCache: Record<string, { data: any; expiresAt: number }>,
  storageName: string
) {
  const expiresAt = Date.now() + CACHE_TTL_MS;
  memoryCache[cacheKey] = { data, expiresAt };
  try {
    localStorage.setItem(storageName, JSON.stringify({ data, expiresAt }));
  } catch (e) {
    console.warn("Storage write error", e);
  }
}

export function invalidateCache(
  cacheKey: string,
  memoryCache: Record<string, { data: any; expiresAt: number }>,
  storageName: string
) {
  delete memoryCache[cacheKey];
  localStorage.removeItem(storageName);
}
