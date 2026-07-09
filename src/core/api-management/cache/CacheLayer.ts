
export class CacheLayer {
  private static PREFIX = 'safara_cache_';

  static get<T>(key: string): T | null {
    try {
      const cached = sessionStorage.getItem(this.PREFIX + key);
      if (!cached) return null;

      const { value, expiresAt } = JSON.parse(cached);
      if (Date.now() > expiresAt) {
        sessionStorage.removeItem(this.PREFIX + key);
        return null;
      }
      return value as T;
    } catch (e) {
      return null;
    }
  }

  static set(key: string, value: any, ttlMinutes: number = 5) {
    try {
      const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
      sessionStorage.setItem(this.PREFIX + key, JSON.stringify({ value, expiresAt }));
    } catch (e) {
      // Handle quota exceeded in sessionStorage if necessary
    }
  }

  static invalidate(key: string) {
    sessionStorage.removeItem(this.PREFIX + key);
  }

  static clear() {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}
