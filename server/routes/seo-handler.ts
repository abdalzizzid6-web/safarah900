import express from "express";
import { collections } from "../firestore/collections";
import { generateSitemapIndexXml, generateSitemapXml, generateNewsSitemapXml, generateImageSitemapXml } from "../utils/seoHelpers";
import { normalizeMatch, normalizeLeague, normalizeTeam, normalizeNews } from "../utils/normalizer";
import { createSlugPath } from "../utils/slugify";

const router = express.Router();

const getBaseUrl = (req: express.Request) => "https://korea90.xyz";

const CACHE_SHORT = 300 * 1000;    // 5 minutes
const CACHE_MEDIUM = 3600 * 1000;  // 1 hour
const CACHE_LONG = 86400 * 1000;   // 24 hours

let sitemapCache: Record<string, { xml: string, expiry: number }> = {};

const safeToDate = (val: any): Date => {
  if (!val) return new Date();
  if (typeof val.toDate === "function") try { return val.toDate(); } catch (e) {}
  if (typeof val.seconds === "number" || typeof val._seconds === "number") {
    const s = val.seconds ?? val._seconds;
    const ns = val.nanoseconds ?? val._nanoseconds ?? 0;
    return new Date(s * 1000 + ns / 1000000);
  }
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

const encodeUrlPath = (host: string, path: string): string => {
  const sanitizedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${host}/${sanitizedPath}`;
};

const encodeFullUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    const encodedPath = url.pathname.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return `${url.protocol}//${url.host}${encodedPath}${url.search}${url.hash}`;
  } catch (e) { return urlStr; }
};

const getCachedOrGenerate = async (
  key: string, 
  duration: number, 
  generator: () => Promise<string>
): Promise<string> => {
  const now = Date.now();
  if (sitemapCache[key] && sitemapCache[key].expiry > now) return sitemapCache[key].xml;
  const xml = await generator();
  sitemapCache[key] = { xml, expiry: now + duration };
  return xml;
};

// Robots.txt
router.get("/robots.txt", (req, res) => {
  const host = getBaseUrl(req);
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /vip
Disallow: /premium-services
Disallow: /*?*

Sitemap: ${host}/sitemap.xml`);
});

// Sitemap Index
router.get("/sitemap.xml", (req, res) => {
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
});

// Sitemaps... (matches, news, etc. would go here, imported from server/routes/seo.ts)
// I will keep it simple for now and just add these two as requested.

export default router;
