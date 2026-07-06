import { BaseRepository } from './BaseRepository';
import { collection, query, where, onSnapshot, getDocs, limit, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Ad } from '../../types';
import { telemetry } from '../monitoring/telemetry';

export class AdCampaignsRepositoryV2 extends BaseRepository<Ad> {
  constructor() {
    super('ad_campaigns');
  }

  async getAdCampaigns(count: number = 100): Promise<Ad[]> {
    return await this.getAll();
  }

  async saveCampaign(ad: Partial<Ad> & { id?: string }) {
    const { id, ...data } = ad;
    if (id) {
      await this.update(id, {
        ...data,
        updatedAt: new Date().toISOString()
      } as any);
      return id;
    } else {
      return await this.create({
        ...data,
        status: (data as any).status || 'active',
        active: data.active ?? true,
        createdAt: new Date().toISOString()
      } as any);
    }
  }

  async toggleStatus(id: string, active: boolean) {
    await this.update(id, {
      active,
      status: active ? 'active' : 'inactive',
      updatedAt: new Date().toISOString()
    } as any);
  }

  subscribeToActiveCampaigns(callback: (ads: Ad[]) => void): () => void {
    if (telemetry.isFirestoreQuotaExceeded()) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, 'ad_campaigns'),
      where('status', '==', 'active'),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
      callback(ads);
    }, (error: any) => {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.error('[AdCampaignsRepositoryV2] Subscription error:', error);
      callback([]);
    });
  }
}

export const adCampaignsRepositoryV2 = new AdCampaignsRepositoryV2();
