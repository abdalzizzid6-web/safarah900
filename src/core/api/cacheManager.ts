const memoryCache: Record<string, { value: any, expiry: number }> = {};

export default {
  get(key: string) {
    const now = Date.now();
    
    // Check Memory Cache
    if (memoryCache[key] !== undefined) {
      if (memoryCache[key].expiry > now) {
        return memoryCache[key].value;
      }
      delete memoryCache[key];
    }
    
    // Check LocalStorage
    const val = localStorage.getItem(key);
    if (val) {
      try {
        const item = JSON.parse(val);
        // Supports both old-style raw storage and new-style TTL storage
        if (item && typeof item === 'object' && 'value' in item && 'expiry' in item) {
          if (item.expiry > now) {
            memoryCache[key] = item;
            return item.value;
          } else {
            localStorage.removeItem(key);
          }
        } else {
          // Old data with no TTL - treat as expired for safety or keep as is?
          // Let's treat as expired to force fresh data after this upgrade.
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Fallback for non-JSON data
        localStorage.removeItem(key);
      }
    }
    return null;
  },
  set(key: string, value: any, ttlMs: number = 300000, useStorage = false) {
    const expiry = Date.now() + ttlMs;
    const item = { value, expiry };
    
    memoryCache[key] = item;
    if (useStorage) {
      localStorage.setItem(key, JSON.stringify(item));
    }
  },
  remove(key: string) {
    delete memoryCache[key];
    localStorage.removeItem(key);
  }
};
