import express from "express";
import { collections } from "../firestore/collections";
import { generateSitemapIndexXml, generateSitemapXml, generateNewsSitemapXml, generateImageSitemapXml } from "../utils/seoHelpers";
import { normalizeMatch, normalizeLeague, normalizeTeam, normalizeNews } from "../utils/normalizer";
import { createSlugPath } from "../utils/slugify";

const router = express.Router();

const getBaseUrl = (req: express.Request) => {
  return "https://korea90.xyz";
};

// Cache durations
const CACHE_SHORT = 300 * 1000;    // 5 minutes
const CACHE_MEDIUM = 3600 * 1000;  // 1 hour
const CACHE_LONG = 86400 * 1000;   // 24 hours

let sitemapCache: Record<string, { xml: string, expiry: number }> = {};

export const clearSitemapCache = () => {
    sitemapCache = {};
    console.log("[SEO] Sitemap cache cleared.");
};

/**
 * LOGGING MIDDLEWARE for SEO
 */
router.use((req, res, next) => {
  if (req.path.includes('sitemap') || req.path.includes('robots.txt')) {
    console.log(`[SEO ROUTE] ${req.method} ${req.path} from ${req.get('host')}`);
  }
  next();
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
      `${host}/sitemap-news.xml`,
      `${host}/sitemap-images.xml`
    ];
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(generateSitemapIndexXml(sitemapsList));
  } catch (err: any) {
    console.error("[SEO ERROR] Sitemap index failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(generateSitemapIndexXml([]));
  }
});

const getCachedOrGenerate = async (
  key: string, 
  duration: number, 
  generator: () => Promise<string>
): Promise<string> => {
  const now = Date.now();
  if (sitemapCache[key] && sitemapCache[key].expiry > now) {
    return sitemapCache[key].xml;
  }

  const xml = await generator();
  sitemapCache[key] = {
    xml,
    expiry: now + duration
  };
  return xml;
};

router.get("/sitemap-main.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('main', CACHE_LONG, async () => {
      const host = getBaseUrl(req);
      const urls = [
        { loc: `${host}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${host}/world-cup-2026`, changefreq: 'weekly', priority: '0.9' },
        { loc: `${host}/standings`, changefreq: 'daily', priority: '0.8' },
        { loc: `${host}/schedule`, changefreq: 'always', priority: '0.9' },
        { loc: `${host}/news`, changefreq: 'always', priority: '0.9' },
      ];
      return generateSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-matches.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('matches', CACHE_SHORT, async () => {
      const host = getBaseUrl(req);
      const urls: any[] = [];
      const snap = await collections.matches().orderBy('startTime', 'desc').limit(1000).get();
      
      snap.forEach(doc => {
        const data = doc.data();
        const match = normalizeMatch({ ...data, id: doc.id });
        if (!match || match.isHidden) return;

        const isPlaceholder = (name: string) => {
          if (!name) return true;
          const lower = name.toLowerCase();
          return lower.includes('unknown') || lower.includes('tbd') || lower === 'team' || name === 'قيد التحديد';
        };

        if (isPlaceholder(match.homeName) && isPlaceholder(match.awayName)) return;
        if (!match.slug || match.slug === 'undefined' || match.slug.includes('[object Object]')) return;
        
        urls.push({
          loc: `${host}/match/${match.slug}`,
          changefreq: 'daily',
          priority: '0.8',
          lastmod: (data.updatedAt?.toDate?.() || data.startTime?.toDate?.() || new Date()).toISOString()
        });
      });
      return generateSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-news.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('news', CACHE_SHORT, async () => {
      const host = getBaseUrl(req);
      const urls: any[] = [];
      const snap = await collections.news().orderBy('publishDate', 'desc').limit(500).get();
      
      snap.forEach(doc => {
        const data = doc.data();
        const news = normalizeNews({ ...data, id: doc.id });
        const pubDate = (data.publishDate?.toDate?.() || new Date()).toISOString();
        if (!news.slug || news.slug === 'undefined' || news.slug.includes('[object Object]')) return;
        
        urls.push({
          loc: `${host}/news/${news.slug}`,
          title: news.title,
          publicationDate: pubDate,
          name: "سفراء 90",
          language: "ar"
        });
      });
      return generateNewsSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-images.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('images', CACHE_MEDIUM, async () => {
      const host = getBaseUrl(req);
      const urls: any[] = [];
      
      // Add news images
      const newsSnap = await collections.news().orderBy('publishDate', 'desc').limit(100).get();
      newsSnap.forEach(doc => {
        const data = doc.data();
        const news = normalizeNews({ ...data, id: doc.id });
        const imageField = data.image || data.featuredImage?.url;
        if (!news.slug || news.slug === 'undefined' || news.slug.includes('[object Object]')) return;
        if (imageField) {
          const imgUrl = imageField.startsWith('http') ? imageField : `${host}${imageField.startsWith('/') ? '' : '/'}${imageField}`;
          urls.push({
            loc: `${host}/news/${news.slug}`,
            images: [{ loc: imgUrl, title: news.title }]
          });
        }
      });

      return generateImageSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-leagues.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('leagues', CACHE_LONG, async () => {
      const host = getBaseUrl(req);
      const urls: any[] = [];
      const snap = await collections.leagues().limit(100).get();
      snap.forEach(doc => {
        const league = normalizeLeague({ ...doc.data(), id: doc.id });
        if (!league.slug || league.slug === 'undefined' || league.slug.includes('[object Object]')) return;
        urls.push({ loc: `${host}/league/${league.slug}`, changefreq: 'daily', priority: '0.8' });
      });
      return generateSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-teams.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('teams', CACHE_LONG, async () => {
      const host = getBaseUrl(req);
      const urls: any[] = [];
      const snap = await collections.teams().limit(500).get();
      snap.forEach(doc => {
        const team = normalizeTeam({ ...doc.data(), id: doc.id });
        if (!team.slug || team.slug === 'undefined' || team.slug.includes('[object Object]')) return;
        urls.push({ loc: `${host}/team/${team.slug}`, changefreq: 'weekly', priority: '0.7' });
      });
      return generateSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-players.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('players', CACHE_LONG, async () => {
      const host = getBaseUrl(req);
      const urls: any[] = [];
      const snap = await collections.players().limit(500).get();
      snap.forEach(doc => {
        const data = doc.data();
        const slug = createSlugPath(data.name || "player", doc.id);
        if (!slug || slug === 'undefined' || slug.includes('[object Object]')) return;
        urls.push({ loc: `${host}/player/${slug}`, changefreq: 'weekly', priority: '0.6' });
      });
      return generateSitemapXml(urls);
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

export default router;
