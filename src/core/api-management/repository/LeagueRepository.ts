
import { BaseRepository } from '../../repository/BaseRepository';
import { LeagueSettings } from '../../../types';
import { ILeagueRepository } from '../contracts/ILeagueRepository';
import { CacheLayer } from '../cache/CacheLayer';

export class LeagueRepository extends BaseRepository<LeagueSettings> implements ILeagueRepository {
  constructor() {
    super('cms_leagues');
  }

  async getLeagues(): Promise<LeagueSettings[]> {
    const cached = CacheLayer.get('leagues');
    if (cached) return cached;

    const leagues = await this.getAll(500);
    CacheLayer.set('leagues', leagues, 300); // 5 min TTL
    return leagues;
  }

  async getLeaguesMap(): Promise<Record<string, LeagueSettings>> {
    const list = await this.getLeagues();
    const map: Record<string, LeagueSettings> = {};
    list.forEach(l => { map[l.id] = l; });
    return map;
  }

  async getLeagueById(id: string): Promise<LeagueSettings | null> {
    const leagues = await this.getLeagues();
    return leagues.find(l => l.id === id) || null;
  }

  async createLeague(league: LeagueSettings): Promise<void> {
    await this.setById(league.id, league);
    CacheLayer.invalidate('leagues');
  }

  async updateLeague(league: LeagueSettings): Promise<void> {
    await this.setById(league.id, league);
    CacheLayer.invalidate('leagues');
  }

  async deleteLeague(id: string): Promise<void> {
    await this.delete(id);
    CacheLayer.invalidate('leagues');
  }

  async enableLeague(id: string, enabled: boolean): Promise<void> {
    await this.update(id, { enabled });
    CacheLayer.invalidate('leagues');
  }

  async setVisibleInHome(id: string, visible: boolean): Promise<void> {
    await this.update(id, { visibleInHome: visible });
    CacheLayer.invalidate('leagues');
  }

  async setVisibleInLive(id: string, visible: boolean): Promise<void> {
    await this.update(id, { visibleInLive: visible });
    CacheLayer.invalidate('leagues');
  }

  async setVisibleInSchedule(id: string, visible: boolean): Promise<void> {
    await this.update(id, { visibleInSchedule: visible });
    CacheLayer.invalidate('leagues');
  }

  async setVisibleInNews(id: string, visible: boolean): Promise<void> {
    await this.update(id, { visibleInNews: visible });
    CacheLayer.invalidate('leagues');
  }

  async updateOrder(id: string, order: number): Promise<void> {
    await this.update(id, { order });
    CacheLayer.invalidate('leagues');
  }
}
