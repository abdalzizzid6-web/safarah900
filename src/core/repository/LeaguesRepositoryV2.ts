import { BaseRepository } from './BaseRepository';
import { League } from '../../types';
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export class LeaguesRepositoryV2 extends BaseRepository<League> {
  constructor() {
    super('leagues');
  }

  async getLeagues(): Promise<League[]> {
    return await this.getAll();
  }

  async getLeague(id: string): Promise<League | null> {
    return await this.getById(id);
  }

  async saveLeague(league: League): Promise<void> {
    if (!league.id) throw new Error('League ID is required for saving');
    await this.setById(String(league.id), league);
  }

  async deleteLeague(id: string): Promise<void> {
    await this.delete(id);
  }
}

export const leaguesRepositoryV2 = new LeaguesRepositoryV2();
