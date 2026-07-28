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
        });
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
        });
      }
    } catch (error) {
      console.error('Error tracking click metrics:', error);
    }
  },

  // Compute aggregated real statistics for Admin Analytics Center
  async getAggregatedStats(): Promise<NewsStatisticsData> {
    try {
      const articles = (await repositories.news.getAll()) as NewsArticle[];

      let totalViews = 0;
      let totalClicks = 0;
      let draftCount = 0;
      let publishedCount = 0;
      let scheduledCount = 0;
      let archivedCount = 0;

      const categoryDistribution: Record<string, number> = {};

      articles.forEach(art => {
        totalViews += (art.views || 0);
        totalClicks += (art.clicks || 0);

        if (art.status === 'published') publishedCount++;
        else if (art.status === 'draft') draftCount++;
        else if (art.status === 'scheduled') scheduledCount++;
        else if (art.status === 'archived') archivedCount++;

        (art.categories || []).forEach(cat => {
          categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
        });
      });

      const sortedByViews = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0));
      const topPerforming = sortedByViews.slice(0, 5);

      const categoryStats = Object.entries(categoryDistribution).map(([category, count]) => ({
        category,
        articleCount: count,
        totalViews: articles.filter(a => a.categories?.includes(category)).reduce((acc, curr) => acc + (curr.views || 0), 0)
      }));

      const averageCtr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

      return {
        totalArticles: articles.length,
        publishedCount,
        draftCount,
        scheduledCount,
        archivedCount,
        totalViews,
        totalClicks,
        averageCtr: parseFloat(averageCtr.toFixed(2)),
        topPerforming,
        categoryStats
      };
    } catch (error) {
      console.error('Error computing aggregated news analytics:', error);
      return {
        totalArticles: 0,
        publishedCount: 0,
        draftCount: 0,
        scheduledCount: 0,
        archivedCount: 0,
        totalViews: 0,
        totalClicks: 0,
        averageCtr: 0,
        topPerforming: [],
        categoryStats: []
      };
    }
  }
};
