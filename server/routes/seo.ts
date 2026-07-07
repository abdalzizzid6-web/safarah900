import express from "express";
import { collections } from "../firestore/collections";
import { generateSitemapIndexXml, generateSitemapXml } from "../utils/seoHelpers";
import { normalizeMatch, normalizeLeague, normalizeTeam, normalizeNews } from "../utils/normalizer";
import { createSlugPath, safeExtractString } from "../utils/slugify";

const router = express.Router();
const BASE_URL = "https://korea90.xyz";

/**
 * LOGGING MIDDLEWARE for SEO
 */
router.use((req, res, next) => {
  // Only log if it's actually an SEO route
  if (req.path.includes('sitemap') || req.path.includes('robots.txt')) {
    console.log(`[SEO ROUTE] ${req.method} ${req.path}`);
  }
  next();
});

router.get("/sitemap.xml", (req, res) => {
  try {
    const host = BASE_URL;
    const sitemapsList = [
      `${host}/sitemap-main.xml`,
      `${host}/sitemap-matches.xml`,
      `${host}/sitemap-leagues.xml`,
      `${host}/sitemap-teams.xml`,
      `${host}/sitemap-players.xml`,
      `${host}/sitemap-news.xml`
    ];
    res.header('Content-Type', 'application/xml; charset=utf-8');
    const xml = generateSitemapIndexXml(sitemapsList);
    res.send(xml);
  } catch (err: any) {
    console.error("[CRITICAL SEO ERROR] Failed to generate sitemap index:", err);
    // Return empty sitemap index or basic one instead of 500
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(generateSitemapIndexXml([]));
  }
});

router.get("/sitemap-main.xml", (req, res) => {
  try {
    const host = BASE_URL;
    const urls = [
      { loc: `${host}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${host}/world-cup-2026`, changefreq: 'weekly', priority: '0.9' },
      { loc: `${host}/standings`, changefreq: 'daily', priority: '0.8' },
      { loc: `${host}/schedule`, changefreq: 'always', priority: '0.9' },
      { loc: `${host}/news`, changefreq: 'always', priority: '0.9' },
    ];
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml(urls));
  } catch (err: any) {
    console.error("[CRITICAL SEO ERROR] Failed to generate main sitemap:", err);
    // Return empty sitemap
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(generateSitemapXml([]));
  }
});

// Cache variables
let sitemapCache: Record<string, { xml: string, expiry: number }> = {};

export const clearSitemapCache = () => {
    sitemapCache = {};
};

const CACHE_DURATION = 3600000; // 1 hour

const handleSitemap = (key: string, generator: () => Promise<any[]>) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      console.log(`[SEO] Generating sitemap for ${key}...`);
      
      let urls: any[] = [];
      try {
        urls = await generator();
        console.log(`[SEO] Generated ${urls.length} URLs for ${key}`);
      } catch (genError: any) {
        console.error(`[SEO ERROR] Generator failed for ${key}:`, genError);
        // Fallback to empty array on generator error
      }

      const xml = generateSitemapXml(urls);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (error: any) {
      console.error(`[CRITICAL SEO ERROR] Error generating sitemap ${key}:`, error);
      
      // Always return 200 with a minimal valid empty XML to avoid 500 errors
      const fallbackXml = generateSitemapXml([]);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(fallbackXml);
    }
  };
};

router.get("/sitemap-matches.xml", handleSitemap('matches', async () => {
  const host = BASE_URL;
  const urls: any[] = [];
  // Order by startTime desc for most recent matches
  const snap = await collections.matches().orderBy('startTime', 'desc').limit(500).get();
  console.log(`[SEO DEBUG] Found ${snap.size} match documents in Firestore`);
  snap.forEach(doc => {
    const data = doc.data();
    const match = normalizeMatch({ ...data, id: doc.id });
    
    // Ensure slug is created from normalized names
    const slug = createSlugPath(`${match.homeName} vs ${match.awayName}`, match.id);
    if (doc.id === 'wc-537390') {
      console.log(`[SEO DEBUG] Normalized match for wc-537390:`, {
        homeName: match.homeName,
        awayName: match.awayName,
        slug
      });
    }
    
    urls.push({
      loc: `${host}/match/${slug}`,
      changefreq: 'daily',
      priority: '0.8',
      lastmod: (data.startTime?.toDate?.() || (data.startTime ? new Date(data.startTime._seconds * 1000) : new Date())).toISOString()
    });
  });
  return urls;
}));

router.get("/sitemap-leagues.xml", handleSitemap('leagues', async () => {
  const host = BASE_URL;
  const urls: any[] = [];
  const snap = await collections.leagues().limit(100).get();
  snap.forEach(doc => {
    const data = doc.data();
    const league = normalizeLeague({ ...data, id: doc.id });
    urls.push({ loc: `${host}/league/${league.slug}`, changefreq: 'daily', priority: '0.8' });
  });
  return urls;
}));

router.get("/sitemap-teams.xml", handleSitemap('teams', async () => {
  const host = BASE_URL;
  const urls: any[] = [];
  const snap = await collections.teams().limit(500).get();
  snap.forEach(doc => {
    const data = doc.data();
    const team = normalizeTeam({ ...data, id: doc.id });
    urls.push({ loc: `${host}/team/${team.slug}`, changefreq: 'weekly', priority: '0.7' });
  });
  return urls;
}));

router.get("/sitemap-players.xml", handleSitemap('players', async () => {
  const host = BASE_URL;
  const urls: any[] = [];
  const snap = await collections.players().limit(500).get();
  snap.forEach(doc => {
    const data = doc.data();
    const slug = createSlugPath(data.name || "player", doc.id);
    urls.push({ loc: `${host}/player/${slug}`, changefreq: 'weekly', priority: '0.6' });
  });
  return urls;
}));

router.get("/sitemap-news.xml", handleSitemap('news', async () => {
  const host = BASE_URL;
  const urls: any[] = [];
  // Use publishDate instead of publishedAt as per rssService implementation
  const snap = await collections.news().orderBy('publishDate', 'desc').limit(500).get();
  snap.forEach(doc => {
    const data = doc.data();
    const news = normalizeNews({ ...data, id: doc.id });
    urls.push({
      loc: `${host}/news/${news.slug}`,
      changefreq: 'monthly',
      priority: '0.9',
      lastmod: (data.publishDate?.toDate?.() || data.updatedAt?.toDate?.() || (data.publishDate ? new Date(data.publishDate._seconds * 1000) : (data.updatedAt ? new Date(data.updatedAt._seconds * 1000) : new Date()))).toISOString()
    });
  });
  return urls;
}));

// robots.txt moved to index.ts

export default router;
