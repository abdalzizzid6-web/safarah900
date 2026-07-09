import { League } from '../types';
import { cmsService } from './cmsService';
import { getCached, setCache } from '../utils/cacheUtils';
import { apiManagementRepository } from '../core/api-management';

// Core popular leagues IDs to enable on first startup/bootstrap if cms settings don't exist yet
const CORE_DEFAULT_LEAGUE_IDS = ['307', '39', '140', '2', '135', '78', '61'];

const memoryCache: Record<string, { data: any; expiresAt: number }> = {};
const STORAGE_PREFIX = "Safara 90_league_cache_";
const pendingRequests = new Map<string, Promise<any>>();

export const leagueService = {
  /**
   * Get all active, enabled leagues from internal mock database, applying CMS overrides (name, logo, order, visibility, featured)
   */
  async getLeagues(context?: 'home' | 'live' | 'schedule'): Promise<League[]> {
    const cacheKey = context ? `all_leagues_${context}` : 'all_leagues';
    const cached = getCached<League[]>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const promise = (async () => {
      // Load from Repository
      let customLeagues: League[] = [];
      try {
        customLeagues = await apiManagementRepository.leagueRepository.getLeagues() as any;
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
              name: setting.customName ? setting.customName.trim() : (setting.name ? setting.name.trim() : l.name),
              logo: setting.logoUrl ? setting.logoUrl.trim() : (setting.logo ? setting.logo.trim() : l.logo),
              enabled: setting.enabled !== false,
              featured: setting.featured === true,
              order: setting.order ?? setting.sortOrder ?? 0,
              visibleInHome: setting.visibleInHome !== false,
              visibleInLive: setting.visibleInLive !== false,
              visibleInSchedule: setting.visibleInSchedule !== false
            };
          } else {
            // If no custom setting entry exists, default to true for core default leagues, else false to prevent cluttering
            const isDefaultEnabled = CORE_DEFAULT_LEAGUE_IDS.includes(leagueId);
            return {
              ...l,
              enabled: isDefaultEnabled,
              featured: false,
              order: 999,
              visibleInHome: true,
              visibleInLive: true,
              visibleInSchedule: true
            };
          }
        });

        // Filter only enabled leagues and respect context
        let enabledLeagues = processed.filter(l => (l as any).enabled);

        if (context === 'home') {
          enabledLeagues = enabledLeagues.filter(l => (l as any).visibleInHome !== false);
        } else if (context === 'live') {
          enabledLeagues = enabledLeagues.filter(l => (l as any).visibleInLive !== false);
        } else if (context === 'schedule') {
          enabledLeagues = enabledLeagues.filter(l => (l as any).visibleInSchedule !== false);
        }

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
      return await apiManagementRepository.leagueRepository.getLeagues() as any;
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
        found = await apiManagementRepository.leagueRepository.getLeagueById(apiId) as any;
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
      await apiManagementRepository.leagueRepository.createLeague(league as any);
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
      await apiManagementRepository.leagueRepository.deleteLeague(id);
      delete memoryCache['all_leagues'];
      delete memoryCache[`league_details_${id}`];
    } catch(e) {
      console.error("Error deleting custom league:", e);
      throw e;
    }
  }
};

