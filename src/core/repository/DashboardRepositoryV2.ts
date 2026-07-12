import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export class DashboardRepositoryV2 extends BaseRepository<any> {
  constructor() {
    super('dashboard');
  }

  async getCollectionCount(colName: string) {
    const snap = await getCountFromServer(collection(db, colName));
    return snap.data().count;
  }

  async getRecentTeams(limitNum: number = 5) {
    const q = query(collection(db, 'cms_teams'), orderBy('updatedAt', 'desc'), limit(limitNum));
    return await getDocs(q);
  }

  async getRecentPlayers(limitNum: number = 5) {
    const q = query(collection(db, 'cms_players'), orderBy('updatedAt', 'desc'), limit(limitNum));
    return await getDocs(q);
  }

  async getTopTeams(limitNum: number = 5) {
    const q = query(collection(db, 'teams'), orderBy('stats.wins', 'desc'), limit(limitNum));
    return await getDocs(q);
  }

  async getTopPlayers(limitNum: number = 5) {
    const q = query(collection(db, 'players'), orderBy('stats.goals', 'desc'), limit(limitNum));
    return await getDocs(q);
  }
}

export const dashboardRepositoryV2 = new DashboardRepositoryV2();
