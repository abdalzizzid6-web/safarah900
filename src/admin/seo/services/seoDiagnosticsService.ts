import { collection, getDocs, doc, updateDoc, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { SeoArticle } from '../types';

export const seoDiagnosticsService = {
  /**
   * Fetch news articles from Firestore with limit
   */
  async fetchArticles(): Promise<SeoArticle[]> {
    const q = query(collection(db, 'news'), orderBy('publishedAt', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    const fetchedArticles: SeoArticle[] = [];
    querySnapshot.forEach((document) => {
      fetchedArticles.push({ id: document.id, ...document.data() } as SeoArticle);
    });
    return fetchedArticles;
  },

  /**
   * Update article SEO parameters in Firestore news collection
   */
  async updateArticleSeo(articleId: string, seoFields: Record<string, any>): Promise<void> {
    const docRef = doc(db, 'news', articleId);
    await updateDoc(docRef, seoFields);
  },

  /**
   * Fetch matches for sitemap indexing status reports
   */
  async fetchMatches(): Promise<any[]> {
    const q = query(collection(db, 'matches'), orderBy('startTime', 'desc'), limit(100));
    const matchesSnap = await getDocs(q);
    return matchesSnap.docs.map(document => ({ id: document.id, ...document.data() }));
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
      throw new Error(`HTTP Error ${response.status}`);
    }
    return response.text();
  }
};
