import { repositories } from '../../../core/repository';
import { SeoArticle } from '../types';

export const seoDiagnosticsService = {
  /**
   * Fetch news articles from Firestore with limit
   */
  async fetchArticles(): Promise<SeoArticle[]> {
    const articles = await repositories.news.getAll();
    return articles.slice(0, 100) as SeoArticle[];
  },

  /**
   * Update article SEO parameters in Firestore news collection
   */
  async updateArticleSeo(articleId: string, seoFields: Record<string, any>): Promise<void> {
    await repositories.news.update(articleId, seoFields);
  },

  /**
   * Fetch matches for sitemap indexing status reports
   */
  async fetchMatches(): Promise<any[]> {
    return await repositories.matches.getMatches({ limit: 100 });
  },

  /**
   * Direct fetching of the robots.txt file from web root
   */
  async fetchRobotsTxt(): Promise<string> {
    const response = await fetch('/robots.txt');
    if (!response.ok) {
      if (response.status === 404) {
        return "User-agent: *\nAllow: /\nSitemap: https://korea90.xyz/sitemap.xml";
      }
      throw new Error(`HTTP Error ${response.status}`);
    }
    return response.text();
  },

  /**
   * Fetch and inspect a specific sitemap xml
   */
  async fetchSitemapContent(url: string): Promise<string> {
    let targetUrl = url;
    if (typeof window !== 'undefined' && url.includes('korea90.xyz')) {
      const path = new URL(url).pathname;
      targetUrl = path;
    }
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    return response.text();
  }
};
