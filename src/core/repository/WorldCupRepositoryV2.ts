import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, getDocs, setDoc, addDoc, limit, onSnapshot } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export class WorldCupRepositoryV2 extends BaseRepository<any> {
  constructor() {
    super('worldcup');
  }

  async getCmsMatchOverrides() {
    const snap = await getDocs(query(collection(db, 'cms_match_overrides'), limit(100)));
    const overrides: Record<string, any> = {};
    snap.forEach((doc) => {
      overrides[doc.id] = doc.data();
    });
    return overrides;
  }

  async getCmsTeams() {
    const snap = await getDocs(query(collection(db, 'cms_teams'), limit(100)));
    const teams: Record<string, any> = {};
    snap.forEach((doc) => {
      teams[doc.id] = doc.data();
    });
    return teams;
  }

  async addSystemLog(log: any) {
    return await addDoc(collection(db, 'system_logs'), log);
  }

  async getConfig(year: number) {
    const docRef = doc(db, 'worldcup_configs', year.toString());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  }

  subscribeConfig(year: number, callback: (data: any) => void) {
    const docRef = doc(db, 'worldcup_configs', year.toString());
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      }
    });
  }

  async setConfig(year: number, config: any) {
    const docRef = doc(db, 'worldcup_configs', year.toString());
    return await setDoc(docRef, config);
  }
}

export const worldCupRepositoryV2 = new WorldCupRepositoryV2();
