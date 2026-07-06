import { newsRepositoryV2 } from '../core/repository/NewsRepositoryV2';
import { News } from '../types';

export const newsService = {
  async getLatestNews(count: number = 10): Promise<News[]> {
    return await newsRepositoryV2.getLatestNews(count);
  },

  async getArticleBySlug(slug: string): Promise<News | null> {
    return await newsRepositoryV2.getBySlug(slug);
  },

  async getArticlesPaginated(options: {
    status?: string;
    category?: string;
    tag?: string;
    authorName?: string;
    search?: string;
    limitSize?: number;
    lastDoc?: any;
  } = {}): Promise<{ articles: News[]; lastVisible: any | null }> {
    return await newsRepositoryV2.getArticlesPaginated(options);
  }
};
