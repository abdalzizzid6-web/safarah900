import { Ad, AdType } from '../types';
import { adsRepositoryV2 } from '../core/repository/AdsRepositoryV2';

class AdService {
  private memCache = new Map<string, { data: any, timestamp: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (Ad space changes very rarely)

  async getAllAds(): Promise<Ad[]> {
    const cacheKey = 'all_ads';
    const now = Date.now();

    const memCached = this.memCache.get(cacheKey);
    if (memCached && now - memCached.timestamp < this.CACHE_TTL) {
      return memCached.data;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const cached = localStorage.getItem('cached_all_ads_v1');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < this.CACHE_TTL) {
          this.memCache.set(cacheKey, { data, timestamp });
          return data;
        }
      } catch (e) {
        // Bad serialization
      }
    }

    const promise = (async () => {
      try {
        const ads = await adsRepositoryV2.getAds();
        localStorage.setItem('cached_all_ads_v1', JSON.stringify({ data: ads, timestamp: now }));
        this.memCache.set(cacheKey, { data: ads, timestamp: now });
        return ads;
      } catch (error) {
        if (cached) return JSON.parse(cached).data;
        return [];
      }
    })();

    this.pendingRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async getActiveAdsBySlot(slot: string): Promise<Ad[]> {
    const cacheKey = `ads_slot_${slot}`;
    const now = Date.now();

    const memCached = this.memCache.get(cacheKey);
    if (memCached && now - memCached.timestamp < this.CACHE_TTL) {
      return memCached.data;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const localKey = `cached_ads_slot_${slot}`;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < this.CACHE_TTL) {
          this.memCache.set(cacheKey, { data, timestamp });
          return data;
        }
      } catch (e) {
        // Bad serialization
      }
    }

    const promise = (async () => {
      try {
        let ads = await adsRepositoryV2.getAdsBySlot(slot);
        
        ads = ads.filter(ad => (ad as any).active === true);
        ads.sort((a, b) => ((b as any).priority ?? 0) - ((a as any).priority ?? 0));
        
        const currentIso = new Date().toISOString();
        ads = ads.filter(ad => {
          if ((ad as any).startDate && (ad as any).startDate !== "" && (ad as any).startDate > currentIso) {
            return false;
          }
          if ((ad as any).endDate && (ad as any).endDate !== "" && (ad as any).endDate < currentIso) {
            return false;
          }
          return true;
        });

        localStorage.setItem(localKey, JSON.stringify({ data: ads, timestamp: now }));
        this.memCache.set(cacheKey, { data: ads, timestamp: now });
        return ads;
      } catch (error) {
        try {
          let ads = await adsRepositoryV2.getAds();
          ads = ads.filter(ad => ad.slot === slot && (ad as any).active === true);
          ads.sort((a, b) => ((b as any).priority ?? 0) - ((a as any).priority ?? 0));
          
          const currentIso = new Date().toISOString();
          ads = ads.filter(ad => {
            if ((ad as any).startDate && (ad as any).startDate !== "" && (ad as any).startDate > currentIso) return false;
            if ((ad as any).endDate && (ad as any).endDate !== "" && (ad as any).endDate < currentIso) return false;
            return true;
          });
          localStorage.setItem(localKey, JSON.stringify({ data: ads, timestamp: now }));
          this.memCache.set(cacheKey, { data: ads, timestamp: now });
          return ads;
        } catch (fallbackError) {
          if (cached) return JSON.parse(cached).data;
          return [];
        }
      }
    })();

    this.pendingRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private clearCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('ads_') || 
          key.startsWith('cached_all_ads') || 
          key.startsWith('cached_ads_slot')
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('[AdService] Error clearing cache:', e);
    }
  }

  async trackView(id: string): Promise<void> {
    const sessionKey = `ad_view_tracked_${id}`;
    // Debounce view logging to once per session to avoid heavy write rates
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      const ad = await adsRepositoryV2.getAd(id);
      if (ad) {
        const curViews = (ad as any).views || 0;
        await adsRepositoryV2.update(id, { views: curViews + 1 } as any);
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (error) {
      console.warn('[AdService] trackView failed:', error);
    }
  }

  async trackClick(id: string): Promise<void> {
    const sessionKey = `ad_click_tracked_${id}`;
    // Allow tracking a click only once per session to avoid click spam/abuse
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      const ad = await adsRepositoryV2.getAd(id);
      if (ad) {
        const curClicks = (ad as any).clicks || 0;
        await adsRepositoryV2.update(id, { clicks: curClicks + 1 } as any);
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (error) {
      console.warn('[AdService] trackClick failed:', error);
    }
  }

  async saveAd(ad: Partial<Ad>): Promise<string> {
    const adId = ad.id || `ad-${Date.now()}`;
    const now = new Date().toISOString();
    
    const adData = {
      ...ad,
      id: adId,
      updatedAt: now,
      createdAt: ad.createdAt || now,
      active: ad.active ?? true,
      priority: (ad as any).priority ?? 0,
    } as Ad;

    await adsRepositoryV2.saveAd(adData);
    this.clearCache();
    return adId;
  }

  async toggleAdStatus(id: string, active: boolean): Promise<void> {
    await adsRepositoryV2.update(id, {
      active,
      updatedAt: new Date().toISOString()
    } as any);
    this.clearCache();
  }

  async deleteAd(id: string): Promise<void> {
    await adsRepositoryV2.deleteAd(id);
    this.clearCache();
  }

  async seedDefaultAds() {
    const seedFlag = 'ads_seeded_v2';
    if (localStorage.getItem(seedFlag)) return;

    try {
      const ads = await this.getAllAds();
      if (ads.length > 0) {
        localStorage.setItem(seedFlag, 'true');
        return;
      }

      const defaultAds: Partial<Ad>[] = [
        {
          title: "إعلان شبكة CPM الفعالة 🚀",
          type: AdType.SCRIPT,
          slot: "HOME_MIDDLE",
          active: true,
          code: '<script src="https://pl29682701.effectivecpmnetwork.com/bf/7c/e5/bf7ce522be3359472cb1dcb85e657a9f.js"></script>',
          priority: 100
        } as any,
        {
          title: "طقم المنتخب ومونديال 2026 الأصلي 👕",
          type: AdType.IMAGE,
          slot: "HOME_TOP",
          active: true,
          imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
          linkUrl: "/advertising",
          priority: 10
        } as any
      ];

      for (const ad of defaultAds) {
        await this.saveAd(ad);
      }
      localStorage.setItem(seedFlag, 'true');
    } catch (e) {
      console.warn('[AdService] Seeding failed:', e);
    }
  }
}

export const adService = new AdService();
