import express from "express";
import { collections } from "../firestore/collections";
import { generateSitemapIndexXml, generateSitemapXml } from "../utils/seoHelpers";
import { normalizeMatch, normalizeLeague, normalizeTeam, normalizeNews } from "../utils/normalizer";
import { createSlugPath, safeExtractString } from "../utils/slugify";

const router = express.Router();
const BASE_URL = "https://korea90.xyz";

const getBaseUrl = (req: express.Request) => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  if (host?.includes('run.app') || host?.includes('localhost')) {
    return `${protocol}://${host}`;
  }
  return "https://korea90.xyz";
};

/**
 * LOGGING MIDDLEWARE for SEO
 */
router.use((req, res, next) => {
  // Only log if it's actually an SEO route
  if (req.path.includes('sitemap') || req.path.includes('robots.txt')) {
    console.log(`[SEO ROUTE] ${req.method} ${req.path} from ${req.get('host')}`);
  }
  next();
});

router.get("/api/seo/diagnostic", async (req, res) => {
  try {
    const stats: any = {};
    const host = getBaseUrl(req);
    
    // Check Matches
    const allMatchesSnap = await collections.matches().limit(2000).get();
    const allMatches = allMatchesSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    
    const isPlaceholder = (name: string) => {
      if (!name) return true;
      const lower = name.toLowerCase();
      return lower.includes('unknown') || 
             lower.includes('tbd') || 
             lower.includes('winner') ||
             lower.includes('loser') ||
             lower === 'team' ||
             lower === 'null' ||
             name === 'قيد التحديد';
    };

    const sitemapMatches = allMatches.filter(m => {
      const match = normalizeMatch(m);
      if (match.isHidden) return false;
      if (isPlaceholder(match.homeName) && isPlaceholder(match.awayName)) return false;
      return true;
    });

    stats.matches = { 
      totalInFirestore: allMatches.length, 
      eligibleForSitemap: sitemapMatches.length,
      sitemapLimit: 1000 
    };
    
    // Check News
    const newsCount = (await collections.news().count().get()).data().count;
    stats.news = { total: newsCount, sitemapLimit: 500 };
    
    // Check other counts
    stats.leagues = (await collections.leagues().count().get()).data().count;
    stats.teams = (await collections.teams().count().get()).data().count;
    stats.players = (await collections.players().count().get()).data().count;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      baseUrl: host,
      detectedHost: req.get('host'),
      stats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/sitemap.xml", (req, res) => {
  try {
    const host = getBaseUrl(req);
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
    const host = getBaseUrl(req);
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

const handleSitemap = (key: string, generator: (req: express.Request) => Promise<any[]>) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      console.log(`[SEO] Generating sitemap for ${key} from ${req.get('host')}...`);
      
      let urls: any[] = [];
      try {
        urls = await generator(req);
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

router.get("/sitemap-matches.xml", handleSitemap('matches', async (req) => {
  const host = getBaseUrl(req);
  const urls: any[] = [];
  // Use a more reliable query that doesn't strictly require composite indexes for isHidden
  // and handle filtering in memory for small datasets (< 1000)
  const snap = await collections.matches().orderBy('startTime', 'desc').limit(1000).get();
  console.log(`[SEO DEBUG] Generating sitemap-matches.xml. Found ${snap.size} match documents in Firestore.`);
  
  snap.forEach(doc => {
    try {
      const data = doc.data();
      const match = normalizeMatch({ ...data, id: doc.id });
      
      if (!match || match.isHidden) return;

      // Filter out placeholder matches (TBD / قيد التحديد)
      const isPlaceholder = (name: string) => {
        if (!name) return true;
        const lower = name.toLowerCase();
        return lower.includes('unknown') || 
               lower.includes('tbd') || 
               lower.includes('winner') ||
               lower.includes('loser') ||
               lower === 'team' ||
               lower === 'null' ||
               name === 'قيد التحديد';
      };

      if (isPlaceholder(match.homeName) && isPlaceholder(match.awayName)) {
        console.log(`[SEO DEBUG] Skipping placeholder match: ${match.homeName} vs ${match.awayName} (ID: ${match.id})`);
        return; 
      }
      
      console.log(`[SEO DEBUG] Adding match to sitemap: ${match.homeName} vs ${match.awayName} (ID: ${match.id})`);
      
      const slug = match.slug;
      
      let lastmod: string;
      try {
        if (data.updatedAt?.toDate) {
          lastmod = data.updatedAt.toDate().toISOString();
        } else if (data.startTime?.toDate) {
          lastmod = data.startTime.toDate().toISOString();
        } else if (data.startTime) {
          const date = new Date(data.startTime);
          lastmod = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } else {
          lastmod = new Date().toISOString();
        }
      } catch (e) {
        lastmod = new Date().toISOString();
      }
      
      urls.push({
        loc: `${host}/match/${slug}`,
        changefreq: 'daily',
        priority: '0.8',
        lastmod
      });
    } catch (err: any) {
      console.error(`[SEO ERROR] Failed to process match ${doc.id} for sitemap:`, err.message);
    }
  });
  
  console.log(`[SEO DEBUG] Successfully added ${urls.length} non-placeholder matches to sitemap-matches.xml`);
  return urls;
}));

router.get("/sitemap-leagues.xml", handleSitemap('leagues', async (req) => {
  const host = getBaseUrl(req);
  const urls: any[] = [];
  const snap = await collections.leagues().limit(100).get();
  snap.forEach(doc => {
    const data = doc.data();
    const league = normalizeLeague({ ...data, id: doc.id });
    urls.push({ loc: `${host}/league/${league.slug}`, changefreq: 'daily', priority: '0.8' });
  });
  return urls;
}));

router.get("/sitemap-teams.xml", handleSitemap('teams', async (req) => {
  const host = getBaseUrl(req);
  const urls: any[] = [];
  const snap = await collections.teams().limit(500).get();
  snap.forEach(doc => {
    const data = doc.data();
    const team = normalizeTeam({ ...data, id: doc.id });
    urls.push({ loc: `${host}/team/${team.slug}`, changefreq: 'weekly', priority: '0.7' });
  });
  return urls;
}));

router.get("/sitemap-players.xml", handleSitemap('players', async (req) => {
  const host = getBaseUrl(req);
  const urls: any[] = [];
  const snap = await collections.players().limit(500).get();
  snap.forEach(doc => {
    const data = doc.data();
    const slug = createSlugPath(data.name || "player", doc.id);
    urls.push({ loc: `${host}/player/${slug}`, changefreq: 'weekly', priority: '0.6' });
  });
  return urls;
}));

router.get("/sitemap-news.xml", handleSitemap('news', async (req) => {
  const host = getBaseUrl(req);
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
