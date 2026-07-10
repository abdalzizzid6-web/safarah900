import { BaseRepository } from './BaseRepository';
import { News } from '../../types';
import apiClient from '../../api/apiClient';

export interface NewsSettings {
  readingSpeed: number;
  autoSitemap: boolean;
  minViewsForPopular: number;
  updatedAt?: string;
}

export class NewsRepositoryV2 extends BaseRepository<News> {
  constructor() {
    super('news');
  }

  async getSettings(): Promise<NewsSettings> {
    try {
      const data = await this.getById('general_configuration') as any;
      if (!data) return { readingSpeed: 200, autoSitemap: true, minViewsForPopular: 50 };
      
      return {
        readingSpeed: data.readingSpeed || 200,
        autoSitemap: data.autoSitemap !== false,
        minViewsForPopular: data.minViewsForPopular || 50
      };
    } catch (e) {
      console.error('NewsRepositoryV2.getSettings error:', e);
      return { readingSpeed: 200, autoSitemap: true, minViewsForPopular: 50 };
    }
  }

  async updateSettings(settings: Partial<NewsSettings>): Promise<void> {
    try {
      const payload = { ...settings, updatedAt: new Date().toISOString() };
      await this.setById('general_configuration', payload);
    } catch (e) {
      console.error('NewsRepositoryV2.updateSettings error:', e);
      throw e;
    }
  }

  /**
   * Normalizes news article data for UI consistency
   */
  private normalizeNews(data: any): News {
    if (!data) return data;
    
    const sourceObj = typeof data.source === 'object' && data.source !== null
      ? data.source
      : { name: data.source || data.sourceName || "صافرة 90" };

    return {
      ...data,
      mainImage: data.mainImage || data.imageUrl || data.image || data.featuredImage?.url || "/data/rss_fallback.jpg",
      image: data.image || data.mainImage || data.imageUrl || data.featuredImage?.url || "/data/rss_fallback.jpg",
      title: data.title || "",
      content: typeof data.content === 'object' ? data.content : { fullText: data.content || "", summary: data.excerpt || "" },
      author: typeof data.author === 'string' ? { name: data.author } : data.author || { name: "صافرة 90" },
      source: sourceObj,
      publishDate: data.publishDate || data.pubDate || new Date().toISOString()
    };
  }

  async getLatestNews(count: number = 10): Promise<News[]> {
    try {
      const response = await apiClient.get<{ articles: News[], isQuotaExceeded: boolean }>(`/api/news?limit=${count}`);
      if (response.data?.articles) {
        return response.data.articles;
      }
      return [];
    } catch (e) {
      console.error('NewsRepositoryV2.getLatestNews error:', e);
      return [];
    }
  }

  async getBySlug(slug: string): Promise<News | null> {
    try {
      const response = await apiClient.get<News>(`/api/news/article/${slug}`);
      return response.data || null;
    } catch (e) {
      console.error('NewsRepositoryV2.getBySlug error:', e);
      return null;
    }
  }

  async getArticlesPaginated(options: {
    status?: string;
    category?: string;
    tag?: string;
    authorName?: string;
    search?: string;
    limitSize?: number;
    lastDoc?: any;
  } = {}): Promise<{ articles: News[]; lastVisible: any | null }> {
    try {
      const { status = 'PUBLISHED', category, tag, limitSize = 10 } = options;
      
      const params = new URLSearchParams();
      params.append('status', status);
      params.append('limit', limitSize.toString());
      if (category) params.append('category', category);
      if (tag) params.append('tag', tag);

      const response = await apiClient.get<{ articles: News[], isQuotaExceeded: boolean }>(`/api/news?${params.toString()}`);
      
      return {
        articles: response.data?.articles || [],
        lastVisible: null // Server-side basic pagination doesn't return cursor yet
      };
    } catch (e) {
      console.error('NewsRepositoryV2.getArticlesPaginated error:', e);
      return { articles: [], lastVisible: null };
    }
  }
}
export const newsRepositoryV2 = new NewsRepositoryV2();
