import { BaseRepository } from './BaseRepository';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ad } from '../../types';
import { telemetry } from '../monitoring/telemetry';

export class AdsRepositoryV2 extends BaseRepository<Ad> {
  constructor() {
    super('ads');
  }

  async getAds(): Promise<Ad[]> {
    return await this.getAll();
  }

  async getAd(id: string): Promise<Ad | null> {
    return await this.getById(id);
  }

  async saveAd(ad: Ad): Promise<void> {
    if (!ad.id) throw new Error('Ad ID is required for saving');
    await this.setById(ad.id, ad);
  }

  async deleteAd(id: string): Promise<void> {
    await this.delete(id);
  }

  subscribeToAds(callback: (ads: Ad[]) => void): () => void {
    if (telemetry.isFirestoreQuotaExceeded()) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, 'ads'));
    return onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      callback(ads);
    }, (error: any) => {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.error('[AdsRepositoryV2] Subscription error:', error);
      callback([]);
    });
  }

  async getAdsBySlot(slot: string): Promise<Ad[]> {
    if (telemetry.isFirestoreQuotaExceeded()) {
      return [];
    }
    try {
      const q = query(collection(db, 'ads'), where('slot', '==', slot), where('enabled', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
    } catch (error: any) {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.error('[AdsRepositoryV2] getAdsBySlot error:', error);
      return [];
    }
  }
}

export const adsRepositoryV2 = new AdsRepositoryV2();
