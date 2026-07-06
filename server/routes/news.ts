
import express from "express";
import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";
import { serverCache } from "../utils/cache";

const router = express.Router();

// Memory cache for news to protect Firestore quotas
const newsCache: Record<string, { data: any; expiry: number }> = {};

/**
 * Normalizes news article data for UI consistency (same as client-side)
 */
function normalizeNews(data: any): any {
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

router.get("/", async (req, res) => {
  const { status = 'PUBLISHED', limit = 10, category, tag } = req.query;
  const cacheKey = `news_${status}_${limit}_${category || 'all'}_${tag || 'all'}`;
  
  if (newsCache[cacheKey] && newsCache[cacheKey].expiry > Date.now()) {
    return res.json(newsCache[cacheKey].data);
  }

  let articles: any[] = [];
  
  // Try static cache first
  const staticNews = serverCache.readStaticFile<any[]>('news.json');
  if (staticNews) {
    articles = staticNews;
    if (category) {
      articles = articles.filter(a => a.categories?.includes(category));
    }
    if (tag) {
      articles = articles.filter(a => a.tags?.includes(tag));
    }
    articles = articles.slice(0, Number(limit));
  }

  // If Firestore is available, merge/fetch latest
  if (!isFirestoreQuotaExceeded) {
    try {
      let query: any = firestore.collection('news').where('status', '==', status);
      
      if (category) {
        query = query.where('categories', 'array-contains', category);
      } else if (tag) {
        query = query.where('tags', 'array-contains', tag);
      }
      
      const snap = await query.orderBy('publishDate', 'desc').limit(Number(limit)).get();
      const firestoreArticles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (firestoreArticles.length > 0) {
        const newsMap = new Map();
        articles.forEach(a => newsMap.set(String(a.id), a));
        firestoreArticles.forEach(a => newsMap.set(String(a.id), a));
        articles = Array.from(newsMap.values()).sort((a, b) => 
          new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime()
        ).slice(0, Number(limit));
      }
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[News API] Failed to fetch from Firestore:", e);
    }
  }

  const result = articles.map(a => normalizeNews(a));
  newsCache[cacheKey] = { data: result, expiry: Date.now() + 10 * 60 * 1000 }; // 10 mins
  
  // Set a header or property to indicate quota status
  if (isFirestoreQuotaExceeded) {
    res.setHeader('X-Firestore-Quota-Exceeded', 'true');
  }

  return res.json({
    articles: result,
    isQuotaExceeded: isFirestoreQuotaExceeded
  });
});

router.get("/settings/:type", async (req, res) => {
  const { type } = req.params; // 'featured_articles' or 'breaking_articles'
  const cacheKey = `news_settings_${type}`;

  if (newsCache[cacheKey] && newsCache[cacheKey].expiry > Date.now()) {
    return res.json(newsCache[cacheKey].data);
  }

  let data = null;

  if (!isFirestoreQuotaExceeded) {
    try {
      const snap = await firestore.collection('news_settings').doc(type).get();
      if (snap.exists) {
        data = snap.data();
      }
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
    }
  }

  if (!data) {
    // Fallback if needed
    data = { ids: [], flashes: [] };
  }

  newsCache[cacheKey] = { data, expiry: Date.now() + 15 * 60 * 1000 };
  return res.json(data);
});

router.get("/article/:slug", async (req, res) => {
  const { slug } = req.params;
  const cacheKey = `article_${slug}`;
  
  if (newsCache[cacheKey] && newsCache[cacheKey].expiry > Date.now()) {
    return res.json(newsCache[cacheKey].data);
  }

  // Try static first
  const staticNews = serverCache.readStaticFile<any[]>('news.json');
  let article = staticNews?.find(a => a.seo?.slug === slug || a.id === slug);

  if (!article && !isFirestoreQuotaExceeded) {
    try {
      const snap = await firestore.collection('news').where('seo.slug', '==', slug).limit(1).get();
      if (!snap.empty) {
        article = { id: snap.docs[0].id, ...snap.docs[0].data() };
      } else {
        const directDoc = await firestore.collection('news').doc(slug).get();
        if (directDoc.exists) {
          article = { id: directDoc.id, ...directDoc.data() };
        }
      }
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
    }
  }

  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  const result = normalizeNews(article);
  newsCache[cacheKey] = { data: result, expiry: Date.now() + 30 * 60 * 1000 }; // 30 mins
  
  return res.json(result);
});

export default router;
