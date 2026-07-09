import { BaseRepository } from './BaseRepository';
import { telemetry } from '../monitoring/telemetry';
import { db } from '../../firebase';
import { doc, setDoc, getDoc, collection, query, orderBy, getDocs, where, deleteDoc, limit } from 'firebase/firestore';
import cacheManager from '../api/cacheManager';
import { 
  LeagueSettings, 
  TeamSettings, 
  ChannelServerSettings, 
  HomepageConfig,
  HomepageBlock 
} from '../../types';
import { apiManagementRepository } from '../api-management';

const CACHE_TTL = 5 * 60 * 1000;

export class CmsRepositoryV2 extends BaseRepository<any> {
  constructor() {
    super('cms_config');
  }

  // Leagues Management
  async getLeagues(): Promise<LeagueSettings[]> {
    telemetry.logApiCall('CmsRepositoryV2.getLeagues');
    return apiManagementRepository.leagueRepository.getLeagues();
  }

  async getLeaguesMap(): Promise<Record<string, LeagueSettings>> {
    return apiManagementRepository.leagueRepository.getLeaguesMap();
  }

  async updateLeague(id: string, settings: Partial<LeagueSettings>) {
    telemetry.logApiCall('CmsRepositoryV2.updateLeague');
    const existing = await apiManagementRepository.leagueRepository.getLeagueById(id);
    if (!existing) throw new Error('League not found');
    await apiManagementRepository.leagueRepository.updateLeague({ ...existing, ...settings, id: String(id) } as any);
  }

