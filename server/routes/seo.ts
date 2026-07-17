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
 * Robust date parser supporting:
 * - Firestore Timestamp (with toDate method or _seconds/seconds fields)
 * - JavaScript Date
 * - String
 * - Number
 * - null/undefined (falls back safely to current Date)
 */
const safeToDate = (val: any): Date => {
  if (!val) return new Date();
  
  if (typeof val.toDate === "function") {
    try {
      return val.toDate();
    } catch (e) {
      // ignore and fall through
    }
  }
  
  if (typeof val.seconds === "number" || typeof val._seconds === "number") {
    const s = val.seconds ?? val._seconds;
    const ns = val.nanoseconds ?? val._nanoseconds ?? 0;
    return new Date(s * 1000 + ns / 1000000);
  }
  
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : val;
  }
  
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  
  return new Date();
};

/**
 * URL segment encoder for sitemap URLs.
 * Ensures Arabic slugs are percent-encoded correctly according to RFC 3986.
 */
const encodeUrlPath = (host: string, path: string): string => {
  const sanitizedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${host}/${sanitizedPath}`;
};

/**
 * Robust URL encoder for images or full links
 */
const encodeFullUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    const encodedPath = url.pathname.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `${url.protocol}//${url.host}${encodedPath}${url.search}${url.hash}`;
  } catch (e) {
    return urlStr;
  }
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
    console.error("[SEO ERROR] Sitemap index generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(500).send(`<!-- Error: ${err.message} -->`);
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
  } catch (err: any) {
    console.error("[SEO ERROR] sitemap-main.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(500).send(`<!-- Error: ${err.message} -->`);
  }
});

router.get("/sitemap-matches.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('matches', CACHE_SHORT, async () => {
      try {
        const host = getBaseUrl(req);
        const urls: any[] = [];
        const snap = await collections.matches().orderBy('startTime', 'desc').limit(1000).get();
        
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const match = normalizeMatch({ ...data, id: doc.id });
            if (!match || match.isHidden) return;

            const isPlaceholder = (name: string) => {
              if (!name) return true;
              const lower = name.toLowerCase();
              return lower.includes('unknown') || lower.includes('tbd') || lower === 'team' || name === 'قيد التحديد';
            };

            if (isPlaceholder(match.homeName) && isPlaceholder(match.awayName)) return;
            if (!match.slug || match.slug === 'undefined' || match.slug.includes('[object Object]')) return;
            
            const rawLastMod = data.updatedAt || data.startTime;
            const lastModDate = safeToDate(rawLastMod);

            urls.push({
              loc: encodeUrlPath(host, `match/${match.slug}`),
              changefreq: 'daily',
              priority: '0.8',
              lastmod: lastModDate.toISOString()
            });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing match doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      } catch (e: any) {
        console.error("[SEO ERROR] Sitemap generation failed (matches), returning empty.", e);
        return generateSitemapXml([]);
      }
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error("[SEO ERROR] sitemap-matches.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-news.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('news', CACHE_SHORT, async () => {
      try {
        const host = getBaseUrl(req);
        const urls: any[] = [];
        const snap = await collections.news().orderBy('publishDate', 'desc').limit(500).get();
        
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const news = normalizeNews({ ...data, id: doc.id });
            if (!news || !news.slug || news.slug === 'undefined' || news.slug.includes('[object Object]')) return;
            
            const pubDate = safeToDate(data.publishDate).toISOString();
            
            urls.push({
              loc: encodeUrlPath(host, `news/${news.slug}`),
              title: news.title || "خبر جديد",
              publicationDate: pubDate,
              name: "سفراء 90",
              language: "ar"
            });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing news doc ${doc.id}:`, docErr);
          }
        });
        return generateNewsSitemapXml(urls);
      } catch (e: any) {
        console.error("[SEO ERROR] Sitemap generation failed (news), returning empty.", e);
        return generateNewsSitemapXml([]);
      }
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err: any) {
    console.error("[SEO ERROR] sitemap-news.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(500).send(`<!-- Error: ${err.message} -->`);
  }
});

router.get("/sitemap-images.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('images', CACHE_MEDIUM, async () => {
      try {
        const host = getBaseUrl(req);
        const urls: any[] = [];
        
        const newsSnap = await collections.news().orderBy('publishDate', 'desc').limit(100).get();
        newsSnap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const news = normalizeNews({ ...data, id: doc.id });
            if (!news || !news.slug || news.slug === 'undefined' || news.slug.includes('[object Object]')) return;
            
            const imageField = data.image || data.featuredImage?.url;
            if (imageField) {
              const imgUrl = imageField.startsWith('http') ? imageField : `${host}${imageField.startsWith('/') ? '' : '/'}${imageField}`;
              urls.push({
                loc: encodeUrlPath(host, `news/${news.slug}`),
                images: [{ loc: encodeFullUrl(imgUrl), title: news.title || "صورة الخبر" }]
              });
            }
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing image for news doc ${doc.id}:`, docErr);
          }
        });

        return generateImageSitemapXml(urls);
      } catch (e: any) {
        console.error("[SEO ERROR] Sitemap generation failed (images), returning empty.", e);
        return generateImageSitemapXml([]);
      }
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error("[SEO ERROR] sitemap-images.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateImageSitemapXml([]));
  }
});

router.get("/sitemap-leagues.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('leagues', CACHE_LONG, async () => {
      try {
        const host = getBaseUrl(req);
        const urls: any[] = [];
        const snap = await collections.leagues().limit(100).get();
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const league = normalizeLeague({ ...data, id: doc.id });
            if (!league || !league.slug || league.slug === 'undefined' || league.slug.includes('[object Object]')) return;
            urls.push({ loc: encodeUrlPath(host, `league/${league.slug}`), changefreq: 'daily', priority: '0.8' });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing league doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      } catch (e: any) {
        console.error("[SEO ERROR] Sitemap generation failed (leagues), returning empty.", e);
        return generateSitemapXml([]);
      }
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error("[SEO ERROR] sitemap-leagues.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-teams.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('teams', CACHE_LONG, async () => {
      try {
        const host = getBaseUrl(req);
        const urls: any[] = [];
        const snap = await collections.teams().limit(500).get();
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const team = normalizeTeam({ ...data, id: doc.id });
            if (!team || !team.slug || team.slug === 'undefined' || team.slug.includes('[object Object]')) return;
            urls.push({ loc: encodeUrlPath(host, `team/${team.slug}`), changefreq: 'weekly', priority: '0.7' });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing team doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      } catch (e: any) {
        console.error("[SEO ERROR] Sitemap generation failed (teams), returning empty.", e);
        return generateSitemapXml([]);
      }
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error("[SEO ERROR] sitemap-teams.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

router.get("/sitemap-players.xml", async (req, res) => {
  try {
    const xml = await getCachedOrGenerate('players', CACHE_LONG, async () => {
      try {
        const host = getBaseUrl(req);
        const urls: any[] = [];
        const snap = await collections.players().limit(500).get();
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const slug = createSlugPath(data.name || "player", doc.id);
            if (!slug || slug === 'undefined' || slug.includes('[object Object]')) return;
            urls.push({ loc: encodeUrlPath(host, `player/${slug}`), changefreq: 'weekly', priority: '0.6' });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing player doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      } catch (e: any) {
        console.error("[SEO ERROR] Sitemap generation failed (players), returning empty.", e);
        return generateSitemapXml([]);
      }
    });
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error("[SEO ERROR] sitemap-players.xml generation failed:", err);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml([]));
  }
});

export default router;
