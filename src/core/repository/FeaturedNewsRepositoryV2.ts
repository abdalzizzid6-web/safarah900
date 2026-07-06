import { BaseRepository } from './BaseRepository';
import apiClient from '../../api/apiClient';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export class FeaturedNewsRepositoryV2 extends BaseRepository<string[]> {
  constructor() {
    super('news_settings');
  }

  async getFeaturedIds(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/api/news/settings/featured_articles');
      return response.data?.ids || [];
    } catch (e) {
      console.error('FeaturedNewsRepositoryV2.getFeaturedIds error:', e);
      return [];
    }
  }

  async saveFeaturedIds(ids: string[]): Promise<boolean> {
    try {
        const docRef = doc(db, 'news_settings', 'featured_articles');
        await setDoc(docRef, { ids }, { merge: true });
        return true;
    } catch (e) {
        return false;
    }
  }
}
export const featuredNewsRepositoryV2 = new FeaturedNewsRepositoryV2();
