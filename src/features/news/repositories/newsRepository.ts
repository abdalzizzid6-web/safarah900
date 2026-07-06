import { collection, query, where, limit, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { NewsArticle } from '../../../hooks/useNews';
import { getCached, setCache } from '../../../utils/cacheUtils';

let memoryCache: Record<string, { data: any; expiresAt: number }> = {};
const STORAGE_PREFIX = "Safara 90_news_cache_";

export const getArticleBySlug = async (slug: string): Promise<NewsArticle | null> => {
  const cacheKey = `article_${slug}`;
  const cached = getCached<NewsArticle>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey);
  if (cached) return cached;

  try {
    // Try to fetch by ID first
    const docRef = doc(db, 'news', slug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const article = { id: docSnap.id, ...docSnap.data() } as NewsArticle;
      setCache(cacheKey, article, memoryCache, STORAGE_PREFIX + cacheKey);
      return article;
    }

    // If not found by ID, try by slug
    const q = query(
      collection(db, 'news'),
      where('seo.slug', '==', slug),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      const article = { id: d.id, ...d.data() } as NewsArticle;
      setCache(cacheKey, article, memoryCache, STORAGE_PREFIX + cacheKey);
      return article;
    }

    return null;
  } catch (error) {
    console.error('[newsRepository] Error fetching article by slug:', error);
    const stale = getCached<NewsArticle>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey, true);
    if (stale) return stale;
    throw error;
  }
};

export const getLatestNews = async (count: number = 10): Promise<NewsArticle[]> => {
  const cacheKey = `latest_${count}`;
  const cached = getCached<NewsArticle[]>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, 'news'),
      orderBy('publishDate', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    const articles = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsArticle));
    
    // override default 24h cache ttl to 5 minutes for latest news
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const expiresAt = Date.now() + CACHE_TTL_MS;
    memoryCache[cacheKey] = { data: articles, expiresAt };
    try {
      localStorage.setItem(STORAGE_PREFIX + cacheKey, JSON.stringify({ data: articles, expiresAt }));
    } catch (e) {}

    return articles;
  } catch (error) {
    console.error('[newsRepository] Error fetching latest news:', error);
    const stale = getCached<NewsArticle[]>(cacheKey, memoryCache, STORAGE_PREFIX + cacheKey, true);
    if (stale) return stale;
    throw error;
  }
};
