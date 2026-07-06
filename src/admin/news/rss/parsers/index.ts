// Client-side RSS visual preview utilities and HTML cleaners
import * as cheerio from "cheerio";

export function sanitizePreviewHtml(html: string): string {
  if (!html) return "";
  try {
    // Basic client regex cleaner for preview displays
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    return html;
  }
}

export function extractImagesFromHtml(html: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  try {
    const $ = cheerio.load(html);
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) urls.push(src);
    });
  } catch (e) {
    // Fallback
    const regex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
  }
  return urls;
}
