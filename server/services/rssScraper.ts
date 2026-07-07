import * as cheerio from "cheerio";
import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";

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

export function getHeadersForUrl(url: string, baseHeaders: any = rssHeaders) {
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

export async function downloadAndCacheImage(url: string | undefined, providerId: string): Promise<string> {
  if (!url) return "/data/rss_fallback.jpg";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers: { 'User-Agent': rssHeaders['User-Agent'] }, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    
    // Check if the downloaded image is too small (e.g. tracking pixel or tiny icon)
    if (buffer.length < 5000) {
      console.warn(`[RSS Image Service] Image too small (${buffer.length} bytes), skipping: ${url}`);
      return "/data/rss_fallback.jpg";
    }

    // Return the original URL directly to prevent ephemeral filesystem loss on Cloud Run
    return url;
  } catch (err: any) {
    console.warn(`[RSS Image Service] Failed to cache image: ${url}. Error: ${err.message}`);
    return "/data/rss_fallback.jpg"; // Sports premium fallback illustration
  }
}

export async function searchMediaLibrary(query: string): Promise<string[]> {
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

export function shouldSkipParagraph(text: string): boolean {
  const lowercase = text.toLowerCase();
  const noiseKeywords = [
    'cookie', 'الشروط والأحكام', 'سياسة الخصوصية', 'حقوق الطبع', 'اشترك في', 'تابعونا على', 
    'تابعنا على', 'مواقع التواصل', 'تواصل معنا', 'اقرأ أيضاً', 'مواضيع ذات صلة', 'الاشتراك في النشرة',
    'قم بتحميل تطبيق', 'تطبيق هسبريس', 'حمل التطبيق', 'شارك هذا الموضوع', 'اضغط هنا', 'سجل الآن'
  ];
  return noiseKeywords.some(keyword => lowercase.includes(keyword));
}

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

export async function fetchFullArticleText(url: string): Promise<string> {
  const data = await fetchFullArticleScrapedData(url);
  return data.text;
}
