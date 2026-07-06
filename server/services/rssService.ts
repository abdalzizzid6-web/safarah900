import RSSParser from "rss-parser";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { isUrlSafe } from "../utils/slugify";
import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";
import { generateContentWithRetry } from "./aiService";
import { Type } from "@google/genai";

const parser = new RSSParser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure']
    ]
  }
});

export const rssHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml;q=0.9, image/webp, */*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="127", "Google Chrome";v="127"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Connection': 'keep-alive'
};

function getHeadersForUrl(url: string, baseHeaders: any = rssHeaders) {
  const headers = { ...baseHeaders };
  try {
    const urlObj = new URL(url);
    headers['Referer'] = `${urlObj.protocol}//${urlObj.hostname}/`;
    headers['Host'] = urlObj.hostname;
  } catch (e) {
    // If URL is invalid, just use base headers
  }
  return headers;
}

// Simple Levenshtein distance to detect title similarity
function getTitleSimilarity(s1: string, s2: string): number {
  const clean = (s: string) => s.toLowerCase().replace(/[^\w\u0621-\u064A\s]/gi, '').replace(/\s+/g, ' ').trim();
  const a = clean(s1);
  const b = clean(s2);
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);
  return (maxLength - distance) / maxLength;
}

// Download and cache feed images locally, ensuring directories exist
async function downloadAndCacheImage(url: string | undefined, providerId: string): Promise<string> {
  if (!url) return "/data/rss_fallback.jpg";
  try {
    const dirPath = path.join(process.cwd(), "public", "data", "rss_images");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const fileHash = crypto.createHash("md5").update(url).digest("hex");
    const fileName = `${providerId}_${fileHash}.jpg`;
    const localPath = path.join(dirPath, fileName);
    const publicUrl = `/data/rss_images/${fileName}`;

    if (fs.existsSync(localPath)) {
      return publicUrl;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers: { 'User-Agent': rssHeaders['User-Agent'] }, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
    return publicUrl;
  } catch (err: any) {
    console.warn(`[RSS Image Service] Failed to cache image: ${url}. Error: ${err.message}`);
    return "/data/rss_fallback.jpg"; // Sports premium fallback illustration
  }
}

let cachedTeams: { id: string; name: string; arabicName: string }[] | null = null;
let cachedPlayers: { id: string; name: string; arabicName: string }[] | null = null;
let cachedLeagues: { id: string; name: string; arabicName: string }[] | null = null;
let cachedLiveMatches: any[] | null = null;
let lastLiveMatchesFetch = 0;
let cacheTimestamp = 0;
let leaguesCacheTimestamp = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (Increased from 5 minutes)
const LIVE_MATCHES_TTL = 10 * 60 * 1000; // 10 minutes

const knownGuids = new Set<string>();
const knownUrls = new Set<string>();
const knownTitles = new Set<string>();
const recentArticlesCache: Array<{ id: string, title: string }> = [];
let isRssCacheInitialized = false;

async function ensureRssCache() {
  if (isRssCacheInitialized || isFirestoreQuotaExceeded) return;
  try {
    if (!firestore) return;
    console.log("[RSS Service Cache] Warming up in-memory GUIDs, URLs, and titles from last 500 imports...");
    const snapshot = await firestore.collection("rss_imports")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();
    
    knownGuids.clear();
    knownUrls.clear();
    knownTitles.clear();
    recentArticlesCache.length = 0;

    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.guid) {
        knownGuids.add(data.guid);
        const guidHash = crypto.createHash("md5").update(data.guid).digest("hex");
        knownGuids.add(guidHash);
      }
      if (data.originalUrl) {
        knownUrls.add(data.originalUrl);
        const urlHash = crypto.createHash("md5").update(data.originalUrl).digest("hex");
        knownUrls.add(urlHash);
      }
      if (data.title) {
        const titleLower = data.title.trim().toLowerCase();
        knownTitles.add(titleLower);
        recentArticlesCache.push({ id: d.id, title: data.title });
      }
      knownGuids.add(d.id);
    }
    isRssCacheInitialized = true;
    console.log(`[RSS Service Cache] Warm-up complete. Cached ${knownGuids.size} GUIDs, ${knownUrls.size} URLs, ${knownTitles.size} titles, and ${recentArticlesCache.length} recent articles.`);
  } catch (err: any) {
    if (isFirebaseQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
    } else {
      console.error("[RSS Service Cache] Failed to initialize:", err.message);
    }
  }
}

async function getCachedTeamsAndPlayers() {
  if (isFirestoreQuotaExceeded) {
    return { teams: cachedTeams || [], players: cachedPlayers || [] };
  }
  const now = Date.now();
  if (!cachedTeams || !cachedPlayers || now - cacheTimestamp > CACHE_TTL) {
    try {
      console.log("[Smart Linking Cache] Fetching teams and players for local memory cache...");
      if (firestore) {
        const teamsSnap = await firestore.collection('teams').limit(150).get();
        cachedTeams = teamsSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "", arabicName: d.arabicName || "" };
        });

        const playersSnap = await firestore.collection('players').limit(150).get();
        cachedPlayers = playersSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "", arabicName: d.arabicName || "" };
        });
        
        cacheTimestamp = now;
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("[Smart Linking Cache] Failed to populate cache:", err);
      }
      cachedTeams = cachedTeams || [];
      cachedPlayers = cachedPlayers || [];
    }
  }
  return { teams: cachedTeams || [], players: cachedPlayers || [] };
}

async function getCachedLeagues() {
  if (isFirestoreQuotaExceeded) {
    return cachedLeagues || [];
  }
  const now = Date.now();
  if (!cachedLeagues || now - leaguesCacheTimestamp > CACHE_TTL) {
    try {
      if (firestore) {
        console.log("[Smart Linking Cache] Fetching leagues for local memory cache...");
        const leaguesSnap = await firestore.collection('leagues').limit(50).get();
        cachedLeagues = leaguesSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "", arabicName: d.arabicName || "" };
        });
        leaguesCacheTimestamp = now;
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("[Leagues Cache] Failed to populate cache:", err);
      }
      cachedLeagues = cachedLeagues || [];
    }
  }
  return cachedLeagues || [];
}

async function findSmartLinks(detected: { teams: string[]; players: string[]; league: string }) {
  const links: { matchId?: string; teamIds: string[]; playerIds: string[]; competitionId?: string; worldCupPageLinked?: boolean } = {
    teamIds: [],
    playerIds: [],
  };

  if (!firestore || isFirestoreQuotaExceeded) return links;

  const { teams: allTeams, players: allPlayers } = await getCachedTeamsAndPlayers();

  // 1. Match Teams
  if (detected.teams && detected.teams.length > 0) {
    for (const dt of detected.teams) {
      const search = dt.toLowerCase().trim();
      const match = allTeams.find(t => 
        t.name.toLowerCase().includes(search) || 
        t.arabicName.toLowerCase().includes(search) ||
        search.includes(t.name.toLowerCase()) ||
        search.includes(t.arabicName.toLowerCase())
      );
      if (match) {
        links.teamIds.push(match.id);
      }
    }
    links.teamIds = Array.from(new Set(links.teamIds));
  }

  // 2. Match Players
  if (detected.players && detected.players.length > 0) {
    for (const dp of detected.players) {
      const search = dp.toLowerCase().trim();
      const match = allPlayers.find(p => 
        p.name.toLowerCase().includes(search) || 
        p.arabicName.toLowerCase().includes(search) ||
        search.includes(p.name.toLowerCase()) ||
        search.includes(p.arabicName.toLowerCase())
      );
      if (match) {
        links.playerIds.push(match.id);
      }
    }
    links.playerIds = Array.from(new Set(links.playerIds));
  }

  // 3. Match Competitions / Leagues
  if (detected.league) {
    try {
      const allLeagues = await getCachedLeagues();
      const search = detected.league.toLowerCase().trim();
      for (const league of allLeagues) {
        const name = league.name.toLowerCase();
        const arName = league.arabicName.toLowerCase();
        if (name.includes(search) || arName.includes(search) || search.includes(name) || search.includes(arName)) {
          links.competitionId = league.id;
          break;
        }
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("Match league link failed:", err);
      }
    }
  }

  // 4. Match matches
  if (links.teamIds.length > 0) {
    try {
      const targetTeamId = links.teamIds[0];
      const now = Date.now();
      
      // Use in-memory cache for live matches during sync cycle
      if (!cachedLiveMatches || now - lastLiveMatchesFetch > LIVE_MATCHES_TTL) {
        const matchesSnap = await firestore.collection('matches')
          .where('isLive', '==', true)
          .limit(20)
          .get();
        cachedLiveMatches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        lastLiveMatchesFetch = now;
      }
      
      let matchResult = cachedLiveMatches.find(m => m.homeTeamId === targetTeamId || m.awayTeamId === targetTeamId);
      
      if (matchResult) {
        links.matchId = matchResult.id;
      } else {
        // Only if not found in live, check recent (limit this to avoid too many reads)
        const recentSnap = await firestore.collection('matches')
          .orderBy('utcDate', 'desc')
          .limit(10)
          .get();
        for (const doc of recentSnap.docs) {
          const m = doc.data();
          if (m.homeTeamId === targetTeamId || m.awayTeamId === targetTeamId) {
            links.matchId = doc.id;
            break;
          }
        }
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("Smart linking match failed:", err);
      }
    }
  }

  // 5. World cup page
  const textStr = detected.league || "";
  if (textStr.includes("كأس العالم") || textStr.includes("World Cup")) {
    links.worldCupPageLinked = true;
  }

  return links;
}

async function searchMediaLibrary(query: string): Promise<string[]> {
  const images: string[] = [];
  if (!firestore || isFirestoreQuotaExceeded) return images;
  try {
    const snap = await firestore.collection('news').orderBy('createdAt', 'desc').limit(20).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const imageUrl = data.featuredImage?.url;
      if (imageUrl && !imageUrl.includes('fallback') && !images.includes(imageUrl)) {
        images.push(imageUrl);
      }
    }

    const teamsSnap = await firestore.collection('teams').limit(15).get();
    for (const doc of teamsSnap.docs) {
      const data = doc.data();
      const logoUrl = data.logo || data.badge;
      if (logoUrl && !images.includes(logoUrl)) {
        images.push(logoUrl);
      }
    }
  } catch (err: any) {
    if (isFirebaseQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
    } else {
      console.error("Failed to search media library:", err);
    }
  }
  return images.slice(0, 5);
}

// Deterministic backup classifier in case Gemini API is missing or fails
function runFallbackClassification(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const suggestedTags: string[] = [];
  let league = "عام";
  let country = "عالمي";
  let competition = "بطولة عامة";
  let articleType = "تقرير إخباري";
  const teams: string[] = [];
  const players: string[] = [];

  // Localized keywords mapping
  const leagueKeywords: Record<string, { league: string; tags: string[]; country: string; comp: string }> = {
    "الدوري الإسباني": { league: "الدوري الإسباني", tags: ["لا ليغا", "الليغا الإسبانية"], country: "إسبانيا", comp: "La Liga" },
    "لاليغا": { league: "الدوري الإسباني", tags: ["لا ليغا"], country: "إسبانيا", comp: "La Liga" },
    "la liga": { league: "الدوري الإسباني", tags: ["لا ليغا"], country: "إسبانيا", comp: "La Liga" },
    "الدوري الإنجليزي": { league: "الدوري الإنجليزي الممتاز", tags: ["البريميرليغ", "الدوري الإنجليزي"], country: "إنجلترا", comp: "Premier League" },
    "البريميرليغ": { league: "الدوري الإنجليزي الممتاز", tags: ["البريميرليغ"], country: "إنجلترا", comp: "Premier League" },
    "premier league": { league: "الدوري الإنجليزي الممتاز", tags: ["البريميرليغ"], country: "إنجلترا", comp: "Premier League" },
    "دوري أبطال أوروبا": { league: "دوري أبطال أوروبا", tags: ["دوري الأبطال", "ذات الأذنين"], country: "أوروبا", comp: "Champions League" },
    "champions league": { league: "دوري أبطال أوروبا", tags: ["دوري الأبطال"], country: "أوروبا", comp: "Champions League" },
    "الدوري السعودي": { league: "دوري روشن السعودي", tags: ["الدوري السعودي", "روشن"], country: "السعودية", comp: "Saudi Pro League" },
    "دوري روشن": { league: "دوري روشن السعودي", tags: ["الدوري السعودي"], country: "السعودية", comp: "Saudi Pro League" }
  };

  const teamKeywords: Record<string, string> = {
    "ريال مدريد": "ريال مدريد", "برشلونة": "برشلونة", "أتلتيكو": "أتلتيكو مدريد",
    "مانشستر سيتي": "مانشستر سيتي", "السيتي": "مانشستر سيتي", "ليفربول": "ليفربول",
    "مانشستر يونايتد": "مانشستر يونايتد", "اليونايتد": "مانشستر يونايتد", "آرسنال": "آرسنال",
    "الهلال": "الهلال السعودي", "النصر": "النصر السعودي", "الاتحاد": "الاتحاد السعودي", "الأهلي": "الأهلي السعودي",
    "الأهلي المصري": "الأهلي المصري", "الزمالك": "الزمالك المصري", "الوداد": "الوداد البيضاوي", "الرجاء": "الرجاء الرياضي"
  };

  const playerKeywords: Record<string, string> = {
    "ميسي": "ليونيل ميسي", "رونالدو": "كريستيانو رونالدو", "مبابي": "كيليان مبابي",
    "صلاح": "محمد صلاح", "هالاند": "إرلينغ هالاند", "فينيسيوس": "فينيسيوس جونيور",
    "بيلينجهام": "جود بيلينجهام", "بنزيما": "كريم بنزيما", "نيمار": "نيمار جونيور"
  };

  for (const [key, val] of Object.entries(leagueKeywords)) {
    if (text.includes(key)) {
      league = val.league;
      country = val.country;
      competition = val.comp;
      suggestedTags.push(...val.tags);
    }
  }

  for (const [key, name] of Object.entries(teamKeywords)) {
    if (text.includes(key)) {
      teams.push(name);
      suggestedTags.push(name);
    }
  }

  for (const [key, name] of Object.entries(playerKeywords)) {
    if (text.includes(key)) {
      players.push(name);
      suggestedTags.push(name);
    }
  }

  if (text.includes("عاجل") || text.includes("رسميا") || text.includes("تأكيد")) {
    articleType = "خبر عاجل";
    suggestedTags.push("عاجل");
  } else if (text.includes("ميركاتو") || text.includes("انتقال") || text.includes("صفقة")) {
    articleType = "سوق الانتقالات";
    suggestedTags.push("ميركاتو");
  }

  const finalTags = Array.from(new Set([...suggestedTags, "أخبار رياضية", "كرة القدم"]));
  const cleanSnippet = description.replace(/<[^>]*>/g, "").slice(0, 155);
  const wordsCount = description.split(/\s+/).length + title.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordsCount / 200));

  return {
    classification: { league, competition, teams, players, country, articleType, suggestedTags: finalTags.slice(0, 8) },
    seo: {
      slug: title.replace(/[^\w\u0621-\u064A\s-]/gi, '').replace(/\s+/g, '-').toLowerCase(),
      metaTitle: `${title.slice(0, 50)} | سفارة ٩٠`,
      metaDescription: cleanSnippet,
      readingTime
    },
    intelligence: {
      summaryEn: `Summary of the article: ${title}`,
      summaryAr: `خلاصة التقرير: ${title}`,
      seoHeadline: `${title} | تفاصيل الخبر الكاملة`,
      shortHeadline: title.slice(0, 30),
      difficulty: "متوسط" as const,
      importanceScore: 70,
      trendingScore: 50,
      breakingScore: text.includes("عاجل") ? 90 : 20,
      qualityScore: 80,
      qualityBreakdown: {
        originality: 80,
        completeness: 85,
        seo: 75,
        readability: 85,
        freshness: 90,
        mediaQuality: 70
      }
    },
    sportsDetection: {
      competition,
      league,
      season: "2025/2026",
      round: "الجولة الحالية",
      teams,
      players,
      coach: "غير محدد",
      country,
      stadium: "ملعب اللقاء",
      referee: "غير متوفر",
      matchDate: new Date().toISOString().split('T')[0]
    },
    imageIntel: {
      altText: title,
      caption: title,
      credit: "محرر سفارة ٩٠",
      suggestedImages: []
    },
    aiEditor: {
      headlineSuggestions: [title, `تطورات جديدة: ${title}`, `متابعة حية: ${title}`],
      seoTitleSuggestion: `${title} - آخر الأخبار`,
      metaDescriptionSuggestion: cleanSnippet,
      slugSuggestion: title.replace(/[^\w\u0621-\u064A\s-]/gi, '').replace(/\s+/g, '-').toLowerCase(),
      keywordsSuggestion: finalTags.slice(0, 5),
      structureSuggestion: "البنية ممتازة وتغطي كافة التفاصيل الأساسية للحدث الرياضي."
    },
    translations: {
      titleEn: `Translated Title: ${title}`,
      titleAr: title,
      descriptionEn: `English translation of description: ${cleanSnippet}`,
      descriptionAr: description
    }
  };
}

// Scraping full article text & high-quality images from the web page of originalUrl using cheerio
export async function fetchFullArticleScrapedData(url: string): Promise<{ text: string; imageUrl: string | null }> {
  if (!url) return { text: "", imageUrl: null };
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    const res = await fetch(url, { headers: rssHeaders, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[RSS Full Content Scraper] Non-ok response fetching from ${url}: ${res.status}`);
      return { text: "", imageUrl: null };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract high-resolution image from meta tags (og:image, twitter:image, etc.)
    let imageUrl: string | null = null;
    const ogImg = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') ||
                  $('meta[property="og:image:secure_url"]').attr('content') ||
                  $('link[rel="image_src"]').attr('href');
                  
    if (ogImg && ogImg.startsWith('http')) {
      imageUrl = ogImg.trim();
    }

    // Remove scripts, styles, iframe, ads, header, footer, sidebars, comments
    $('script, style, iframe, nav, header, footer, .ads, .sidebar, .comments, #comments, .footer, .header, noscript, .social-share, .newsletter-signup').remove();

    const paragraphs: string[] = [];

    // Common selectors used for article paragraphs across Hespress, Kooora, FilGoal, Yallakora, etc.
    const articleSelectors = [
      '.hespress-post-content p', // Specific Hespress post content
      'article p',
      '.article-body p',
      '.article-content p',
      '.entry-content p',
      '.story-content p',
      '#article-body p',
      '.news-content p',
      '.content-text p',
      '.post-content p',
      '.article-pages p'
    ];

    let foundParagraphs = false;
    for (const selector of articleSelectors) {
      const elms = $(selector);
      if (elms.length > 2) {
        elms.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 30 && !shouldSkipParagraph(text)) {
            paragraphs.push(text);
          }
        });
        foundParagraphs = true;
        break;
      }
    }

    if (!foundParagraphs) {
      // Fallback: get all p tags in the body that have content of reasonable length
      $('body p').each((_, el) => {
        const text = $(el).text().trim();
        // Skip small text, cookies, social share icons, copyrights, newsletter ads
        if (text.length > 45 && !shouldSkipParagraph(text)) {
          paragraphs.push(text);
        }
      });
    }

    const cleanedText = paragraphs.join('\n\n').trim();
    return { text: cleanedText, imageUrl };
  } catch (err: any) {
    console.warn(`[RSS Full Content Scraper] Failed to fetch full content from ${url}:`, err.message);
    return { text: "", imageUrl: null };
  }
}

function shouldSkipParagraph(text: string): boolean {
  const lowercase = text.toLowerCase();
  const noiseKeywords = [
    'cookie', 'الشروط والأحكام', 'سياسة الخصوصية', 'حقوق الطبع', 'اشترك في', 'تابعونا على', 
    'تابعنا على', 'مواقع التواصل', 'تواصل معنا', 'اقرأ أيضاً', 'مواضيع ذات صلة', 'الاشتراك في النشرة',
    'قم بتحميل تطبيق', 'تطبيق هسبريس', 'حمل التطبيق', 'شارك هذا الموضوع', 'اضغط هنا', 'سجل الآن'
  ];
  return noiseKeywords.some(keyword => lowercase.includes(keyword));
}

export async function fetchFullArticleText(url: string): Promise<string> {
  const data = await fetchFullArticleScrapedData(url);
  return data.text;
}

// Enterprise AI Classification powered by Gemini 3.5-flash
export async function classifyArticleWithAi(title: string, description: string): Promise<any> {
  const suggestedImages = await searchMediaLibrary(title);

  if (!process.env.GEMINI_API_KEY) {
    const fallback = runFallbackClassification(title, description);
    fallback.imageIntel.suggestedImages = suggestedImages;
    return fallback;
  }

  try {
    const prompt = `
    Analyze the following sports news article and perform core classification, intelligence diagnostics, quality analysis, translations, image intelligence and AI editor formatting.
    Output details strictly in the requested JSON format. Avoid adding any markdown formatting outside the JSON block.

    Article Context:
    - Title: "${title}"
    - Full Scraped Article Content: "${description.replace(/<[^>]*>/g, "").slice(0, 12000)}"

    You MUST return a JSON object containing exactly:
    1. "classification": {
         "league": The specific league (e.g., "الدوري الإنجليزي الممتاز", "الدوري الإسباني", "دوري أبطال أوروبا", "عام") in Arabic.
         "competition": The English name of the competition or league (e.g., "Premier League", "La Liga", "UEFA Champions League", "General").
         "teams": List of named football teams mentioned (e.g. ["ريال مدريد", "ليفربول"]).
         "players": List of named football players mentioned (e.g. ["محمد صلاح", "كيليان mbappe"]).
         "country": Country associated with this news in Arabic (e.g., "إسبانيا", "إنجلترا", "مصر", "عالمي").
         "articleType": Type of news article (e.g., "تقرير إخباري", "خبر عاجل", "سوق الانتقالات", "تحليل تكتيكي", "حوار صحفي").
         "suggestedTags": List of up to 6 Arabic tags.
       }
    2. "seo": {
         "slug": A URL friendly Arabic/English slug.
         "metaTitle": SEO friendly meta title in Arabic (maximum 65 chars).
         "metaDescription": SEO meta description in Arabic summarizing the news (maximum 160 chars).
         "readingTime": Estimated reading time in minutes (integer).
       }
    3. "intelligence": {
         "summaryEn": High quality Executive Summary of the article in English.
         "summaryAr": Engaging Arabic summary/executive brief of the article.
         "seoHeadline": Highly engaging, SEO optimized headline in Arabic.
         "shortHeadline": Suggested short punchy headline (maximum 5 words) in Arabic.
         "difficulty": Reading level difficulty in Arabic (must be exactly "مبتدئ" or "متوسط" or "متقدم").
         "importanceScore": Rating of news importance from 1 to 100 (integer).
         "trendingScore": Rating of trending potential from 1 to 100 (integer).
         "breakingScore": Rating of breaking urgency from 1 to 100 (integer).
         "qualityScore": Overall calculated quality score (1 to 100).
         "qualityBreakdown": {
           "originality": score 1-100,
           "completeness": score 1-100,
           "seo": score 1-100,
           "readability": score 1-100,
           "freshness": score 1-100,
           "mediaQuality": score 1-100
         }
       }
    4. "sportsDetection": {
         "competition": Arabic competition name,
         "league": Arabic league name,
         "season": e.g. "2025/2026",
         "round": League round if mentioned or "غير محدد",
         "teams": List of teams mentioned,
         "players": List of players mentioned,
         "coach": Coach name if mentioned or "غير محدد",
         "country": Arabic country name,
         "stadium": Stadium name if mentioned or "غير محدد",
         "referee": Referee name if mentioned or "غير محدد",
         "matchDate": Approximate Match Date (YYYY-MM-DD format) or "غير محدد"
       }
    5. "imageIntel": {
         "altText": SEO friendly Alt Text for article featured image,
         "caption": Meaningful image caption,
         "credit": Image copyright or source credit
       }
    6. "aiEditor": {
         "headlineSuggestions": List of 3 alternative click-worthy headlines in Arabic,
         "seoTitleSuggestion": Suggested SEO Title in Arabic,
         "metaDescriptionSuggestion": Suggested Meta Description,
         "slugSuggestion": Suggested URL slug,
         "keywordsSuggestion": List of 5 SEO keywords,
         "structureSuggestion": Structural feedback on paragraph layout, flow, and statistics.
       }
    7. "translations": {
         "titleEn": English translation of the title,
         "titleAr": Polished Arabic title,
         "descriptionEn": English translation of the description summary,
         "descriptionAr": Complete, full news article beautifully rewritten in professional sports journalism style in Arabic. Write the entire article content in full, keeping all tactical details, quotes, stats, and background info. DO NOT truncate or summarize it. DO NOT mention the source name (such as Hespress, Kooora, FilGoal, Yallakora) anywhere in the body, headings, or title. Let it read like a direct neutral report from our desk. We will append the source name at the end of the article.
       }
    `;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite AI sports journalist and SEO expert trained in sports taxonomy, executive briefing, Arabic copywriting, translation, and media analysis.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classification: {
              type: Type.OBJECT,
              properties: {
                league: { type: Type.STRING },
                competition: { type: Type.STRING },
                teams: { type: Type.ARRAY, items: { type: Type.STRING } },
                players: { type: Type.ARRAY, items: { type: Type.STRING } },
                country: { type: Type.STRING },
                articleType: { type: Type.STRING },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["league", "competition", "teams", "players", "country", "articleType", "suggestedTags"]
            },
            seo: {
              type: Type.OBJECT,
              properties: {
                slug: { type: Type.STRING },
                metaTitle: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                readingTime: { type: Type.INTEGER }
              },
              required: ["slug", "metaTitle", "metaDescription", "readingTime"]
            },
            intelligence: {
              type: Type.OBJECT,
              properties: {
                summaryEn: { type: Type.STRING },
                summaryAr: { type: Type.STRING },
                seoHeadline: { type: Type.STRING },
                shortHeadline: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                importanceScore: { type: Type.INTEGER },
                trendingScore: { type: Type.INTEGER },
                breakingScore: { type: Type.INTEGER },
                qualityScore: { type: Type.INTEGER },
                qualityBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    originality: { type: Type.INTEGER },
                    completeness: { type: Type.INTEGER },
                    seo: { type: Type.INTEGER },
                    readability: { type: Type.INTEGER },
                    freshness: { type: Type.INTEGER },
                    mediaQuality: { type: Type.INTEGER }
                  },
                  required: ["originality", "completeness", "seo", "readability", "freshness", "mediaQuality"]
                }
              },
              required: ["summaryEn", "summaryAr", "seoHeadline", "shortHeadline", "difficulty", "importanceScore", "trendingScore", "breakingScore", "qualityScore", "qualityBreakdown"]
            },
            sportsDetection: {
              type: Type.OBJECT,
              properties: {
                competition: { type: Type.STRING },
                league: { type: Type.STRING },
                season: { type: Type.STRING },
                round: { type: Type.STRING },
                teams: { type: Type.ARRAY, items: { type: Type.STRING } },
                players: { type: Type.ARRAY, items: { type: Type.STRING } },
                coach: { type: Type.STRING },
                country: { type: Type.STRING },
                stadium: { type: Type.STRING },
                referee: { type: Type.STRING },
                matchDate: { type: Type.STRING }
              },
              required: ["competition", "league", "season", "round", "teams", "players", "coach", "country", "stadium", "referee", "matchDate"]
            },
            imageIntel: {
              type: Type.OBJECT,
              properties: {
                altText: { type: Type.STRING },
                caption: { type: Type.STRING },
                credit: { type: Type.STRING }
              },
              required: ["altText", "caption", "credit"]
            },
            aiEditor: {
              type: Type.OBJECT,
              properties: {
                headlineSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoTitleSuggestion: { type: Type.STRING },
                metaDescriptionSuggestion: { type: Type.STRING },
                slugSuggestion: { type: Type.STRING },
                keywordsSuggestion: { type: Type.ARRAY, items: { type: Type.STRING } },
                structureSuggestion: { type: Type.STRING }
              },
              required: ["headlineSuggestions", "seoTitleSuggestion", "metaDescriptionSuggestion", "slugSuggestion", "keywordsSuggestion", "structureSuggestion"]
            },
            translations: {
              type: Type.OBJECT,
              properties: {
                titleEn: { type: Type.STRING },
                titleAr: { type: Type.STRING },
                descriptionEn: { type: Type.STRING },
                descriptionAr: { type: Type.STRING }
              },
              required: ["titleEn", "titleAr", "descriptionEn", "descriptionAr"]
            }
          },
          required: ["classification", "seo", "intelligence", "sportsDetection", "imageIntel", "aiEditor", "translations"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        ...parsed,
        imageIntel: {
          ...parsed.imageIntel,
          suggestedImages
        }
      };
    }
    throw new Error("Empty response text from Gemini");
  } catch (err: any) {
    console.error(`[AI Classification Failure] Falling back to deterministic parsing: ${err.message}`);
    const fallback = runFallbackClassification(title, description);
    fallback.imageIntel.suggestedImages = suggestedImages;
    return fallback;
  }
}

// Helper to parse RSS feed safely with aggressive sanitization for malformed XML
async function parseRssFeedSafely(xml: string) {
  try {
    return await parser.parseString(xml);
  } catch (err: any) {
    const errorMsg = err.message || "";
    if (errorMsg.includes('Attribute without value') || errorMsg.includes('malformed') || errorMsg.includes('Invalid character') || errorMsg.includes('Unexpected close tag')) {
      console.log("[RSS Service] Malformed XML detected, attempting aggressive sanitization...");
      // Fix attributes without values (e.g., <item attr> or <item attr=>)
      let sanitized = xml.replace(/<([a-zA-Z0-9:-]+)([^>]+)>/g, (m, tag, attrs) => {
        let fixedAttrs = attrs
          .replace(/(\s+[a-zA-Z0-9:-]+)(?!=)(\s|>)/g, '$1=""$2') // attr -> attr=""
          .replace(/(\s+[a-zA-Z0-9:-]+=)(?=\s|>)/g, '$1""');     // attr= -> attr=""
        return `<${tag}${fixedAttrs}>`;
      });
      
      // Fix double ampersands which break XML
      sanitized = sanitized.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-fA-F0-9]+);)/g, '&amp;');
      
      // Fix unclosed tags in some extreme cases (very basic)
      // (Normally parser handles this if it's not too bad)

      return await parser.parseString(sanitized);
    }
    throw err;
  }
}

// Synchronize articles from a single RSS Provider
export async function syncRssProvider(providerId: string): Promise<{ success: boolean; importedCount: number; duplicateCount: number; error?: string }> {
  if (!providerId || providerId === 'undefined' || providerId === 'null') {
    return { success: false, importedCount: 0, duplicateCount: 0, error: "Invalid Provider ID" };
  }
  if (providerId === 'kooora_news') {
    await temporaryDisableKooora();
    return { success: false, importedCount: 0, duplicateCount: 0, error: 'Disabled - Manual Fix' };
  }
  if (!firestore) return { success: false, importedCount: 0, duplicateCount: 0, error: "Database not ready" };

  if (isFirestoreQuotaExceeded) {
    console.warn(`[RSS Service] Bypassing sync for provider ${providerId} due to Firestore Quota limit exceeded.`);
    return { success: false, importedCount: 0, duplicateCount: 0, error: "Firestore Quota Exceeded (Bypassed Gracefully)" };
  }

  try {
    const provDoc = await firestore.collection("rss_sources").doc(providerId).get();
    if (!provDoc.exists) throw new Error("Provider not found");
    const provider = provDoc.data() || {};
    const feedUrl = provider.url || provider.feedUrl;

    if (!feedUrl) throw new Error("Provider has no Feed URL");
    if (!isUrlSafe(feedUrl)) throw new Error("Blocked URL (Private Range / SSRF Protection)");

    console.log(`[RSS Service] Syncing provider: ${provider.name} (${feedUrl})`);

    // Set status to SYNCING in background so UI displays current activity
    try {
      await firestore.collection("rss_sources").doc(providerId).update({
        status: "SYNCING",
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn(`[rssService] Failed to update status to SYNCING for ${providerId}:`, err.message);
    }

    let response: any = null;
    let fetchError: any = null;

    // Stage 1: Try with default rssHeaders
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const headers = getHeadersForUrl(feedUrl);
      if (providerId === 'filgoal') {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
        headers['Referer'] = 'https://www.filgoal.com/';
        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
        headers['Accept-Language'] = 'en-US,en;q=0.5';
      }

      response = await fetch(feedUrl, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (err: any) {
      fetchError = err;
      // console.warn(`[RSS Service] Stage 1 fetch failed`);
    }

    // Stage 2: If failed, or 403/401/500, try with simplified headers
    if (!response || !response.ok || [401, 403, 500, 502, 503].includes(response.status)) {
      console.log(`[RSS Service] Stage 2: Retrying ${provider.name} with simple browser headers...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const simpleHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/'
        };
        const retryRes = await fetch(feedUrl, { headers: simpleHeaders, signal: controller.signal });
        clearTimeout(timeoutId);
        if (retryRes.ok) {
          response = retryRes;
        } else if (!response || (response.status === 403 && retryRes.status !== 403)) {
          response = retryRes;
        }
      } catch (err: any) {
        // silent
      }
    }

    // Stage 3: If still blocked (e.g. 403), try with Googlebot
    if (!response || !response.ok || response.status === 403) {
      console.log(`[RSS Service] Stage 3: Retrying ${provider.name} with search-crawler profile...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const botHeaders = {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        };
        const botRes = await fetch(feedUrl, { headers: botHeaders, signal: controller.signal });
        clearTimeout(timeoutId);
        if (botRes.ok) {
          response = botRes;
        } else if (response.status === 403 && botRes.status !== 403) {
          response = botRes;
        }
      } catch (err: any) {
        // silent
      }
    }

    // Stage 4: If STILL blocked (e.g. 403), use a secure public proxy fallback
    if (!response || !response.ok || response.status === 403) {
      console.log(`[RSS Service] Stage 4: Using secure CORS/RSS proxy fallback for ${provider.name}...`);
      
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
        `https://corsproxy.org/?${encodeURIComponent(feedUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`,
        `https://thingproxy.freeboard.io/fetch/${feedUrl}`,
        `https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all`
      ];

      for (const proxyUrl of proxies) {
        try {
          if (proxyUrl.includes('proxyscrape')) continue; // Skip raw proxy list for now
          
          console.log(`[RSS Service] Trying proxy: ${proxyUrl}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); 
          
          const headers = {
            'User-Agent': [
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            ][Math.floor(Math.random() * 3)]
          };

          const proxyRes = await fetch(proxyUrl, { 
            headers,
            signal: controller.signal 
          });
          clearTimeout(timeoutId);
          
          if (proxyRes.ok) {
            let xmlContent = await proxyRes.text();
            
            if (xmlContent && (xmlContent.includes('<rss') || xmlContent.includes('<feed') || xmlContent.includes('<?xml'))) {
              response = {
                ok: true,
                status: 200,
                text: async () => xmlContent
              };
              console.log(`[RSS Service] Successfully fetched ${provider.name} RSS feed via proxy: ${proxyUrl}`);
              break;
            }
          }
        } catch (err: any) {
          // silent
        }
      }
    }

    if (!response || !response.ok) {
      throw new Error(`HTTP Error ${response ? response.status : 'unknown'}`);
    }
    const xml = await response.text();
    let parsedFeed: any = null;
    try {
      parsedFeed = await parseRssFeedSafely(xml);
    } catch (parseErr: any) {
      console.error(`[RSS Service] Failed to parse XML for ${provider.name}. Snippet: ${xml.slice(0, 200)}`);
      throw new Error(`Parsing Error: ${parseErr.message}`);
    }

    let importedCount = 0;
    let duplicateCount = 0;
    const MAX_IMPORTS_PER_RUN = 4; // Strict budget to prevent Firestore write & Gemini API quota exhaustion

    // Populate the in-memory cache if not already done
    await ensureRssCache();

    for (const item of (parsedFeed.items || []) as any[]) {
      const guid = item.guid || item.id || item.link;
      const originalUrl = item.link || "";
      const title = item.title || "";
      const rawDesc = item.contentEncoded || item.description || item.content || "";
      
      if (!title || !originalUrl) continue;

      // 1. GUID & Original URL Check using in-memory cache
      const guidHash = crypto.createHash("md5").update(guid).digest("hex");
      const urlHash = crypto.createHash("md5").update(originalUrl).digest("hex");

      if (knownGuids.has(guid) || knownGuids.has(guidHash) || knownUrls.has(originalUrl) || knownUrls.has(urlHash)) {
        duplicateCount++;
        continue;
      }

      // 2. Local title similarity check using in-memory cache list
      let isTitleDuplicate = false;
      let matchedDuplicateId = "";
      for (const rec of recentArticlesCache) {
        const similarity = getTitleSimilarity(title, rec.title);
        if (similarity > 0.82) {
          isTitleDuplicate = true;
          matchedDuplicateId = rec.id;
          break;
        }
      }

      if (isTitleDuplicate) {
        duplicateCount++;
        continue;
      }

      // 3. Enforce strict budget limit per sync cycle to prevent Firestore / Gemini quota exhaustion
      if (importedCount >= MAX_IMPORTS_PER_RUN) {
        console.log(`[RSS Sync Limit] Reached maximum budget of ${MAX_IMPORTS_PER_RUN} new articles for provider "${provider.name}" during this run. Pausing to safeguard API & Firestore quotas.`);
        break;
      }

      // Extra sanitization of HTML
      const cleanedSnippet = rawDesc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      // Fetch full article content & discover high-quality featured images directly from the article's webpage
      let fullContent = "";
      let scrapedImageUrl: string | null = null;
      try {
        console.log(`[RSS Sync] Scraping full webpage text & images: ${originalUrl}`);
        const scraped = await fetchFullArticleScrapedData(originalUrl);
        fullContent = scraped.text;
        scrapedImageUrl = scraped.imageUrl;
      } catch (err: any) {
        console.warn(`[RSS Sync] Failed to scrape webpage for content: ${err.message}`);
      }

      // Extract image URL from feed item
      let imageSrc = "";
      if (item.enclosure?.url) {
        imageSrc = item.enclosure.url;
      } else if (item.mediaContent?.url) {
        imageSrc = item.mediaContent.url;
      } else if (item.mediaContent && (item.mediaContent as any).$?.url) {
        imageSrc = (item.mediaContent as any).$.url;
      } else {
        // Fallback: parse first image tag inside HTML description using Cheerio
        const $ = cheerio.load(rawDesc);
        const firstImg = $("img").first().attr("src");
        if (firstImg) imageSrc = firstImg;
      }

      // Fallback: If feed item image is missing or invalid, use the high-quality og:image scraped from the web page!
      if ((!imageSrc || imageSrc.includes("fallback") || imageSrc.length < 5) && scrapedImageUrl) {
        console.log(`[RSS Sync] Feed image missing/invalid. Successfully fallback to high-res scraped og:image: ${scrapedImageUrl}`);
        imageSrc = scrapedImageUrl;
      }

      // Download and cache image in WebP/local directory
      const cachedImgUrl = await downloadAndCacheImage(imageSrc, providerId);

      // USER MANDATE: Do not fetch news unless they have a full article and a valid featured image
      if (!imageSrc || !cachedImgUrl || cachedImgUrl === "/data/rss_fallback.jpg") {
        console.log(`[RSS Sync] Skipped article: "${title}" - Missing or invalid featured image.`);
        continue;
      }

      // USER MANDATE: Do not fetch news unless they have a full article and a valid featured image
      if (!fullContent || fullContent.trim().length < 350) {
        console.log(`[RSS Sync] Skipped article: "${title}" - Lacks full article content (length: ${fullContent ? fullContent.trim().length : 0} chars, expected >= 350).`);
        continue;
      }

      const contentToProcess = fullContent;

      // AI/Deterministic Classification & SEO generation
      const meta = await classifyArticleWithAi(title, contentToProcess);

      // We append the source cleanly at the end of the article content, as requested by the user
      let polishedBody = meta.translations?.descriptionAr || contentToProcess;
      
      // Clean up any stray mentions of the source name in the body to comply with "only mention source at end"
      const cleanSourcePrefixes = ["المصدر:", "مصدر:", "نقلاً عن:", "كتب:"];
      for (const prefix of cleanSourcePrefixes) {
        const regex = new RegExp(`${prefix}\\s*${provider.name}`, "gi");
        polishedBody = polishedBody.replace(regex, "");
      }

      // Append clean source mention at the end of the article
      const sourceSuffix = `\n\nالمصدر: ${provider.name}`;
      if (!polishedBody.includes("المصدر:")) {
        polishedBody = `${polishedBody.trim()}${sourceSuffix}`;
      }

      // Smart Linking Integration
      const smartLinks = await findSmartLinks({
        teams: meta.classification.teams,
        players: meta.classification.players,
        league: meta.classification.league
      });

      // Create primary slug
      const slugBase = title.replace(/[^\w\u0621-\u064A\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
      const randomSuffix = crypto.randomBytes(3).toString("hex");
      const slug = `${slugBase}-${randomSuffix}`;

      const nowStr = new Date().toISOString();
      const importDocPayload = {
        id: guidHash,
        guid,
        originalUrl,
        title,
        description: polishedBody,
        rawHtml: rawDesc.slice(0, 10000),
        author: item.creator || item.author || provider.name || "محرر سفارة ٩٠",
        sourceName: provider.name,
        sourceLogo: provider.logo || "",
        providerId,
        imageUrl: cachedImgUrl,
        mainImage: cachedImgUrl,
        image: cachedImgUrl,
        pubDate: item.pubDate || item.isoDate || nowStr,
        status: "REVIEW", // REVIEW = Pending Review, APPROVED, REJECTED, PUBLISHED, ARCHIVED
        classification: meta.classification,
        intelligence: meta.intelligence,
        sportsDetection: meta.sportsDetection,
        imageIntel: meta.imageIntel,
        aiEditor: meta.aiEditor,
        translations: {
          ...meta.translations,
          descriptionAr: polishedBody
        },
        smartLinks: smartLinks,
        seo: {
          slug,
          metaTitle: meta.seo.metaTitle,
          metaDescription: meta.seo.metaDescription,
          readingTime: meta.seo.readingTime,
          canonicalUrl: originalUrl,
          openGraph: {
            title: meta.seo.metaTitle,
            description: meta.seo.metaDescription,
            image: cachedImgUrl
          },
          twitterCard: {
            title: meta.seo.metaTitle,
            description: meta.seo.metaDescription,
            image: cachedImgUrl,
            cardType: "summary_large_image"
          },
          structuredData: {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": title,
            "image": [cachedImgUrl],
            "datePublished": item.pubDate || item.isoDate || nowStr,
            "author": {
              "@type": "Organization",
              "name": provider.name
            }
          },
          keywords: meta.classification.suggestedTags,
          includeInSitemap: true
        },
        createdAt: nowStr,
        updatedAt: nowStr
      };

      // Add to Firestore incoming queue
      await firestore.collection("rss_imports").doc(guidHash).set(importDocPayload);
      importedCount++;

      // Update in-memory cache to prevent subsequent sync duplicate reads/writes
      knownGuids.add(guid);
      knownGuids.add(guidHash);
      knownUrls.add(originalUrl);
      knownUrls.add(urlHash);
      knownTitles.add(title.trim().toLowerCase());
      recentArticlesCache.unshift({ id: guidHash, title });
      if (recentArticlesCache.length > 300) {
        recentArticlesCache.pop();
      }
    }

    // Update provider record with sync statistics
    try {
      await firestore.collection("rss_sources").doc(providerId).update({
        lastSync: new Date().toISOString(),
        lastError: null,
        status: "ACTIVE"
      });
    } catch (saveErr: any) {
      console.warn(`[rssService] Failed to update active status for provider ${providerId}:`, saveErr.message);
    }

    return { success: true, importedCount, duplicateCount };

  } catch (err: any) {
    const isQuota = isFirebaseQuotaError(err);
    if (isQuota) {
      setFirestoreQuotaExceeded(true);
      return { success: false, importedCount: 0, duplicateCount: 0, error: "Firestore Quota Exceeded" };
    }
    console.error(`[RSS Service Error] Provider sync failed for ${providerId}: ${err.message}`);
    try {
      await firestore.collection("rss_sources").doc(providerId).set({
        lastError: err.message,
        lastSync: new Date().toISOString(),
        status: "FAILED"
      }, { merge: true });
    } catch (saveErr: any) {
      console.warn(`[rssService] Failed to update failure status for provider ${providerId}:`, saveErr.message);
    }

    return { success: false, importedCount: 0, duplicateCount: 0, error: err.message };
  }
}

// Sync all active RSS providers
export async function syncAllRssProviders(): Promise<{ totalImported: number; totalDuplicates: number; results: any[] }> {
  if (!firestore) return { totalImported: 0, totalDuplicates: 0, results: [] };
  
  if (isFirestoreQuotaExceeded) {
    console.warn("[syncAllRssProviders] Bypassing syncAllRssProviders due to Firestore Quota limit exceeded.");
    return {
      totalImported: 0,
      totalDuplicates: 0,
      results: [
        {
          providerId: "quota-limit",
          name: "حد استهلاك قاعدة البيانات متجاوز",
          success: false,
          importedCount: 0,
          duplicateCount: 0,
          error: "Firestore Quota Exceeded (Bypassed Gracefully)"
        }
      ]
    };
  }

  try {
    const providersSnapshot = await firestore.collection("rss_sources").where("enabled", "==", true).get();
    const results: any[] = [];
    let totalImported = 0;
    let totalDuplicates = 0;

    for (const doc of providersSnapshot.docs) {
      try {
        const res = await syncRssProvider(doc.id);
        totalImported += res.importedCount;
        totalDuplicates += res.duplicateCount;
        results.push({
          providerId: doc.id,
          name: doc.data().name,
          ...res
        });
      } catch (innerErr: any) {
        console.error(`[syncAllRssProviders] Error syncing provider ${doc.id}:`, innerErr.message);
        results.push({
          providerId: doc.id,
          name: doc.data().name,
          success: false,
          importedCount: 0,
          duplicateCount: 0,
          error: innerErr.message
        });
      }
    }

    return { totalImported, totalDuplicates, results };
  } catch (err: any) {
    console.error("[syncAllRssProviders] Failed completely:", err.message);
    const isQuota = isFirebaseQuotaError(err);
    if (isQuota) {
      setFirestoreQuotaExceeded(true);
    }
    return {
      totalImported: 0,
      totalDuplicates: 0,
      results: [
        {
          providerId: "quota-limit",
          name: "حد استهلاك قاعدة البيانات متجاوز",
          success: false,
          importedCount: 0,
          duplicateCount: 0,
          error: "Firestore Quota Exceeded (Bypassed Gracefully)"
        }
      ]
    };
  }
}

// Transition status in moderation workflow
export async function transitionImportedArticleStatus(articleId: string, newStatus: string, publishSchedule?: string): Promise<boolean> {
  if (!firestore) return false;

  const docRef = firestore.collection("rss_imports").doc(articleId);
  const snap = await docRef.get();
  if (!snap.exists) return false;

  const article = snap.data();
  if (!article) return false;

  const nowStr = new Date().toISOString();
  await docRef.update({
    status: newStatus,
    updatedAt: nowStr,
    publishDate: publishSchedule || nowStr
  });

  // If status is APPROVED or PUBLISHED, dynamically publish/copy to the main news collection
  if (newStatus === "APPROVED" || newStatus === "PUBLISHED") {
    const newsDocRef = firestore.collection("news").doc(articleId);
    
    // Check if category exists or map it cleanly
    const mainCategory = article.classification?.league || article.classification?.country || "General";
    
    // Structured main NewsItem
    const newsPayload = {
      id: articleId,
      title: article.title,
      content: {
        fullText: article.description || "",
        summary: article.intelligence?.summaryAr || article.description?.slice(0, 200) || ""
      },
      excerpt: article.description?.slice(0, 200) || "",
      author: {
        id: "rss_aggregator",
        name: article.sourceName || "سفارة RSS",
        email: "rss@safara90.com",
        role: "AUTHOR"
      },
      status: newStatus === "PUBLISHED" ? "PUBLISHED" : "APPROVED",
      categories: [mainCategory],
      tags: article.classification?.suggestedTags || [],
      mainImage: article.imageUrl || article.mainImage || "/data/rss_fallback.jpg",
      image: article.imageUrl || article.mainImage || "/data/rss_fallback.jpg",
      featuredImage: {
        url: article.imageUrl || article.mainImage || "/data/rss_fallback.jpg",
        caption: article.title,
        altText: article.title,
        credit: article.sourceName,
        isWebP: true
      },
      source: {
        name: article.sourceName || "سفارة 90",
        url: article.originalUrl || "",
        importDate: nowStr,
        fetchTime: nowStr
      },
      seo: article.seo || {
        title: article.title,
        slug: article.seo?.slug || articleId,
        metaTitle: article.seo?.metaTitle || article.title,
        metaDescription: article.seo?.metaDescription || article.description,
        canonicalUrl: article.originalUrl,
        keywords: article.classification?.suggestedTags || [],
        includeInSitemap: true,
        readingTime: article.seo?.readingTime || 1
      },
      relatedContent: {
        matches: [],
        teams: article.classification?.teams || [],
        players: article.classification?.players || [],
        competitions: [article.classification?.competition || "General"]
      },
      publishDate: publishSchedule || nowStr,
      createdAt: article.createdAt || nowStr,
      updatedAt: nowStr,
      views: 0,
      clicks: 0,
      version: 1
    };
    await newsDocRef.set(newsPayload);
  }

  return true;
}

export async function temporaryDisableKooora() {
  if (!firestore) return;
  try {
    await firestore.collection('rss_sources').doc('kooora_news').update({
        enabled: false,
        status: 'FAILED',
        lastError: 'HTTP 403 Forbidden - Manual Disable'
    });
    console.log('Successfully disabled kooora_news');
  } catch (e) {
    console.error('Failed to disable kooora_news', e);
  }
}

export async function runSeedArabicLogic() {
  if (!firestore) return;
  const sources = [
    { name: 'Hespress الرياضية', logo: 'https://www.hespress.com/wp-content/themes/hespress/assets/images/logo.svg', url: 'https://www.hespress.com/sport/feed/', language: 'العربية', country: 'المغرب', sport: 'كرة القدم', category: 'Morocco', enabled: true, updateInterval: 30, lastSync: null, status: 'ACTIVE' },
    { name: 'الجزيرة الرياضية', logo: 'https://www.aljazeera.net/wp-content/themes/aj-main/assets/images/logo-ar.svg', url: 'https://www.aljazeera.net/aljazeerarss/7330032f-5696-4802-ad2c-49774540ed05/7e60749a-e87a-42f2-841f-13583713f019', language: 'العربية', country: 'عالمي', sport: 'كرة القدم', category: 'Global', enabled: true, updateInterval: 15, lastSync: null, status: 'ACTIVE' },
    { name: 'بي بي سي رياضة', logo: 'https://static.bbc.co.uk/ar-AR/images/bbc_arabic_logo.png', url: 'https://www.bbc.com/arabic/sports/index.xml', language: 'العربية', country: 'عالمي', sport: 'كرة القدم', category: 'Global', enabled: true, updateInterval: 60, lastSync: null, status: 'ACTIVE' },
    { name: 'Kooora News', logo: 'https://m.kooora.com/images/kooora_logo.png', url: 'https://news.kooora.com/?rss=true', language: 'العربية', country: 'عالمي', sport: 'كرة القدم', category: 'Global', enabled: true, updateInterval: 15, lastSync: null, status: 'ACTIVE' },
    { name: 'FilGoal', logo: 'https://www.filgoal.com/images/logo-v2.png', url: 'https://www.filgoal.com/rss', language: 'العربية', country: 'مصر', sport: 'كرة القدم', category: 'Egypt', enabled: true, updateInterval: 45, lastSync: null, status: 'ACTIVE' },
    { name: 'Yallakora', logo: 'https://www.yallakora.com/images/yk-logo.png', url: 'https://www.yallakora.com/rss.xml', language: 'العربية', country: 'مصر', sport: 'كرة القدم', category: 'Egypt', enabled: true, updateInterval: 60, lastSync: null, status: 'ACTIVE' }
  ];

  for (const s of sources) {
    const docId = s.name === 'الجزيرة الرياضية' ? 'aljazeera_sport' : (s.name === 'بي بي سي رياضة' ? 'bbc_arabic_sport' : s.name.replace(/\s+/g, '_').toLowerCase());
    await firestore.collection('rss_sources').doc(docId).set({
      ...s,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }
  console.log('[RSS Seeder] Arabic sources successfully seeded');
}
