import RSSParser from "rss-parser";
import crypto from "crypto";
import { isUrlSafe } from "../utils/slugify";
import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";
import { unifiedApiManager } from "./unifiedApiManager";

// Import modular sub-services
import { 
  knownGuids, 
  knownUrls, 
  knownTitles, 
  recentArticlesCache, 
  ensureRssCache, 
  setCachedLiveMatches 
} from "./rssCache";
import { findSmartLinks } from "./rssSmartLinking";
import { 
  rssHeaders, 
  getHeadersForUrl, 
  downloadAndCacheImage, 
  fetchFullArticleScrapedData, 
  fetchFullArticleText 
} from "./rssScraper";
import { getTitleSimilarity, classifyArticleWithAi } from "./rssClassifier";

// Re-export variables and functions to maintain absolute compatibility with any existing imports
export { rssHeaders, fetchFullArticleScrapedData, fetchFullArticleText, classifyArticleWithAi };

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

// Helper to parse RSS feed safely with aggressive sanitization for malformed XML
export async function parseRssFeedSafely(xml: string) {
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

    const xml = await unifiedApiManager.fetchRssFeed(feedUrl, {
      category: 'RSS',
      providerId,
      providerName: provider.name
    });
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
      for (const rec of recentArticlesCache) {
        const similarity = getTitleSimilarity(title, rec.title);
        if (similarity > 0.82) {
          isTitleDuplicate = true;
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
        const cheerioInst = await import("cheerio");
        const $ = cheerioInst.load(rawDesc);
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
      
      const cleanSourcePrefixes = ["المصدر:", "مصدر:", "نقلاً عن:", "كتب:"];
      for (const prefix of cleanSourcePrefixes) {
        const regex = new RegExp(`${prefix}\\s*${provider.name}`, "gi");
        polishedBody = polishedBody.replace(regex, "");
      }

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
    
    // Treat 403 as a warning, not a critical error for RSS sync
    if (err.message.includes("403")) {
        console.warn(`[RSS Service Warning] Provider ${providerId} returned 403 Forbidden. Skipping this sync cycle.`);
    } else {
        console.error(`[RSS Service Error] Provider sync failed for ${providerId}: ${err.message}`);
    }

    try {
      await firestore.collection("rss_sources").doc(providerId).set({
        lastError: err.message,
        lastSync: new Date().toISOString(),
        status: err.message.includes("403") ? "ACTIVE" : "FAILED"
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
    // Auto-update sitemap on publication
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
