
import { z } from "zod";

/**
 * دالة لاستخراج السلاغ بشكل آمن
 */
export function createSlugPath(title: string, id: string): string {
  if (!title) return id;
  const cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '');
  return `${cleanTitle}-${id}`;
}

export function safeExtractString(val: any): string {
  if (typeof val === 'string') return val;
  if (!val) return '';
  if (typeof val === 'object') {
    return val.name || val.arabicName || val.displayName || val.title || '';
  }
  return String(val);
}

export function isUrlSafe(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    const hostname = parsed.hostname.toLowerCase();
    
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    const privateRanges = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^fc00:/,
      /^::1$/
    ];

    return !privateRanges.some(regex => regex.test(hostname));
  } catch (e) {
    return false;
  }
}

export function getIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  const parts = slug.split('-');
  return parts.length > 0 ? parts[parts.length - 1] : slug;
}
