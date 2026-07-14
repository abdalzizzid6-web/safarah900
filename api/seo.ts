import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { collections, firestore } from "../server/firestore/collections";
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
import { createSlugPath, getIdFromSlug } from "../src/utils/slugify";

// --- CACHING & CONFIGURATION ---
const getBaseUrl = (req: Request) => "https://korea90.xyz";

const CACHE_SHORT = 300 * 1000;    // 5 minutes
const CACHE_MEDIUM = 3600 * 1000;  // 1 hour
const CACHE_LONG = 86400 * 1000;   // 24 hours

// Warm instance in-memory caches
let cachedIndexHtml: string | null = null;
const matchSsoCache: Record<string, { data: any; expiry: number }> = {};
const newsSsoCache: Record<string, { data: any; expiry: number }> = {};
const sitemapCache: Record<string, { xml: string; expiry: number }> = {};

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

const encodeUrlPath = (host: string, pathSegment: string): string => {
  const sanitizedPath = pathSegment.split("/").map(segment => encodeURIComponent(segment)).join("/");
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

// --- SEO INDEX PAGE LOADING ---
const getIndexHtml = () => {
  if (cachedIndexHtml && process.env.NODE_ENV === "production") return cachedIndexHtml;
  
  const distPath = path.join(process.cwd(), "dist");
  try {
    cachedIndexHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
    return cachedIndexHtml;
  } catch (e) {
    try {
      cachedIndexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
      return cachedIndexHtml;
    } catch (err) {
      return "<html><head><title>صافرة 90</title></head><body><div id=\"root\"></div></body></html>";
    }
  }
};

const generateBreadcrumbs = (pathname: string, pageTitle?: string) => {
  const items = [
    { name: "الرئيسية", url: "https://korea90.xyz/" }
  ];

  if (pathname.startsWith("/match/")) {
    items.push({ name: "جدول المباريات", url: "https://korea90.xyz/schedule" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | صافرة 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  } else if (pathname.startsWith("/news/")) {
    items.push({ name: "الأخبار الرياضية", url: "https://korea90.xyz/news" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | صافرة 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  } else if (pathname.includes("/standings")) {
    items.push({ name: "جدول الترتيب", url: "https://korea90.xyz/standings" });
  } else if (pathname.includes("/schedule")) {
    items.push({ name: "جدول المباريات", url: "https://korea90.xyz/schedule" });
  } else if (pathname.includes("/world-cup-2026")) {
    items.push({ name: "كأس العالم 2026", url: "https://korea90.xyz/world-cup-2026" });
  } else if (pathname.includes("/leagues")) {
    items.push({ name: "البطولات", url: "https://korea90.xyz/leagues" });
  } else if (pathname.includes("/team/")) {
    items.push({ name: "الأندية والفرق", url: "https://korea90.xyz/standings" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | صافرة 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  } else if (pathname.includes("/player/")) {
    items.push({ name: "اللاعبين", url: "https://korea90.xyz/standings" });
    if (pageTitle) {
      items.push({ name: pageTitle.replace(" | صافرة 90", ""), url: `https://korea90.xyz${pathname}` });
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

const injectSeo = (html: string, options: { 
  title?: string; 
  description?: string; 
  url: string; 
  image?: string;
  type?: string;
  structuredData?: any; 
  pathname: string;
}) => {
  const { title, description, url, image = "https://korea90.xyz/logo-master.png", type = "website", structuredData, pathname } = options;
  
  let result = html;
  
  result = result.replace(/<title>.*?<\/title>/gi, "");
  result = result.replace(/<meta name="description" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:title" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:description" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:url" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:image" content=".*?" \/>/gi, "");
  result = result.replace(/<meta property="og:type" content=".*?" \/>/gi, "");
  result = result.replace(/<link rel="canonical" href=".*?" \/>/gi, "");
  
  const fullTitle = title ? `${title} | صافرة 90` : "صافرة 90 | أهم أخبار ونتائج مباريات كرة القدم";
  const fullDescription = description || "صافرة 90 هي منصتك الأولى لمتابعة نتائج مباريات كرة القدم، البث المباشر، وأحدث الأخبار الرياضية العالمية والعربية لحظة بلحظة.";
  
  let headTags = "";
  
  headTags += `  <title>${fullTitle}</title>\n`;
  headTags += `  <meta name="description" content="${fullDescription}" />\n`;
  headTags += `  <link rel="canonical" href="${url}" />\n`;
  
  headTags += `  <meta property="og:title" content="${fullTitle}" />\n`;
  headTags += `  <meta property="og:description" content="${fullDescription}" />\n`;
  headTags += `  <meta property="og:url" content="${url}" />\n`;
  headTags += `  <meta property="og:image" content="${image}" />\n`;
  headTags += `  <meta property="og:type" content="${type}" />\n`;
  headTags += `  <meta property="og:locale" content="ar_AR" />\n`;
  headTags += `  <meta property="og:site_name" content="صافرة 90" />\n`;
  
  headTags += `  <meta name="twitter:card" content="summary_large_image" />\n`;
  headTags += `  <meta name="twitter:title" content="${fullTitle}" />\n`;
  headTags += `  <meta name="twitter:description" content="${fullDescription}" />\n`;
  headTags += `  <meta name="twitter:image" content="${image}" />\n`;
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://korea90.xyz/#organization",
    "name": "صافرة 90",
    "url": "https://korea90.xyz/",
    "logo": "https://korea90.xyz/logo-master.png",
    "sameAs": [
      "https://twitter.com/safara90",
      "https://facebook.com/safara90"
    ]
  };
  headTags += `  <script type="application/ld+json">\n${JSON.stringify(organizationSchema, null, 2)}\n  </script>\n`;
  
  const breadcrumbsSchema = generateBreadcrumbs(pathname, title);
  headTags += `  <script type="application/ld+json">\n${JSON.stringify(breadcrumbsSchema, null, 2)}\n  </script>\n`;
  
  if (structuredData) {
    headTags += `  <script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n  </script>\n`;
  }
  
  if (result.includes("<head>")) {
    result = result.replace("<head>", `<head>\n${headTags}`);
  } else if (result.includes("</head>")) {
    result = result.replace("</head>", `${headTags}</head>`);
  }
  
  return result;
};

// --- CORE UNIFIED HANDLER ---
export default async function handler(req: Request, res: Response) {
  const action = req.query.action as string;

  // 1. --- ROBOTS.TXT ROUTE ---
  if (action === "robots") {
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /vip
Disallow: /premium-services
Disallow: /*?*

Sitemap: https://korea90.xyz/sitemap.xml`);
  }

  // 2. --- SITEMAP XML ROUTE ---
  if (action === "sitemap") {
    const type = req.query.type as string;
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

      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.status(200).send(generateSitemapXml([]));
    } catch (err: any) {
      console.error("[SEO ERROR] Sitemap handler failed:", err);
      return res.status(200).send(generateSitemapXml([]));
    }
  }

  // 3. --- GENERAL HTML RENDER ROUTE ---
  const reqUrl = req.url || "/";
  const parsedUrl = new URL(reqUrl, "https://korea90.xyz");
  const pathname = parsedUrl.pathname;

  let html = getIndexHtml();

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=600");

  try {
    if (pathname.startsWith("/match/")) {
      const slug = pathname.split("/")[2] || "";
      const matchId = getIdFromSlug(slug);
      
      if (!matchId) {
        return res.status(200).send(html);
      }

      const nowMs = Date.now();
      let matchDoc: any = null;
      
      if (matchSsoCache[matchId] && matchSsoCache[matchId].expiry > nowMs) {
        matchDoc = matchSsoCache[matchId].data;
      } else {
        const doc = await firestore.collection("matches").doc(matchId).get();
        if (doc.exists) {
          matchDoc = { id: doc.id, ...doc.data(), exists: true };
          matchSsoCache[matchId] = { data: matchDoc, expiry: nowMs + 5 * 60 * 1000 };
        } else {
          matchDoc = { exists: false };
          matchSsoCache[matchId] = { data: matchDoc, expiry: nowMs + 2 * 60 * 1000 };
        }
      }

      const exists = matchDoc.exists;
      const isWcPattern = matchId.includes("2026-m-") || matchId.includes("2022-m-") || matchId.startsWith("wc-");

      if (!exists && !isWcPattern) {
        return res.status(404).send(html);
      }

      if (exists) {
        const data = matchDoc || {};
        const homeTeam = data.homeTeamName || (typeof data.homeTeam === "object" ? data.homeTeam.name : data.homeTeam) || "فريق 1";
        const awayTeam = data.awayTeamName || (typeof data.awayTeam === "object" ? data.awayTeam.name : data.awayTeam) || "فريق 2";
        const league = data.leagueName || (typeof data.league === "object" ? data.league.name : data.league) || "بطولة";
        
        const title = `مباراة ${homeTeam} ضد ${awayTeam} - ${league}`;
        const description = `تابع تفاصيل مباراة ${homeTeam} و ${awayTeam} في ${league}. البث المباشر، التشكيلات، والنتائج لحظة بلحظة على صافرة 90.`;
        
        const structuredData = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "name": title,
          "description": description,
          "startDate": data.startTime?.toDate?.()?.toISOString() || data.startTime,
          "homeTeam": { "@type": "SportsTeam", "name": homeTeam },
          "awayTeam": { "@type": "SportsTeam", "name": awayTeam },
          "location": { "@type": "Place", "name": data.venue || "ملعب المباراة" }
        };

        html = injectSeo(html, {
          title,
          description,
          url: `https://korea90.xyz/match/${slug}`,
          type: "article",
          structuredData,
          pathname
        });
      }
      return res.status(200).send(html);
    }

    if (pathname.startsWith("/news/")) {
      const slug = pathname.split("/")[2] || "";
      const newsId = getIdFromSlug(slug);

      if (!newsId) {
        return res.status(200).send(html);
      }

      const nowMs = Date.now();
      let newsDoc: any = null;

      if (newsSsoCache[newsId] && newsSsoCache[newsId].expiry > nowMs) {
        newsDoc = newsSsoCache[newsId].data;
      } else {
        const doc = await firestore.collection("news").doc(newsId).get();
        if (doc.exists) {
          newsDoc = { id: doc.id, ...doc.data(), exists: true };
          newsSsoCache[newsId] = { data: newsDoc, expiry: nowMs + 10 * 60 * 1000 };
        } else {
          newsDoc = { exists: false };
          newsSsoCache[newsId] = { data: newsDoc, expiry: nowMs + 2 * 60 * 1000 };
        }
      }

      if (!newsDoc.exists) {
        return res.status(404).send(html);
      }

      const data = newsDoc;
      const title = data.seo?.metaTitle || data.title;
      const description = data.seo?.metaDescription || data.excerpt || data.content?.substring(0, 160);
      const image = data.featuredImage?.url || data.image || "https://korea90.xyz/logo-master.png";

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": description,
        "image": [image],
        "datePublished": data.publishDate?.toDate?.()?.toISOString() || data.publishDate,
        "dateModified": data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        "author": { "@type": "Organization", "name": "صافرة 90" }
      };

      html = injectSeo(html, {
        title,
        description,
        url: `https://korea90.xyz/news/${slug}`,
        image,
        type: "article",
        structuredData,
        pathname
      });
      return res.status(200).send(html);
    }

    if (pathname.startsWith("/team/")) {
      const slug = pathname.split("/")[2] || "";
      const teamId = getIdFromSlug(slug);

      if (!teamId) {
        return res.status(200).send(html);
      }

      let teamDoc: any = null;
      try {
        const doc = await firestore.collection("teams").doc(teamId).get();
        if (doc.exists) {
          teamDoc = doc.data();
        }
      } catch (err) {
        console.warn(`[SEO Team Page] Failed to fetch team doc:`, err);
      }

      const teamName = teamDoc?.name || "نادي رياضي";
      const title = `نادي ${teamName} - مواعيد المباريات والنتائج والترتيب`;
      const description = `تابع آخر أخبار نادي ${teamName}، مبارياته القادمة، نتائجه الحالية، جدول الترتيب، وإحصائيات اللاعبين والتشكيلة على صافرة 90.`;
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        "name": teamName,
        "url": `https://korea90.xyz/team/${slug}`,
        "logo": teamDoc?.logo || "https://korea90.xyz/logo-master.png"
      };

      html = injectSeo(html, {
        title,
        description,
        url: `https://korea90.xyz/team/${slug}`,
        image: teamDoc?.logo || "https://korea90.xyz/logo-master.png",
        type: "article",
        structuredData,
        pathname
      });
      return res.status(200).send(html);
    }

    if (pathname.startsWith("/league/")) {
      const slug = pathname.split("/")[2] || "";
      const leagueId = getIdFromSlug(slug);

      if (!leagueId) {
        return res.status(200).send(html);
      }

      let leagueDoc: any = null;
      try {
        const doc = await firestore.collection("leagues").doc(leagueId).get();
        if (doc.exists) {
          leagueDoc = doc.data();
        }
      } catch (err) {
        console.warn(`[SEO League Page] Failed to fetch league doc:`, err);
      }

      const leagueName = leagueDoc?.name || "البطولة";
      const title = `دوري ${leagueName} - جدول الترتيب، المباريات والنتائج`;
      const description = `تابع نتائج مباريات دوري ${leagueName}، جدول الترتيب المحدث لحظة بلحظة، قائمة الهدافين وأخبار البطولة على صافرة 90.`;

      const structuredData = {
        "@context": "https://schema.org",
        "@type": "SportsOrganization",
        "name": leagueName,
        "url": `https://korea90.xyz/league/${slug}`,
        "logo": leagueDoc?.logo || "https://korea90.xyz/logo-master.png"
      };

      html = injectSeo(html, {
        title,
        description,
        url: `https://korea90.xyz/league/${slug}`,
        image: leagueDoc?.logo || "https://korea90.xyz/logo-master.png",
        type: "article",
        structuredData,
        pathname
      });
      return res.status(200).send(html);
    }

    if (pathname === "/") {
      const homeSeo = injectSeo(html, {
        title: "الرئيسية - أهم أخبار ونتائج مباريات كرة القدم",
        description: "صافرة 90 هي منصتك الأولى لمتابعة نتائج مباريات كرة القدم، البث المباشر، وأحدث الأخبار الرياضية العالمية والعربية لحظة بلحظة.",
        url: "https://korea90.xyz/",
        structuredData: {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "صافرة 90",
          "url": "https://korea90.xyz/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://korea90.xyz/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        pathname
      });
      return res.status(200).send(homeSeo);
    }

    let pageTitle = "";
    let pageDesc = "";

    if (pathname.includes("/standings")) {
      pageTitle = "جدول الترتيب - ترتيب فرق الدوريات الكبرى والبطولات";
      pageDesc = "احصل على جدول الترتيب المحدث باستمرار لجميع الدوريات والبطولات الكبرى واللاعبين والهدافين على صافرة 90.";
    } else if (pathname.includes("/schedule")) {
      pageTitle = "جدول المباريات - مواعيد مباريات اليوم والغد";
      pageDesc = "تابع مواعيد مباريات اليوم والغد والامس لكافة البطولات العالمية والمحلية مع القنوات الناقلة وتفاصيل التغطية المباشرة.";
    } else if (pathname.includes("/world-cup-2026")) {
      pageTitle = "كأس العالم 2026 - تغطية شاملة لبطولة كأس العالم";
      pageDesc = "تغطية حية ومباشرة لمباريات كأس العالم 2026، المجموعات، ترتيب الفرق والهدافين على صافرة 90.";
    } else if (pathname.includes("/news")) {
      pageTitle = "آخر الأخبار الرياضية - أخبار كرة القدم العالمية والعربية";
      pageDesc = "تغطية متكاملة لآخر أخبار الانتقالات والمباريات في الدوريات الأوروبية والعربية والعالمية على مدار الساعة.";
    }

    if (pageTitle) {
      html = injectSeo(html, {
        title: pageTitle,
        description: pageDesc,
        url: `https://korea90.xyz${pathname}`,
        pathname
      });
    }

    return res.status(200).send(html);
  } catch (e) {
    console.error(`[SEO Serverless Error] Failed to process meta:`, e);
    return res.status(200).send(html);
  }
}
