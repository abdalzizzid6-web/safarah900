import { repositories } from '../repository';
import { getCached, setCache, invalidateCache } from '../../utils/cacheUtils';

export interface LeagueSettings {
  id: string;
  leagueId: string;
  name: string;
  country: string;
  logo: string;
  season?: string | number;
  sport?: string;
  provider?: string;
  enabled: boolean;
  featured: boolean;
  order: number;
  sortOrder: number;
  visibleInHome?: boolean;
  visibleInLive?: boolean;
  visibleInSchedule?: boolean;
  visibleInNews?: boolean;
  visibleInLeaguePage?: boolean;
  primaryProviderId?: string;
  maxMatches?: number;
  customName?: string;
  logoUrl?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
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

let memoryCache: Record<string, { data: any; expiresAt: number }> = {};
const STORAGE_PREFIX = "Safara 90_cms_cache_";

export const cmsService = {
  // Leagues Management
  async updateLeagueSettings(leagueId: string, settings: Partial<LeagueSettings>) {
    const payload = { ...settings, id: String(leagueId), updatedAt: new Date().toISOString() };
    await repositories.cms.setById(`league_${leagueId}`, payload);
    invalidateCache('leagues', memoryCache, STORAGE_PREFIX + 'leagues');
  },

  async getLeagueSettingsList(): Promise<LeagueSettings[]> {
    const cached = getCached<LeagueSettings[]>('leagues', memoryCache, STORAGE_PREFIX + 'leagues');
    if (cached) return cached;

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
      console.warn("[cmsService] Channels.json cache fetch failed:", err);
    }

    try {
      const all = await repositories.cms.getAll();
      const list = all.filter((d: any) => d.id?.startsWith('league_') || d.leagueId) as LeagueSettings[];
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCache('leagues', list, memoryCache, STORAGE_PREFIX + 'leagues');
      return list;
    } catch (e) {
      console.warn("Error reading leagues settings:", e);
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
    return list.filter(l => l.enabled !== false);
  },

  async setMatchOverride(matchId: string, override: { hidden?: boolean; pinned?: boolean; serverPriority?: any }) {
    const payload = { ...override, id: String(matchId), updatedAt: new Date().toISOString() };
    await repositories.cms.setById(`match_override_${matchId}`, payload);
    invalidateCache('matches', memoryCache, STORAGE_PREFIX + 'matches');
  },
  
  async getMatchOverrides(): Promise<Record<string, { id: string; hidden?: boolean; pinned?: boolean; serverPriority?: any }>> {
    const cached = getCached<Record<string, any>>('matches', memoryCache, STORAGE_PREFIX + 'matches');
    if (cached) return cached;

    try {
      const all = await repositories.cms.getAll();
      const overrides: Record<string, any> = {};
      all.filter((d: any) => d.id?.startsWith('match_override_')).forEach((docDoc: any) => {
        const cleanId = docDoc.id.replace('match_override_', '');
        overrides[cleanId] = { id: cleanId, ...docDoc };
      });
      setCache('matches', overrides, memoryCache, STORAGE_PREFIX + 'matches');
      return overrides;
    } catch (e: any) {
      console.warn("Error fetching match overrides:", e);
      const stale = getCached<Record<string, any>>('matches', memoryCache, STORAGE_PREFIX + 'matches', true);
      if (stale) return stale;
      return {};
    }
  },

  // Teams Management
  async updateTeamSettings(teamId: string, settings: Partial<TeamSettings>) {
    const payload = { ...settings, id: String(teamId), updatedAt: new Date().toISOString() };
    await repositories.cms.setById(`team_${teamId}`, payload);
    invalidateCache('teams', memoryCache, STORAGE_PREFIX + 'teams');
  },

  async getTeamSettingsList(): Promise<TeamSettings[]> {
    const cached = getCached<TeamSettings[]>('teams', memoryCache, STORAGE_PREFIX + 'teams');
    if (cached) return cached;

    try {
      const all = await repositories.cms.getAll();
      const list = all.filter((d: any) => d.id?.startsWith('team_')) as TeamSettings[];
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCache('teams', list, memoryCache, STORAGE_PREFIX + 'teams');
      return list;
    } catch (e) {
      console.warn("Error reading teams settings:", e);
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

  // Channel Servers
  async updateChannelServer(serverId: string, settings: Partial<ChannelServerSettings>) {
    const payload = { ...settings, id: String(serverId), updatedAt: new Date().toISOString() };
    await repositories.cms.setById(`channel_server_${serverId}`, payload);
    invalidateCache('channels', memoryCache, STORAGE_PREFIX + 'channels');
  },

  async updateChannelServerSettings(serverId: string, settings: Partial<ChannelServerSettings>) {
    return this.updateChannelServer(serverId, settings);
  },

  async deleteChannelServer(serverId: string) {
    await repositories.cms.delete(serverId);
    invalidateCache('channels', memoryCache, STORAGE_PREFIX + 'channels');
  },

  async deleteChannelServerSettings(serverId: string) {
    return this.deleteChannelServer(serverId);
  },

  async getChannelServersList(): Promise<ChannelServerSettings[]> {
    const cached = getCached<ChannelServerSettings[]>('channels', memoryCache, STORAGE_PREFIX + 'channels');
    if (cached) return cached;

    try {
      const all = await repositories.cms.getAll();
      const list = all.filter((d: any) => d.id?.startsWith('channel_server_')) as ChannelServerSettings[];
      list.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      setCache('channels', list, memoryCache, STORAGE_PREFIX + 'channels');
      return list;
    } catch (e) {
      console.warn("Error reading channel servers:", e);
      const stale = getCached<ChannelServerSettings[]>('channels', memoryCache, STORAGE_PREFIX + 'channels', true);
      if (stale) return stale;
      return [];
    }
  },

  async getChannelServerSettingsList(): Promise<ChannelServerSettings[]> {
    return this.getChannelServersList();
  },

  // Global Config
  async saveHomepageConfig(config: HomepageConfig) {
    await repositories.cms.setById('homepage_config', { ...config, updatedAt: new Date().toISOString() });
    invalidateCache('homepage_config', memoryCache, STORAGE_PREFIX + 'homepage_config');
  },

  async updateHomepageConfig(config: HomepageConfig) {
    return this.saveHomepageConfig(config);
  },

  async getHomepageConfig(): Promise<HomepageConfig> {
    const cached = getCached<HomepageConfig>('homepage_config', memoryCache, STORAGE_PREFIX + 'homepage_config');
    if (cached) return cached;

    try {
      const docSnap = await repositories.cms.getById('homepage_config');
      if (docSnap) {
        setCache('homepage_config', docSnap as HomepageConfig, memoryCache, STORAGE_PREFIX + 'homepage_config');
        return docSnap as HomepageConfig;
      }
    } catch (e) {
      console.warn("Error reading homepage config:", e);
    }

    return {
      featuredLeagues: [],
      featuredMatches: [],
      featuredTeams: []
    };
  }
};
