
import { BaseRepository } from '../../repository/BaseRepository';
import { ITeam } from '../models/team.model';
import { ITeamRepository } from '../contracts/ITeamRepository';
import { CacheLayer } from '../cache/CacheLayer';

export class TeamRepository extends BaseRepository<ITeam> implements ITeamRepository {
  constructor() {
    super('cms_teams');
  }

  async getTeams(): Promise<ITeam[]> {
    const cached = CacheLayer.get<ITeam[]>('teams');
    if (cached) return cached;

    const teams = await this.getAll(1000);
    CacheLayer.set('teams', teams, 300); // 5 min TTL
    return teams;
  }

  async getTeamById(id: string): Promise<ITeam | null> {
    const teams = await this.getTeams();
    return teams.find(t => t.id === id) || null;
  }

  async createTeam(team: ITeam): Promise<void> {
    await this.setById(team.id, team);
    CacheLayer.invalidate('teams');
  }

  async updateTeam(team: ITeam): Promise<void> {
    await this.setById(team.id, team);
    CacheLayer.invalidate('teams');
  }

  async deleteTeam(id: string): Promise<void> {
    await this.delete(id);
    CacheLayer.invalidate('teams');
  }

  async toggleTeamEnabled(id: string, enabled: boolean): Promise<void> {
    await this.update(id, { enabled });
    CacheLayer.invalidate('teams');
  }

  async setTeamFeatured(id: string, featured: boolean): Promise<void> {
    await this.update(id, { featured });
    CacheLayer.invalidate('teams');
  }

  async setTeamFavorite(id: string, favorite: boolean): Promise<void> {
    await this.update(id, { favorite });
    CacheLayer.invalidate('teams');
  }

  async setTeamHidden(id: string, hidden: boolean): Promise<void> {
    await this.update(id, { hidden });
    CacheLayer.invalidate('teams');
  }

  async updateOrder(id: string, order: number): Promise<void> {
    await this.update(id, { order });
    CacheLayer.invalidate('teams');
  }
}
