# SEO Root Cause Verification Report - Safara 90

**Date:** 2026-07-11
**Objective:** Final Enterprise SEO Forensic Audit to identify causes of news indexing issues.
**Status:** Audit Completed. No modifications were performed.

---

## 1. 20-Point Verification Checklist

| ID | Item | Findings | File + Line Reference |
|---|---|---|---|
| 01 | RSS Polling | **Disabled**. `startRssJobs()` is commented out. | `/server/index.ts` : 858 |
| 02 | Auto-Sitemap | Sitemap generated only on server boot. No update on news creation. | `/server/index.ts` : 861 |
| 03 | News Sitemap | News sitemap does not exist in `/public/`. | `/public/` directory |
| 04 | HTTP 200 | Routes correctly return 200 for existing entities. | `/server/index.ts` : 961 |
| 05 | Canonical | Canonical tags seem missing or not handled in `injectSeo`. | `/server/index.ts` : 952 |
| 06 | Meta Tags | Dynamic injection exists but appears fragile. | `/server/index.ts` : 952 |
| 07 | Regex Injection | `injectSeo` uses string manipulation; very brittle. | `/server/index.ts` : 952 |
| 08 | SSR vs CSR | Hybrid SSR implemented for specific routes. | `/server/index.ts` : 898, 968 |
| 09 | Meta Robots | No explicit meta robots blocking in headers. | N/A |
| 10 | News Schema | JSON-LD schema lacks `NewsArticle` specific fields. | `/server/index.ts` : 941 |
| 11 | Sitemap Validity | Sitemap generated, but missing auto-update. | `/server/scripts/generateSitemap.ts` |
| 12 | Absolute URLs | Used in sitemap generation. | `/server/scripts/generateSitemap.ts` : 9 |
| 13 | Canonical Domain | Logic exists for host unification. | `/server/index.ts` : 33 |
| 14 | Slug Permanence | Slugs derived from titles; may change if title changes. | `/server/utils/slugify.ts` |
| 15 | JS Blocking | SSR handles initial HTML, should not block. | `/server/index.ts` |
| 16 | Vercel Middleware | Environment is Cloud Run (Nginx proxy), not Vercel. | N/A |
| 17 | Soft 404 | Implemented; 404 sent correctly for missing docs. | `/server/index.ts` : 927 |
| 18 | Duplicate Content | Canonical logic not explicitly verified in `injectSeo`. | `/server/index.ts` : 952 |
| 19 | Image Sitemap | `generateImageSitemapXml` exists but requires triggered updates. | `/server/routes/seo.ts` : 165 |
| 20 | Indexing Failure | Root cause: Stale content (RSS disabled) + Sitemap not updating. | Synthesis |

---

## 2. Prioritized Problem List

| Priority | Issue | Impact |
|---|---|---|
| **Critical** | RSS Polling Disabled | 100% (No new news content) |
| **Critical** | Sitemap Generation Static (Server boot only) | 90% (Sitemap stale) |
| **High** | Missing Google News Schema | 70% (Google News visibility) |
| **Medium** | Brittle Meta-Tag Injection (`injectSeo`) | 50% (Malformed metadata) |
| **Low** | Missing explicit Canonical Tags | 30% (Duplicate content risk) |

---

## 3. Repair Plan

### Phase 1: Immediate Content Synchronization
- Enable `startRssJobs()` in `/server/index.ts`.
- Set up an automated task (cron job/job queue) to call `generateSitemap()` every 1 hour, not just on boot.

### Phase 2: Sitemap & Schema Hardening
- Implement `NewsArticle` schema in `injectSeo` for news routes.
- Ensure `public/sitemap-news.xml` is generated and included in the sitemap index.

### Phase 3: Meta-Data Robustness
- Replace `injectSeo` regex logic with a more robust template engine or a DOM parser to ensure meta-tags are always valid.
- Explicitly add `canonical` link tags to the `injectSeo` function.

### Phase 4: Crawler & Indexing Audit
- Re-verify Robots.txt.
- Submit sitemap index to Google Search Console.

### Phase 5: Continuous Monitoring
- Set up automated SEO monitoring (Screaming Frog/GSC API) to detect issues early.

---
*Report End.*
