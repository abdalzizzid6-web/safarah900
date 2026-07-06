const memoryCache: Record<string, any> = {};

export default {
  get(key: string) {
    if (memoryCache[key] !== undefined) {
      return memoryCache[key];
    }
    const val = localStorage.getItem(key);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        memoryCache[key] = parsed;
        return parsed;
      } catch (e) {
        return val;
      }
    }
    return null;
  },
  set(key: string, value: any, useStorage = false) {
    memoryCache[key] = value;
    if (useStorage) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
};
