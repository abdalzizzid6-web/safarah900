import { repositories } from '../../../core/repository';
import { NewsArticle, NewsArticleStatus, NewsVersion, NewsSeo } from '../types';
import { newsSeoService } from './newsSeoService';

export const newsService = {
  // Fetch paginated list with optional filters
  async getArticles(filters: {
    status?: NewsArticleStatus;
    category?: string;
    tag?: string;
    search?: string;
    limitSize?: number;
    lastDoc?: any;
  } = {}): Promise<{ articles: NewsArticle[]; lastVisible: any }> {
    try {
      const { status, category, tag, search, limitSize = 20 } = filters;
      let articles = (await repositories.news.getAll()) as NewsArticle[];

      if (status) {
        articles = articles.filter(a => a.status === status);
      }
      if (category) {
        articles = articles.filter(a => a.categories?.includes(category));
      }
      if (tag) {
        articles = articles.filter(a => a.tags?.includes(tag));
      }
      if (search) {
        const lowerSearch = search.toLowerCase();
        articles = articles.filter(a => 
          a.title?.toLowerCase().includes(lowerSearch) || 
          (typeof a.content === 'string' ? a.content : a.content?.fullText)?.toLowerCase().includes(lowerSearch)
        );
      }

      articles = articles.slice(0, limitSize);

      return {
        articles,
        lastVisible: null
      };
    } catch (error) {
      console.error('Error fetching news articles:', error);
      return { articles: [], lastVisible: null };
    }
  },

  // Get article by ID
  async getArticleById(id: string): Promise<NewsArticle | null> {
    try {
      const data = await repositories.news.getById(id);
      if (data) {
        return { id, ...data } as NewsArticle;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching article with ID ${id}:`, error);
      return null;
    }
  },

  // Create standard template dynamic news article
  async createArticle(data: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'views' | 'clicks'>): Promise<NewsArticle> {
    const timestamp = new Date().toISOString();
    
    // Automatically pre-fill SEO
    const seo: NewsSeo = data.seo || newsSeoService.generateDefaultSeo(
      data.title, 
      typeof data.content === 'string' ? data.content : data.content?.fullText || '', 
      data.categories, 
      data.tags
    );

    // Compute reading time
    seo.readingTime = newsSeoService.calculateReadingTime(typeof data.content === 'string' ? data.content : data.content?.fullText || '');

    const newArticle: Omit<NewsArticle, 'id'> = {
      ...data,
      seo,
      version: 1,
      views: 0,
      clicks: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: []
    };

    // Auto append structured NewsArticle data
    const finalArticleObj = {
      ...newArticle,
      seo: {
        ...seo,
        structuredData: newsSeoService.generateStructuredData(newArticle as NewsArticle)
      }
    };

    const docId = `news_${Date.now()}`;
    await repositories.news.setById(docId, finalArticleObj);
    return {
      id: docId,
      ...finalArticleObj
    } as NewsArticle;
  },

  // Update with version history logging
  async updateArticle(id: string, updates: Partial<NewsArticle>, updatedBy: string): Promise<void> {
    const existing = await this.getArticleById(id);
    if (!existing) throw new Error('Article not found');

    const timestamp = new Date().toISOString();
    const nextVersion = (existing.version || 1) + 1;

    // Track historical version for rollbacks
    const historyItem: NewsVersion = {
      id: `v_${nextVersion}_${Date.now()}`,
      version: existing.version || 1,
      updatedAt: existing.updatedAt || timestamp,
      updatedBy: existing.author?.name || 'محرر مجهول',
      title: existing.title,
      content: typeof existing.content === 'string' ? existing.content : existing.content?.fullText || '',
      status: existing.status
    };

    const mergedHistory = [...(existing.history || []), historyItem];

    // Compute read time if content is updated
    if (updates.content) {
      if (!updates.seo) updates.seo = existing.seo;
      const contentStr = typeof updates.content === 'string' ? updates.content : updates.content?.fullText || '';
      updates.seo.readingTime = newsSeoService.calculateReadingTime(contentStr);
    }

    const finalUpdates = {
      ...updates,
      version: nextVersion,
      updatedAt: timestamp,
      history: mergedHistory
    };

    await repositories.news.update(id, finalUpdates);
  },

  // Delete / Remove completely
  async deleteArticle(id: string): Promise<void> {
    await repositories.news.delete(id);
  },

  // Status transitions
  async transitionStatus(id: string, status: NewsArticleStatus, updatedBy: string): Promise<void> {
    const updates: Partial<NewsArticle> = { status };
    if (status === NewsArticleStatus.PUBLISHED) {
      updates.publishDate = new Date().toISOString();
    }
    await this.updateArticle(id, updates, updatedBy);
  },

  // Restore previous historical version
  async rollbackVersion(id: string, versionId: string, updatedBy: string): Promise<void> {
    const article = await this.getArticleById(id);
    if (!article || !article.history) throw new Error('Article or version history not found');

    const previousVer = article.history.find(h => h.id === versionId);
    if (!previousVer) throw new Error('Target version not found');

    await this.updateArticle(id, {
      title: previousVer.title,
      content: previousVer.content as any,
      status: previousVer.status
    }, updatedBy);
  }
};
