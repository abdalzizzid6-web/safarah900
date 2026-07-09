
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { IConfigRepository, SystemConfig } from '../contracts/IConfigRepository';
import { ApiRouting } from '../../../admin/api/types/api';

const DEFAULT_CONFIG: SystemConfig = {
  routing: {
    worldCup: 'API-Football',
    premierLeague: 'API-Football',
    arabMatches: 'API-Football',
    news: 'API-Football',
    players: 'API-Football',
    teams: 'API-Football',
    stats: 'API-Football',
    streaming: 'API-Football'
  },
  cacheTtlMinutes: 10,
  cacheEnabled: true,
  worldCupModuleEnabled: false
};

export class ConfigRepository implements IConfigRepository {
  private collectionName = 'settings';
  private docId = 'data_sources';

  async getConfig(): Promise<SystemConfig> {
    try {
      const docRef = doc(db, this.collectionName, this.docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          routing: data.routing || DEFAULT_CONFIG.routing,
          cacheTtlMinutes: data.cacheTtlMinutes || DEFAULT_CONFIG.cacheTtlMinutes,
          cacheEnabled: data.cacheEnabled !== undefined ? data.cacheEnabled : DEFAULT_CONFIG.cacheEnabled,
          worldCupModuleEnabled: data.worldCupModuleEnabled !== undefined ? data.worldCupModuleEnabled : DEFAULT_CONFIG.worldCupModuleEnabled
        };
      }
      
      // Initialize if doesn't exist
      await this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error fetching system config:', error);
      return DEFAULT_CONFIG;
    }
  }

  async updateConfig(config: Partial<SystemConfig>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, this.docId);
      await setDoc(docRef, config, { merge: true });
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  async updateRouting(routing: Partial<ApiRouting>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, this.docId);
      await updateDoc(docRef, { routing });
    } catch (error) {
      console.error('Error updating routing:', error);
      throw error;
    }
  }

  private async saveConfig(config: SystemConfig): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, this.docId);
      await setDoc(docRef, config);
    } catch (error) {
      console.error('Error saving system config:', error);
      throw error;
    }
  }
}
