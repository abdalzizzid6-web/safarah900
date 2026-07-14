import { Request, Response } from "express";
import { collections } from "../server/firestore/collections";
import { 
  generateSitemapIndexXml, 
  generateSitemapXml, 
  generateNewsSitemapXml, 
  generateImageSitemapXml 
} from "../server/utils/seoHelpers";
import { 
  normalizeMatch, 
  normalizeLeague, 
  normalizeTeam, 
  normalizeNews 
} from "../server/utils/normalizer";
import { createSlugPath } from "../src/utils/slugify";

const getBaseUrl = (req: Request) => {
  return "https://korea90.xyz";
};

// Cache durations
const CACHE_SHORT = 300 * 1000;    // 5 minutes
const CACHE_MEDIUM = 3600 * 1000;  // 1 hour
const CACHE_LONG = 86400 * 1000;   // 24 hours

// In-memory cache for serverless (persists on warm instances)
let sitemapCache: Record<string, { xml: string; expiry: number }> = {};

const safeToDate = (val: any): Date => {
  if (!val) return new Date();
  
  if (typeof val.toDate === "function") {
    try {
      return val.toDate();
    } catch (e) {
      // ignore
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

const encodeUrlPath = (host: string, path: string): string => {
  const sanitizedPath = path.split("/").map(segment => encodeURIComponent(segment)).join("/");
  return `${host}/${sanitizedPath}`;
};

const encodeFullUrl = (urlStr: string): string => {
  try {
    const url = new URL(urlStr);
    const encodedPath = url.pathname.split("/").map(segment => encodeURIComponent(segment)).join("/");
    return `${url.protocol}//${url.host}${encodedPath}${url.search}${url.hash}`;
  } catch (e) {
    return urlStr;
  }
};

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

export default async function handler(req: Request, res: Response) {
  const { type } = req.query;
  const host = getBaseUrl(req);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  try {
    if (!type || type === "index") {
      const sitemapsList = [
        `${host}/sitemap-main.xml`,
        `${host}/sitemap-matches.xml`,
        `${host}/sitemap-leagues.xml`,
        `${host}/sitemap-teams.xml`,
        `${host}/sitemap-players.xml`,
        `${host}/sitemap-news.xml`,
        `${host}/sitemap-images.xml`
      ];
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.status(200).send(generateSitemapIndexXml(sitemapsList));
    }

    if (type === "main") {
      const xml = await getCachedOrGenerate("main", CACHE_LONG, async () => {
        const urls = [
          { loc: `${host}/`, changefreq: "daily", priority: "1.0" },
          { loc: `${host}/world-cup-2026`, changefreq: "weekly", priority: "0.9" },
          { loc: `${host}/standings`, changefreq: "daily", priority: "0.8" },
          { loc: `${host}/schedule`, changefreq: "always", priority: "0.9" },
          { loc: `${host}/news`, changefreq: "always", priority: "0.9" },
        ];
        return generateSitemapXml(urls);
      });
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(xml);
    }

    if (type === "matches") {
      const xml = await getCachedOrGenerate("matches", CACHE_SHORT, async () => {
        const urls: any[] = [];
        const snap = await collections.matches().orderBy("startTime", "desc").limit(1000).get();
        
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const match = normalizeMatch({ ...data, id: doc.id });
            if (!match || match.isHidden) return;

            const isPlaceholder = (name: string) => {
              if (!name) return true;
              const lower = name.toLowerCase();
              return lower.includes("unknown") || lower.includes("tbd") || lower === "team" || name === "قيد التحديد";
            };

            if (isPlaceholder(match.homeName) && isPlaceholder(match.awayName)) return;
            if (!match.slug || match.slug === "undefined" || match.slug.includes("[object Object]")) return;
            
            const rawLastMod = data.updatedAt || data.startTime;
            const lastModDate = safeToDate(rawLastMod);

            urls.push({
              loc: encodeUrlPath(host, `match/${match.slug}`),
              changefreq: "daily",
              priority: "0.8",
              lastmod: lastModDate.toISOString()
            });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing match doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      });
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
      return res.status(200).send(xml);
    }

    if (type === "news") {
      const xml = await getCachedOrGenerate("news", CACHE_SHORT, async () => {
        const urls: any[] = [];
        const snap = await collections.news().orderBy("publishDate", "desc").limit(500).get();
        
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const news = normalizeNews({ ...data, id: doc.id });
            if (!news || !news.slug || news.slug === "undefined" || news.slug.includes("[object Object]")) return;
            
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
      });
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
      return res.status(200).send(xml);
    }

    if (type === "images") {
      const xml = await getCachedOrGenerate("images", CACHE_MEDIUM, async () => {
        const urls: any[] = [];
        
        const newsSnap = await collections.news().orderBy("publishDate", "desc").limit(100).get();
        newsSnap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const news = normalizeNews({ ...data, id: doc.id });
            if (!news || !news.slug || news.slug === "undefined" || news.slug.includes("[object Object]")) return;
            
            const imageField = data.image || data.featuredImage?.url;
            if (imageField) {
              const imgUrl = imageField.startsWith("http") ? imageField : `${host}${imageField.startsWith("/") ? "" : "/"}${imageField}`;
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
      });
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      return res.status(200).send(xml);
    }

    if (type === "leagues") {
      const xml = await getCachedOrGenerate("leagues", CACHE_LONG, async () => {
        const urls: any[] = [];
        const snap = await collections.leagues().limit(100).get();
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const league = normalizeLeague({ ...data, id: doc.id });
            if (!league || !league.slug || league.slug === "undefined" || league.slug.includes("[object Object]")) return;
            urls.push({ loc: encodeUrlPath(host, `league/${league.slug}`), changefreq: "daily", priority: "0.8" });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing league doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      });
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(xml);
    }

    if (type === "teams") {
      const xml = await getCachedOrGenerate("teams", CACHE_LONG, async () => {
        const urls: any[] = [];
        const snap = await collections.teams().limit(500).get();
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const team = normalizeTeam({ ...data, id: doc.id });
            if (!team || !team.slug || team.slug === "undefined" || team.slug.includes("[object Object]")) return;
            urls.push({ loc: encodeUrlPath(host, `team/${team.slug}`), changefreq: "weekly", priority: "0.7" });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing team doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      });
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(xml);
    }

    if (type === "players") {
      const xml = await getCachedOrGenerate("players", CACHE_LONG, async () => {
        const urls: any[] = [];
        const snap = await collections.players().limit(500).get();
        snap.forEach((doc: any) => {
          try {
            const data = doc.data();
            if (!data) return;
            const slug = createSlugPath(data.name || "player", doc.id);
            if (!slug || slug === "undefined" || slug.includes("[object Object]")) return;
            urls.push({ loc: encodeUrlPath(host, `player/${slug}`), changefreq: "weekly", priority: "0.6" });
          } catch (docErr) {
            console.error(`[SEO WARNING] Error processing player doc ${doc.id}:`, docErr);
          }
        });
        return generateSitemapXml(urls);
      });
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(xml);
    }

    // Default sitemap fallback
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(generateSitemapXml([]));
  } catch (err: any) {
    console.error("[SEO ERROR] Sitemap handler failed:", err);
    return res.status(200).send(generateSitemapXml([]));
  }
}
