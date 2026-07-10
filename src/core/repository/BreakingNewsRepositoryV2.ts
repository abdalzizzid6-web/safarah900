import { BaseRepository } from './BaseRepository';
import { BreakingNewsFlash } from '../../admin/news/types/breakingNews';
import apiClient from '../../api/apiClient';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export class BreakingNewsRepositoryV2 extends BaseRepository<{ flashes: BreakingNewsFlash[] }> {
  constructor() {
    super('news_settings'); // Breaking news is in news_settings/breaking_articles
  }

  async getFlashes(): Promise<BreakingNewsFlash[]> {
    try {
      const response = await apiClient.get<any>('/api/news/settings/breaking_articles');
      return response.data?.flashes || [];
    } catch (e) {
      console.error('BreakingNewsRepositoryV2.getFlashes error:', e);
      // Fallback
      const doc = await this.getById('breaking_articles');
      return doc?.flashes || [];
    }
  }

  async saveFlashes(flashes: BreakingNewsFlash[]): Promise<boolean> {
    try {
        await this.setById('breaking_articles', { flashes });
        return true;
    } catch (e) {
        return false;
    }
  }
}
export const breakingNewsRepositoryV2 = new BreakingNewsRepositoryV2();
