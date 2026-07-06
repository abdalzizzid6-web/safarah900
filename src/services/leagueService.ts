import { League } from '../types';
import { cmsService } from './cmsService';
import { getCached, setCache } from '../utils/cacheUtils';
import { leaguesRepositoryV2 } from '../core/repository/LeaguesRepositoryV2';

// Core popular leagues IDs to enable on first startup/bootstrap if cms settings don't exist yet
const CORE_DEFAULT_LEAGUE_IDS = ['307', '39', '140', '2', '135', '78', '61'];

const memoryCache: Record<string, { data: any; expiresAt: number }> = {};
const STORAGE_PREFIX = "Safara 90_league_cache_";
const pendingRequests = new Map<string, Promise<any>>();

export const leagueService = {
  /**
   * Get all active, enabled leagues from internal mock database, applying CMS overrides (name, logo, order, visibility, featured)
   */
  async getLeagues(): Promise<League[]> {
    const cacheKey = 'all_leagues';
    const cached = getCached<League[]>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const promise = (async () => {
      // Load from Repository
      let customLeagues: League[] = [];
      try {
        customLeagues = await leaguesRepositoryV2.getLeagues();
      } catch (err) {
        console.error("Error loading custom leagues from repository:", err);
      }

      let rawLeagues: League[] = [...customLeagues];

      // Apply CMS Settings & filter out hidden ones
      try {
        const settingsMap = await cmsService.getLeagueSettingsMap();

        const processed = rawLeagues.map(l => {
          const leagueId = String(l.id || l.apiLeagueId || '');
          const setting = settingsMap[leagueId];

          if (setting) {
            return {
              ...l,
              name: setting.customName ? setting.customName.trim() : l.name,
              logo: setting.logoUrl ? setting.logoUrl.trim() : l.logo,
              enabled: setting.enabled !== false,
              featured: setting.featured === true,
              order: setting.order ?? 0
            };
          } else {
            // If no custom setting entry exists, default to true for core default leagues, else false to prevent cluttering
            const isDefaultEnabled = CORE_DEFAULT_LEAGUE_IDS.includes(leagueId);
            return {
              ...l,
              enabled: isDefaultEnabled,
              featured: false,
              order: 999
            };
          }
        });

        // Filter only enabled leagues
        const enabledLeagues = processed.filter(l => (l as any).enabled);

        // Sorted: Featured goes on top, then sort by custom order, then alphabetically
        return enabledLeagues.sort((a: any, b: any) => {
          // Featured first
          if (a.featured !== b.featured) {
            return a.featured ? -1 : 1;
          }
          // Custom order next
          if (a.order !== b.order) {
            return (a.order || 0) - (b.order || 0);
          }
          // Alphabetical sort as tie-breaker
          return a.name.localeCompare(b.name, 'ar');
        });
      } catch (cmsErr) {
        return rawLeagues;
      }
    })();

    pendingRequests.set(cacheKey, promise);
    try {
      const data = await promise;
      setCache(cacheKey, data, memoryCache, STORAGE_PREFIX + cacheKey);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  },

  /**
   * Raw fetch from Firestore, used in CMS panel to display the complete searchable league directory
   */
  async getRawLeaguesFromApi(): Promise<League[]> {
    try {
      return await leaguesRepositoryV2.getLeagues();
    } catch (err) {
      console.error("Error loading custom leagues:", err);
      return [];
    }
  },

  /**
   * Keep backgroundSyncWithFirebase signature as dummy for backwards compatibility, but do not write any data to Firestore.
   */
  async backgroundSyncWithFirebase(_leagues: League[]) {
    return Promise.resolve();
  },

  /**
   * Get specific league details from Firestore
   */
  async getLeagueDetails(id: string | number): Promise<League> {
    const apiId = String(id).replace('apf-', '').trim();
    const cacheKey = `league_details_${apiId}`;

    const cached = getCached<League>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const promise = (async () => {
      let found: League | null = null;
      
      try {
        found = await leaguesRepositoryV2.getLeague(apiId);
      } catch (err) {
        console.error("Error fetching league from repository:", err);
      }
      
      if (found) {
        const copy = { ...found };
        // Apply custom settings if available
        try {
          const settingsMap = await cmsService.getLeagueSettingsMap();
          const setting = settingsMap[String(copy.id)];
          if (setting) {
            if (setting.customName) copy.name = setting.customName;
            if (setting.logoUrl) copy.logo = setting.logoUrl;
          }
        } catch (e) {
          // Ignore settings error
        }
        return copy;
      }
      
      throw new Error(`LEAGUE_NOT_FOUND: لم يتم العثور على الدوري بالرمز: ${apiId}`);
    })();

    pendingRequests.set(cacheKey, promise);
    try {
      const data = await promise;
      setCache(cacheKey, data, memoryCache, STORAGE_PREFIX + cacheKey);
      return data;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  },

  async saveCustomLeague(league: League): Promise<void> {
    try {
      await leaguesRepositoryV2.saveLeague(league);
      // Clear caches
      Object.keys(memoryCache).forEach(k => {
        if (k.startsWith('league_') || k === 'all_leagues') delete memoryCache[k];
      });
    } catch (e) {
      console.error("Error saving custom league:", e);
      throw e;
    }
  },
  
  async deleteCustomLeague(id: string): Promise<void> {
    try {
      await leaguesRepositoryV2.deleteLeague(id);
      delete memoryCache['all_leagues'];
      delete memoryCache[`league_details_${id}`];
    } catch(e) {
      console.error("Error deleting custom league:", e);
      throw e;
    }
  }
};