  // Teams Management
  async getTeams(): Promise<TeamSettings[]> {
    telemetry.logApiCall('CmsRepositoryV2.getTeams');
    try {
      const cacheKey = 'cms_teams';
      const cached = cacheManager.get(cacheKey);
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
      }

      const snap = await getDocs(query(collection(db, 'cms_teams'), limit(100)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamSettings));
      const sorted = list.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      cacheManager.set(cacheKey, { data: sorted, timestamp: Date.now() }, CACHE_TTL, false);
      return sorted;
    } catch (e) {
      telemetry.logError('CMS_GET_TEAMS_FAILURE', e);
      throw e;
    }
  }

  async getTeamsMap(): Promise<Record<string, TeamSettings>> {
    const list = await this.getTeams();
    const map: Record<string, TeamSettings> = {};
    list.forEach(t => { map[t.id] = t; });
    return map;
  }

  async updateTeam(id: string, settings: Partial<TeamSettings>) {
    telemetry.logApiCall('CmsRepositoryV2.updateTeam');
    try {
      const payload = { ...settings, id: String(id), updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'cms_teams', String(id)), payload, { merge: true });
    } catch (e) {
      telemetry.logError('CMS_UPDATE_TEAM_FAILURE', e);
      throw e;
    }
  }

  // Channels Management
  async getChannels(): Promise<ChannelServerSettings[]> {
    telemetry.logApiCall('CmsRepositoryV2.getChannels');
    try {
      const cacheKey = 'cms_channels';
      const cached = cacheManager.get(cacheKey);
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
      }

      const snap = await getDocs(query(collection(db, 'cms_channels_servers'), limit(100)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChannelServerSettings));
      const sorted = list.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      
      cacheManager.set(cacheKey, { data: sorted, timestamp: Date.now() }, CACHE_TTL, false);
      return sorted;
    } catch (e) {
      telemetry.logError('CMS_GET_CHANNELS_FAILURE', e);
      throw e;
    }
  }

  async updateChannel(id: string, settings: Partial<ChannelServerSettings>) {
    telemetry.logApiCall('CmsRepositoryV2.updateChannel');
    try {
      const payload = { ...settings, id: String(id), updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'cms_channels_servers', String(id)), payload, { merge: true });
    } catch (e) {
      telemetry.logError('CMS_UPDATE_CHANNEL_FAILURE', e);
      throw e;
    }
  }
  
  async deleteChannel(id: string) {
    telemetry.logApiCall('CmsRepositoryV2.deleteChannel');
    try {
      const docRef = doc(db, 'cms_channels_servers', id);
      await deleteDoc(docRef);
    } catch (e) {
      telemetry.logError('CMS_DELETE_CHANNEL_FAILURE', e);
      throw e;
    }
  }

  // Homepage Config
  async getHomepageConfig(): Promise<HomepageConfig> {
    telemetry.logApiCall('CmsRepositoryV2.getHomepageConfig');
    try {
      const docSnap = await getDoc(doc(db, 'cms_config', 'homepage'));
      const data = docSnap.exists() ? docSnap.data() : {};
      return {
        featuredLeagues: data.featuredLeagues || [],
        featuredMatches: data.featuredMatches || [],
        featuredTeams: data.featuredTeams || [],
      };
    } catch (e) {
      telemetry.logError('CMS_GET_HOMEPAGE_CONFIG_FAILURE', e);
      throw e;
    }
  }
  
  async updateHomepageConfig(config: Partial<HomepageConfig>) {
    telemetry.logApiCall('CmsRepositoryV2.updateHomepageConfig');
    try {
      const payload = { ...config, id: 'homepage', updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'cms_config', 'homepage'), payload, { merge: true });
    } catch (e) {
      telemetry.logError('CMS_UPDATE_HOMEPAGE_CONFIG_FAILURE', e);
      throw e;
    }
  }

  // Homepage Blocks (Layout Builder)
  async getHomepageBlocks(): Promise<HomepageBlock[]> {
    telemetry.logApiCall('CmsRepositoryV2.getHomepageBlocks');
    try {
      const cacheKey = 'cms_homepage_blocks';
      const cached = cacheManager.get(cacheKey);
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.data;
      }

      const q = query(
        collection(db, 'homepage_blocks'),
        orderBy('displayOrder', 'asc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HomepageBlock));
      
      cacheManager.set(cacheKey, { data: list, timestamp: Date.now() }, CACHE_TTL, false);
      return list;
    } catch (e) {
      telemetry.logError('CMS_GET_HOMEPAGE_BLOCKS_FAILURE', e);
      console.warn('[CmsRepositoryV2] Firestore layout failed or quota exceeded. Returning static layout fallback.');
      
      const defaultBlocks: HomepageBlock[] = [
        {
          id: 'default_hero',
          type: 'HERO' as any,
          title: 'المباراة البارزة',
          displayOrder: 1,
          enabled: true,
          dataConfig: {}
        },
        {
          id: 'default_live',
          type: 'LIVE_MATCHES' as any,
          title: 'مباريات مباشرة',
          displayOrder: 2,
          enabled: true,
          dataConfig: { maxItems: 3 }
        },
        {
          id: 'default_bento',
          type: 'BENTO_ACTIONS' as any,
          title: 'قصص ومقاطع',
          displayOrder: 3,
          enabled: true,
          dataConfig: {}
        },
        {
          id: 'default_today',
          type: 'TODAY_MATCHES' as any,
          title: 'مباريات اليوم',
          displayOrder: 4,
          enabled: true,
          dataConfig: { maxItems: 6 }
        },
        {
          id: 'default_tomorrow',
          type: 'TOMORROW_MATCHES' as any,
          title: 'مباريات الغد',
          displayOrder: 5,
          enabled: true,
          dataConfig: { maxItems: 4 }
        },
        {
          id: 'default_news',
          type: 'LATEST_NEWS' as any,
          title: 'آخر الأخبار الرياضية',
          displayOrder: 6,
          enabled: true,
          dataConfig: { maxItems: 6 }
        },
        {
          id: 'default_leagues',
          type: 'LEAGUES' as any,
          title: 'البطولات الشهيرة',
          displayOrder: 7,
          enabled: true,
          dataConfig: {}
        },
        {
          id: 'default_top_players',
          type: 'TOP_PLAYERS' as any,
          title: 'أفضل اللاعبين',
          displayOrder: 8,
          enabled: true,
          dataConfig: {}
        }
      ] as unknown as HomepageBlock[];
      return defaultBlocks;
    }
  }

  async updateHomepageBlock(id: string, block: Partial<HomepageBlock>) {
    telemetry.logApiCall('CmsRepositoryV2.updateHomepageBlock');
    try {
      const payload = { ...block, id, updatedAt: new Date().toISOString() };
      await setDoc(doc(db, 'homepage_blocks', id), payload, { merge: true });
    } catch (e) {
      telemetry.logError('CMS_UPDATE_HOMEPAGE_BLOCK_FAILURE', e);
      throw e;
    }
  }

  async deleteHomepageBlock(id: string) {
    telemetry.logApiCall('CmsRepositoryV2.deleteHomepageBlock');
    try {
      await deleteDoc(doc(db, 'homepage_blocks', id));
    } catch (e) {
      telemetry.logError('CMS_DELETE_HOMEPAGE_BLOCK_FAILURE', e);
      throw e;
    }
  }
}

export const cmsRepositoryV2 = new CmsRepositoryV2();
