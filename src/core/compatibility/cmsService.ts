import { db } from '../../firebase';
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, limit } from 'firebase/firestore';
import { getCached, setCache, invalidateCache } from '../../utils/cacheUtils';
// (No import of localDbFallback)

export interface LeagueSettings {
  id: string;
  enabled: boolean;
  featured: boolean;
  order: number;
  customName?: string;
  logoUrl?: string;
  color?: string;
}

export interface TeamSettings {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
  featured: boolean;
  order: number;
}

export interface ChannelServerSettings {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  assignedLeagueIds: string[];
  assignedMatchIds: string[];
  geoRestrictions?: string[];
  autoFailover?: boolean;
}

export interface HomepageConfig {
  featuredLeagues: string[];
  featuredMatches: string[];
  featuredTeams: string[];
}

// Low-overhead Memory and Local Cache to optimize Firestore reads (Firebase Free Plan)
let memoryCache: Record<string, { data: any; expiresAt: number }> = {};
const STORAGE_PREFIX = "Safara 90_cms_cache_";

export const cmsService = {
  // Leagues Management
  async updateLeagueSettings(leagueId: string, settings: Partial<LeagueSettings>) {
    const payload = { ...settings, id: String(leagueId), updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'cms_leagues', String(leagueId)), payload, { merge: true });
    // invalidate cache
    invalidateCache('leagues', memoryCache, STORAGE_PREFIX + 'leagues');
  },

  async getLeagueSettingsList(): Promise<LeagueSettings[]> {
    const cached = getCached<LeagueSettings[]>('leagues', memoryCache, STORAGE_PREFIX + 'leagues');
    if (cached) return cached;

    // 0. Try channels.json cache first for absolute read minimization
    try {
      const response = await fetch('/channels.json');
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list) && list.length > 0) {
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCache('leagues', list, memoryCache, STORAGE_PREFIX + 'leagues');
          return list;
        }
      }
    } catch (err) {
      console.warn("[cmsService] Channels.json cache fetch failed, querying Firestore fallback:", err);
    }

    try {
      const snap = await getDocs(collection(db, 'cms_leagues'));
      const list = snap.docs.map(docDoc => ({ id: docDoc.id, ...docDoc.data() } as LeagueSettings));
      // sort by order, then name
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCache('leagues', list, memoryCache, STORAGE_PREFIX + 'leagues');
      return list;
    } catch (e) {
      console.warn("Error reading leagues settings (e.g. Quota/Connection), falling back to cached or mock settings:", e);
      const stale = getCached<LeagueSettings[]>('leagues', memoryCache, STORAGE_PREFIX + 'leagues', true);
      if (stale) return stale;
      return [];
    }
  },

  async getLeagueSettingsMap(): Promise<Record<string, LeagueSettings>> {
    const list = await this.getLeagueSettingsList();
    const map: Record<string, LeagueSettings> = {};
    list.forEach(item => {
      map[String(item.id)] = item;
    });
    return map;
  },

  async getEnabledLeagues(): Promise<LeagueSettings[]> {
    const list = await this.getLeagueSettingsList();
    return list.filter(l => l.enabled !== false); // default to true if not explicitly disabled or check value
  },

  async setMatchOverride(matchId: string, override: { hidden?: boolean; pinned?: boolean; serverPriority?: any }) {
    const payload = { ...override, id: String(matchId), updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'cms_match_overrides', String(matchId)), payload, { merge: true });
    // invalidate matches cache
    invalidateCache('matches', memoryCache, STORAGE_PREFIX + 'matches');
  },
  
  async getMatchOverrides(): Promise<Record<string, { id: string; hidden?: boolean; pinned?: boolean; serverPriority?: any }>> {
    const cached = getCached<Record<string, any>>('matches', memoryCache, STORAGE_PREFIX + 'matches');
    if (cached) return cached;

    try {
      const snap = await getDocs(collection(db, 'cms_match_overrides'));
      const overrides: Record<string, any> = {};
      snap.docs.forEach(docDoc => {
        overrides[docDoc.id] = { id: docDoc.id, ...docDoc.data() };
      });
      setCache('matches', overrides, memoryCache, STORAGE_PREFIX + 'matches');
      return overrides;
    } catch (e: any) {
      if (e?.code === 8 || e?.message?.includes('RESOURCE_EXHAUSTED') || e?.message?.includes('Quota')) {
        console.warn("Firestore quota exceeded or exhausted for match overrides, using fallback.");
      } else {
        console.error("Error fetching match overrides, falling back to cached stale database:", e);
      }
      const stale = getCached<Record<string, any>>('matches', memoryCache, STORAGE_PREFIX + 'matches', true);
      if (stale) return stale;
      return {};
    }
  },

  // Teams Management
  async updateTeamSettings(teamId: string, settings: Partial<TeamSettings>) {
    const payload = { ...settings, id: String(teamId), updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'cms_teams', String(teamId)), payload, { merge: true });
    // invalidate cache
    invalidateCache('teams', memoryCache, STORAGE_PREFIX + 'teams');
  },

  async getTeamSettingsList(): Promise<TeamSettings[]> {
    const cached = getCached<TeamSettings[]>('teams', memoryCache, STORAGE_PREFIX + 'teams');
    if (cached) return cached;

    try {
      const snap = await getDocs(collection(db, 'cms_teams'));
      const list = snap.docs.map(docDoc => ({ id: docDoc.id, ...docDoc.data() } as TeamSettings));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCache('teams', list, memoryCache, STORAGE_PREFIX + 'teams');
      return list;
    } catch (e) {
      console.warn("Error reading teams settings, falling back to cached or mock teams:", e);
      const stale = getCached<TeamSettings[]>('teams', memoryCache, STORAGE_PREFIX + 'teams', true);
      if (stale) return stale;
      return [];
    }
  },

  async getTeamSettingsMap(): Promise<Record<string, TeamSettings>> {
    const list = await this.getTeamSettingsList();
    const map: Record<string, TeamSettings> = {};
    list.forEach(item => {
      map[String(item.id)] = item;
    });
    return map;
  },

  // Channels & Servers Management
  async updateChannelServerSettings(id: string, settings: Partial<ChannelServerSettings>) {
    const payload = { ...settings, id: String(id), updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'cms_channels_servers', String(id)), payload, { merge: true });
    // invalidate
    delete memoryCache['channels'];
    localStorage.removeItem('Safara 90_cms_cache_channels');
  },

  async deleteChannelServerSettings(id: string) {
    await deleteDoc(doc(db, 'cms_channels_servers', String(id)));
    delete memoryCache['channels'];
    localStorage.removeItem('Safara 90_cms_cache_channels');
  },

  async getChannelServerSettingsList(): Promise<ChannelServerSettings[]> {
    const cached = getCached<ChannelServerSettings[]>('channels', memoryCache, STORAGE_PREFIX + 'channels');
    if (cached) return cached;

    // 0. Try servers.json cache first for absolute read minimization
    try {
      const response = await fetch('/servers.json');
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list) && list.length > 0) {
          list.sort((a, b) => (a.priority || 0) - (b.priority || 0));
          setCache('channels', list, memoryCache, STORAGE_PREFIX + 'channels');
          return list;
        }
      }
    } catch (err) {
      console.warn("[cmsService] Servers.json cache fetch failed, querying Firestore fallback:", err);
    }

    try {
      const snap = await getDocs(collection(db, 'cms_channels_servers'));
      const list = snap.docs.map(docDoc => ({ id: docDoc.id, ...docDoc.data() } as ChannelServerSettings));
      list.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      setCache('channels', list, memoryCache, STORAGE_PREFIX + 'channels');
      return list;
    } catch (e) {
      console.warn("Error reading channel settings, falling back to cached or mock channels:", e);
      const stale = getCached<ChannelServerSettings[]>('channels', memoryCache, STORAGE_PREFIX + 'channels', true);
      if (stale) return stale;
      return [];
    }
  },

  // Homepage Control
  async getHomepageConfig(): Promise<HomepageConfig> {
    const cached = getCached<HomepageConfig>('homepage', memoryCache, STORAGE_PREFIX + 'homepage');
    if (cached) return cached;

    try {
      const docSnap = await getDoc(doc(db, 'cms_config', 'homepage'));
      const dataDoc = docSnap.exists() ? docSnap.data() : {};
      const config: HomepageConfig = {
        featuredLeagues: dataDoc.featuredLeagues || [],
        featuredMatches: dataDoc.featuredMatches || [],
        featuredTeams: dataDoc.featuredTeams || [],
      };
      setCache('homepage', config, memoryCache, STORAGE_PREFIX + 'homepage');
      return config;
    } catch (e) {
      console.warn("Error loading homepage config, falling back to cached or mock configuration:", e);
      const stale = getCached<HomepageConfig>('homepage', memoryCache, STORAGE_PREFIX + 'homepage', true);
      if (stale) return stale;
      return { featuredLeagues: [], featuredMatches: [], featuredTeams: [] };
    }
  },

  async updateHomepageConfig(config: Partial<HomepageConfig>) {
    const payload = { ...config, id: 'homepage', updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'cms_config', 'homepage'), payload, { merge: true });
    invalidateCache('homepage', memoryCache, STORAGE_PREFIX + 'homepage');
  }
};
