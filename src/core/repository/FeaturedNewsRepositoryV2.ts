import { BaseRepository } from './BaseRepository';
import apiClient from '../../api/apiClient';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export class FeaturedNewsRepositoryV2 extends BaseRepository<{ ids: string[] }> {
  constructor() {
    super('news_settings');
  }

  async getFeaturedIds(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/api/news/settings/featured_articles');
      return response.data?.ids || [];
    } catch (e) {
      console.error('FeaturedNewsRepositoryV2.getFeaturedIds error:', e);
      // Fallback to repository
      const doc = await this.getById('featured_articles');
      return doc?.ids || [];
    }
  }

  async saveFeaturedIds(ids: string[]): Promise<boolean> {
    try {
        await this.setById('featured_articles', { ids });
        return true;
    } catch (e) {
        return false;
    }
  }
}
export const featuredNewsRepositoryV2 = new FeaturedNewsRepositoryV2();
