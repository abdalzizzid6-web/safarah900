import { repositories } from '../../../core/repository';
import { NewsStatisticsData, NewsArticle } from '../types';

export const newsAnalyticsService = {
  // Track direct view count
  async recordView(articleId: string, readingTimeMinutes: number = 0): Promise<void> {
    try {
      const article = await repositories.news.getById(articleId) as any;
      if (article) {
        const currentViews = article.views || 0;
        const currentReadingTimeSum = article.readingTimeSum || 0;
        await repositories.news.update(articleId, {
          views: currentViews + 1,
          readingTimeSum: currentReadingTimeSum + readingTimeMinutes
        } as any);
      }
    } catch (error) {
      console.error('Error tracking view metrics:', error);
    }
  },

  // Track click count
  async recordClick(articleId: string): Promise<void> {
    try {
      const article = await repositories.news.getById(articleId) as any;
      if (article) {
        const currentClicks = article.clicks || 0;
        await repositories.news.update(articleId, {
          clicks: currentClicks + 1
        } as any);
      }
    } catch (error) {
      console.error('Error tracking click metrics:', error);
    }
  },

  // Compute aggregated real statistics for Admin Analytics Center
  async getAggregatedStats(): Promise<NewsStatisticsData> {
    try {
      const articles = (await repositories.news.getAll()) as any[];

      let totalViews = 0;
      let totalClicks = 0;
      let draftCount = 0;
      let publishedCount = 0;
      let scheduledCount = 0;
      let archivedCount = 0;

      const categoryDistribution: Record<string, number> = {};

      articles.forEach((art: any) => {
        totalViews += (art.views || 0);
        totalClicks += (art.clicks || 0);

        if (art.status === 'published') publishedCount++;
        else if (art.status === 'draft') draftCount++;
        else if (art.status === 'scheduled') scheduledCount++;
        else if (art.status === 'archived') archivedCount++;

        (art.categories || []).forEach((cat: string) => {
          categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
        });
      });

      const sortedByViews = [...articles].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
      const topArticles = sortedByViews.slice(0, 5).map((a: any) => ({
        articleId: a.id,
        title: a.title,
        views: a.views || 0,
        clicks: a.clicks || 0,
        ctr: (a.views || 0) > 0 ? ((a.clicks || 0) / a.views) * 100 : 0,
        avgReadingTime: a.seo?.readingTime || 2
      }));

      const topCategories = Object.entries(categoryDistribution).map(([categoryName, count]) => ({
        categoryId: categoryName,
        categoryName,
        views: articles.filter((a: any) => a.categories?.includes(categoryName)).reduce((acc: number, curr: any) => acc + (curr.views || 0), 0),
        articlesCount: count as number
      }));

      const avgCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      const totalReadingTime = articles.reduce((acc: number, curr: any) => acc + (curr.seo?.readingTime || 2), 0);
      const avgReadingTime = articles.length > 0 ? totalReadingTime / articles.length : 0;

      return {
        totalArticles: articles.length,
        publishedCount,
        scheduledCount,
        draftCount,
        totalViews,
        totalClicks,
        avgCtr: parseFloat(avgCtr.toFixed(2)),
        avgReadingTime: parseFloat(avgReadingTime.toFixed(1)),
        topArticles,
        topCategories,
        topTags: []
      };
    } catch (error) {
      console.error('Error computing aggregated news analytics:', error);
      return {
        totalArticles: 0,
        publishedCount: 0,
        scheduledCount: 0,
        draftCount: 0,
        totalViews: 0,
        totalClicks: 0,
        avgCtr: 0,
        avgReadingTime: 0,
        topArticles: [],
        topCategories: [],
        topTags: []
      };
    }
  }
};
