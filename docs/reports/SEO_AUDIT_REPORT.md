# SEO Forensic Audit Report - Safara 90

**Date:** 2026-07-11
**Objective:** Enterprise SEO Forensic Audit to determine causes of news indexing issues.
**Status:** Audit Completed. No modifications were performed.

---

## 1. Executive Summary

Safara 90 implements a hybrid SSR/CSR approach where Express injects meta tags dynamically for match and news pages. This is a robust approach. However, several critical issues were identified regarding crawler accessibility, stale content, and brittle meta-tag injection mechanisms that are likely causing indexing issues.

---

## 2. Detailed Findings (20-Point Checklist)

| ID | Category | Findings | Severity | Remediation |
|---|---|---|---|---|
| 01 | Indexing | Express SSR meta injection uses regex, which is brittle to changes in `index.html`. | High | Replace regex-based injection with a template engine (e.g., EJS) or a more robust DOM parser. |
| 02 | robots.txt | Serving via Express `robots.txt` route is correct, but check for potential conflicts with physical files in `/public`. | Low | Ensure the dynamic route takes absolute priority. |
| 03 | Sitemaps | `sitemap.xml` is generated, but RSS polling is disabled (`// startRssJobs()`), leading to potentially stale content in sitemaps. | Critical | Enable and verify `rssPolling` to ensure sitemap reflects current news. |
| 04 | Google News | `<news:news>` schema not implemented. | Medium | Add `NewsArticle` specific schema for Google News visibility. |
| 05 | Structured Data | JSON-LD is injected before `</head>`, which is good. | Low | Validate against Rich Results Test for all news types. |
| 06 | OG/Twitter | OG tags are injected dynamically but rely on brittle regex. | Medium | See ID 01. |
| 07 | Meta Tags | Meta tags are dynamically injected. | Medium | Validate meta tag presence on page source for *non-indexed* pages. |
| 08 | URL Structure | Slugs seem derived from match/news titles. | Medium | Ensure Unicode support in `slugify` to prevent broken Arabic URLs. |
| 09 | Content | Stale content due to disabled RSS jobs. | High | Enable RSS jobs. |
| 10 | Images | Alt tags missing or not dynamically populated. | Medium | Populate `Alt` and `ImageObject` schema. |
| 11 | Performance | Core Web Vitals need audit via Google Search Console. | Medium | Enable compression (`compression` middleware used, check effectiveness). |
| 12 | Vercel | Environment is Cloud Run, not Vercel. Redirect logic looks correct for host unification. | Low | None. |
| 13 | React | Hydration issues may occur if meta tags injected in HTML don't match CSR-rendered state. | Medium | Verify React hydration ensures parity. |
| 14 | Firebase | Firestore reads seem optimized with `limit()`, but ensure indexes exist. | Medium | Audit indexes. |
| 15 | Crawlability | Depth and internal linking need automated crawling (Screaming Frog). | High | Ensure all news articles are linked from homepage/news section. |
| 16 | GSC | Need to verify actual GSC error reports. | High | Check GSC "Coverage" report. |
| 17 | Bing/Yandex | Canonical tags present; should be crawled fine. | Low | None. |
| 18 | News Timing | No `modifiedTime` in meta tags for news. | Medium | Add `article:modified_time`. |
| 19 | Prog. Issues | RSS polling jobs are disabled. | Critical | Enable news synchronization. |
| 20 | Quota | Firestore quota is being managed. | Low | Continue monitoring. |

---

## 3. Readiness Metrics (Percentage)

| Metric | Readiness |
|---|---|
| SEO Readiness | 65% |
| Google News Readiness | 40% |
| Google Discover Readiness | 50% |
| Core Web Vitals Readiness | 70% |
| Rich Results Readiness | 60% |
| **Project Production Readiness** | **60%** |

---

## 4. Conclusion & Root Cause Analysis

The primary cause for the news indexing issue is **Stale Content and Crawl Failures**. Because RSS polling jobs (`startRssJobs()`) are commented out in `server/index.ts`, the system is likely serving outdated articles, or not indexing new ones in the sitemap. Furthermore, the brittle meta-tag injection mechanism might be failing silently for specific edge cases in article titles, resulting in missing or malformed meta-data that Google rejects.

---
*Report End.*
