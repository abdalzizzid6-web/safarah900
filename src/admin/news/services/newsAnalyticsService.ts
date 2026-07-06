import { db } from '../../../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  increment,
  query,
  where,
  limit,
  orderBy
} from 'firebase/firestore';
import { NewsStatisticsData, NewsArticle } from '../types';

const NEWS_COLLECTION = 'news';

export const newsAnalyticsService = {
  // Track direct view count
  async recordView(articleId: string, readingTimeMinutes: number = 0): Promise<void> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, articleId);
      const updates: any = {
        views: increment(1)
      };
      if (readingTimeMinutes > 0) {
        updates.readingTimeSum = increment(readingTimeMinutes);
      }
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error tracking view metrics:', error);
    }
  },

  // Track click count
  async recordClick(articleId: string): Promise<void> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, articleId);
      await updateDoc(docRef, {
        clicks: increment(1)
      });
    } catch (error) {
      console.error('Error tracking click metrics:', error);
    }
  },

  // Compute aggregated real statistics for Admin Analytics Center
  async getAggregatedStats(): Promise<NewsStatisticsData> {
    try {
      const snapshot = await getDocs(query(collection(db, NEWS_COLLECTION), limit(250)));
      const articles: NewsArticle[] = [];
      snapshot.forEach(doc => {
        articles.push({ id: doc.id, ...doc.data() } as NewsArticle);
      });

      let totalViews = 0;
      let totalClicks = 0;
      let draftCount = 0;
      let publishedCount = 0;
      let scheduledCount = 0;
      let sumReadingTime = 0;
      let sumArticlesWithReadingTime = 0;

      const categoryViewsMap = new Map<string, { name: string; views: number; count: number }>();
      const tagViewsMap = new Map<string, { name: string; views: number; count: number }>();

      articles.forEach(a => {
        const views = a.views || 0;
        const clicks = a.clicks || 0;
        totalViews += views;
        totalClicks += clicks;

        if (a.status === 'PUBLISHED') publishedCount++;
        else if (a.status === 'DRAFT') draftCount++;
        else if (a.status === 'SCHEDULED') scheduledCount++;

        const readTime = a.seo?.readingTime || 1;
        sumReadingTime += readTime;
        sumArticlesWithReadingTime++;

        // Category stats mapping
        if (a.categories) {
          a.categories.forEach(cat => {
            const current = categoryViewsMap.get(cat) || { name: cat, views: 0, count: 0 };
            categoryViewsMap.set(cat, {
              name: cat,
              views: current.views + views,
              count: current.count + 1
            });
          });
        }

        // Tag stats mapping
        if (a.tags) {
          a.tags.forEach(tag => {
            const current = tagViewsMap.get(tag) || { name: tag, views: 0, count: 0 };
            tagViewsMap.set(tag, {
              name: tag,
              views: current.views + views,
              count: current.count + 1
            });
          });
        }
      });

      // Prepare top articles lists
      const topArticles = articles
        .map(a => {
          const views = a.views || 0;
          const clicks = a.clicks || 0;
          const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0;
          return {
            articleId: a.id,
            title: a.title,
            views,
            clicks,
            ctr,
            avgReadingTime: a.seo?.readingTime || 1
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Map top categories
      const topCategories = Array.from(categoryViewsMap.entries()).map(([id, info]) => ({
        categoryId: id,
        categoryName: info.name,
        views: info.views,
        articlesCount: info.count
      })).sort((a, b) => b.views - a.views).slice(0, 5);

      // Map top tags
      const topTags = Array.from(tagViewsMap.entries()).map(([id, info]) => ({
        tagId: id,
        tagName: info.name,
        views: info.views,
        articlesCount: info.count
      })).sort((a, b) => b.views - a.views).slice(0, 5);

      const avgCtr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0;
      const avgReadingTime = sumArticlesWithReadingTime > 0 ? Math.round(sumReadingTime / sumArticlesWithReadingTime) : 0;

      return {
        totalArticles: articles.length,
        publishedCount,
        scheduledCount,
        draftCount,
        totalViews,
        totalClicks,
        avgCtr,
        avgReadingTime,
        topArticles,
        topCategories,
        topTags
      };
    } catch (error) {
      console.error('Error generating aggregated news stats:', error);
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
