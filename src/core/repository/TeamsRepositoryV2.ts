import { BaseRepository } from './BaseRepository';
import { Team } from '../../types';

export class TeamsRepositoryV2 extends BaseRepository<Team> {
  constructor() {
    super('teams');
  }

  async getTeams(): Promise<Team[]> {
    return await this.getAll();
  }

  async getTeam(id: string): Promise<Team | null> {
    return await this.getById(id);
  }

  async saveTeam(team: Team): Promise<void> {
    if (!team.id) throw new Error('Team ID is required for saving');
    await this.setById(String(team.id), team);
  }

  async deleteTeam(id: string): Promise<void> {
    await this.delete(id);
  }
}

export const teamsRepositoryV2 = new TeamsRepositoryV2();
