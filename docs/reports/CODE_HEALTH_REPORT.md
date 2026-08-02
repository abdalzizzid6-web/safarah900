# Enterprise Code & Bundle Health Audit - SAFARA 90

**Audit Date**: August 2026  
**Target Project**: SAFARA 90 (Enterprise Sports & Football Intelligence Platform)  
**Scope**: Full Codebase Health, Bundle Size Analysis, Component Inventory, Asset & Dependency Overhead Audit

---

## 1. Executive Summary & Asset Breakdown

This Enterprise Bundle & Code Health Audit evaluates the production build output (`dist/`), static public assets (`public/`), source code component structures (`src/`), and node dependencies (`node_modules/`).

### Overall Production Bundle Totals
| Asset Type | Total Size | Primary Contributor & Notes |
|---|---|---|
| **JavaScript (JS)** | **4.98 MB** | Code-split vendor chunks (`firebase`, `hls.js`, `recharts`, `react-dom`) + Admin modules |
| **CSS** | **331.65 KB** | Single optimized Tailwind CSS file (`index-*.css`) |
| **Images** | **12.75 MB** | Uncompressed public PWA icons (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png` @ 1.15MB each) |
| **Fonts** | **0 B** | System font stack + external web font loading |
| **Other Data / Maps** | **694.34 KB** | Server bundle source maps & JSON caches |

---

## 2. Top 50 Largest Files in Project (Assets, Bundles & Build Artifacts)

| # | File Path | Size | Type / Category |
|---|---|---|---|
| 1 | `./public/favicon-32.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 2 | `./public/icon-192.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 3 | `./public/favicon-16.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 4 | `./public/apple-touch-icon.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 5 | `./public/adaptive-icon.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 6 | `./public/logo-master.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 7 | `./public/favicon.ico` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 8 | `./public/icon-512.png` | 1.15 MB | Public PWA Asset (Uncompressed) |
| 9 | `./dist/adaptive-icon.png` | 1.15 MB | Dist PWA Asset |
| 10 | `./dist/apple-touch-icon.png` | 1.15 MB | Dist PWA Asset |
| 11 | `./dist/favicon-16.png` | 1.15 MB | Dist PWA Asset |
| 12 | `./dist/favicon-32.png` | 1.15 MB | Dist PWA Asset |
| 13 | `./dist/favicon.ico` | 1.15 MB | Dist PWA Asset |
| 14 | `./dist/icon-192.png` | 1.15 MB | Dist PWA Asset |
| 15 | `./dist/icon-512.png` | 1.15 MB | Dist PWA Asset |
| 16 | `./dist/logo-master.png` | 1.15 MB | Dist PWA Asset |
| 17 | `./src/assets/images/safara_90_logo_1780785060409.png` | 992.29 KB | Source Brand Asset |
| 18 | `./public/data/rss_images/aljazeera_sport_fcd249577651ef391dde31a8bd149a73.jpg` | 959.03 KB | Cached RSS Media |
| 19 | `./dist/data/rss_images/aljazeera_sport_fcd249577651ef391dde31a8bd149a73.jpg` | 959.03 KB | Dist Cached RSS Media |
| 20 | `./public/data/rss_images/aljazeera_sport_d3f21a45894b3de8fae2549a39fca423.jpg` | 790.56 KB | Cached RSS Media |
| 21 | `./dist/data/rss_images/aljazeera_sport_d3f21a45894b3de8fae2549a39fca423.jpg` | 790.56 KB | Dist Cached RSS Media |
| 22 | `./public/data/rss_images/aljazeera_sport_3201f9a9a6294c061757de0e97de95fa.jpg` | 763.32 KB | Cached RSS Media |
| 23 | `./dist/data/rss_images/aljazeera_sport_3201f9a9a6294c061757de0e97de95fa.jpg` | 763.32 KB | Dist Cached RSS Media |
| 24 | `./dist/assets/vendor-firebase-T6el_Z8J.js` | 695.77 KB | JS Vendor Chunk (Firebase SDK) |
| 25 | `./dist/server.cjs.map` | 687.83 KB | Server Source Map |
| 26 | `./public/safera-logo-512.png` | 674.26 KB | Public Brand Asset |
| 27 | `./dist/safera-logo-512.png` | 674.26 KB | Dist Brand Asset |
| 28 | `./package-lock.json` | 632.19 KB | NPM Lockfile |
| 29 | `./dist/assets/vendor-utils-bhljH277.js` | 567.44 KB | JS Vendor Chunk (Utils & Date-fns) |
| 30 | `./dist/assets/vendor-hls-CWTT-7hy.js` | 511.73 KB | JS Vendor Chunk (HLS.js Video) |
| 31 | `./public/data/rss_images/aljazeera_sport_ee32f05f13a60112a25fce1817f9976c.jpg` | 472.65 KB | Cached RSS Media |
| 32 | `./dist/data/rss_images/aljazeera_sport_ee32f05f13a60112a25fce1817f9976c.jpg` | 472.65 KB | Dist Cached RSS Media |
| 33 | `./dist/server.cjs` | 408.28 KB | Node Express Server Bundle |
| 34 | `./dist/assets/vendor-charts-_iMAT3IH.js` | 373.53 KB | JS Vendor Chunk (Recharts & D3) |
| 35 | `./dist/assets/index-KDfQO-Dx.css` | 331.65 KB | Production CSS Bundle |
| 36 | `./dist/assets/vendor-react-BkD_t-3A.js` | 329.98 KB | JS Vendor Chunk (React & DOM) |
| 37 | `./bun.lock` | 315.99 KB | Bun Lockfile |
| 38 | `./dist/assets/index-CG0bLcqS.js` | 313.30 KB | Core App Shell Bundle |
| 39 | `./dist/assets/WorldCupCenter-DuDsPg-c.js` | 133.53 KB | Async Route Chunk (WorldCupCenter) |
| 40 | `./dist/assets/HomepageManager-Ba02pjY-.js` | 130.67 KB | Async Admin Chunk (HomepageManager) |
| 41 | `./dist/assets/vendor-ui-DU3sv_R5.js` | 126.40 KB | JS Vendor Chunk (Radix UI / Motion) |
| 42 | `./dist/assets/MediaDashboard-nx8h2xqk.js` | 104.44 KB | Async Admin Chunk (MediaDashboard) |
| 43 | `./dist/assets/MatchesCms-CwbWWriQ.js` | 100.23 KB | Async Admin Chunk (MatchesCms) |
| 44 | `./dist/assets/MatchDetailsPage-CKuXS1og.js` | 94.53 KB | Async Route Chunk (MatchDetails) |
| 45 | `./dist/assets/NewsDashboardPage-RCDbqVTn.js` | 83.21 KB | Async Admin Chunk (NewsDashboard) |
| 46 | `./dist/assets/HomePage-BDtbop4O.js` | 76.06 KB | Async Route Chunk (HomePage) |
| 47 | `./dist/assets/RssDashboard-BJd35mSp.js` | 74.99 KB | Async Admin Chunk (RssDashboard) |
| 48 | `./dist-test/api/seo.js` | 62.05 KB | Compiled Test Endpoint |
| 49 | `./dist/assets/SocialMediaCenter-j3Pgk6ES.js` | 59.68 KB | Async Admin Chunk (SocialMedia) |
| 50 | `./dist/assets/Schedule-cnwPWiKx.js` | 54.66 KB | Async Route Chunk (Schedule) |

---

## 3. Top 50 Largest Components in `src/` (Source Code Footprint)

| # | Component Path | Byte Size | Lines of Code | Category / Scope |
|---|---|---|---|---|
| 1 | `src/pages/worldcup/WorldCupCenter.tsx` | 54.43 KB | 994 lines | World Cup Feature Hub |
| 2 | `src/admin/matches/components/MatchEditor.tsx` | 48.91 KB | 868 lines | Admin Match Management |
| 3 | `src/components/Profile.tsx` | 48.86 KB | 978 lines | User Account & Preferences |
| 4 | `src/admin/news/rss/components/RssArticleEditor.tsx` | 46.29 KB | 850 lines | Admin RSS & News Editor |
| 5 | `src/admin/shared/LeagueManager.tsx` | 45.46 KB | 836 lines | Admin League CMS |
| 6 | `src/components/Schedule.tsx` | 44.00 KB | 935 lines | Fixture Schedule Grid |
| 7 | `src/components/VideoPlayer.tsx` | 37.96 KB | 940 lines | Custom Video & Highlights Player |
| 8 | `src/admin/media/components/MediaLibraryView.tsx` | 33.17 KB | 649 lines | Admin Media Library |
| 9 | `src/components/NotificationCenter.tsx` | 30.59 KB | 553 lines | Realtime Push & Toast Drawer |
| 10 | `src/components/match/H2HTab.tsx` | 30.58 KB | 664 lines | Head-to-Head Stats Tab |
| 11 | `src/admin/matches/dashboard/MatchesDashboard.tsx` | 30.37 KB | 655 lines | Admin Matches Overview |
| 12 | `src/pages/StandingsPage.tsx` | 29.68 KB | 528 lines | League Table Page |
| 13 | `src/components/layouts/premium/PremiumSearch.tsx` | 28.68 KB | 534 lines | Global Search Overlay |
| 14 | `src/admin/matches/components/MatchesTable.tsx` | 27.50 KB | 497 lines | Admin Matches Table |
| 15 | `src/admin/shared/BugLogsDashboard.tsx` | 27.36 KB | 536 lines | Admin Diagnostics & Logs |
| 16 | `src/admin/homepage/components/BlockForm.tsx` | 26.58 KB | 711 lines | Admin Block Builder Form |
| 17 | `src/components/LineupsView.tsx` | 26.50 KB | 521 lines | Match Formation & Lineup Board |
| 18 | `src/pages/LeaguePage.tsx` | 25.91 KB | 477 lines | Competition Detail Page |
| 19 | `src/components/InstallHandler.tsx` | 25.06 KB | 474 lines | PWA Install Banner |
| 20 | `src/components/GoalNotifier.tsx` | 24.73 KB | 563 lines | Live Goal Audio & Toast Alert |
| 21 | `src/components/MatchAiAnalysis.tsx` | 24.64 KB | 458 lines | Gemini Match AI Tactical Analysis |
| 22 | `src/admin/social/pages/ConnectedAccounts.tsx` | 24.55 KB | 559 lines | Admin Social Account Sync |
| 23 | `src/components/MatchCard.tsx` | 24.53 KB | 552 lines | Match Card Component |
| 24 | `src/admin/homepage/pages/HomepageManager.tsx` | 24.14 KB | 622 lines | Admin Layout Manager |
| 25 | `src/pages/DashboardPage.tsx` | 23.27 KB | 521 lines | Main Dashboard Page |
| 26 | `src/components/TimelineView.tsx` | 22.89 KB | 401 lines | Match Event Timeline |
| 27 | `src/pages/worldcup/WCMatchDetail.tsx` | 22.21 KB | 468 lines | WC Match View |
| 28 | `src/components/AdBanner.tsx` | 22.20 KB | 550 lines | Dynamic Ad Banner Slot |
| 29 | `src/components/player/PlayerStatisticsTab.jsx` | 21.42 KB | 410 lines | Player Stats Tab |
| 30 | `src/components/video-player/VideoPlayerSettings.tsx` | 21.19 KB | 432 lines | Video Quality Controls |
| 31 | `src/components/WeekMatchesCalendar.tsx` | 21.18 KB | 458 lines | Calendar Strip Component |
| 32 | `src/admin/social/pages/SocialScheduler.tsx` | 20.90 KB | 486 lines | Admin Social Publisher |
| 33 | `src/premium/components/PremiumStories.tsx` | 19.90 KB | 450 lines | Football Stories Widget |
| 34 | `src/admin/shared/TeamsCms.tsx` | 19.75 KB | 439 lines | Admin Teams CMS |
| 35 | `src/pages/LeaguesPage.tsx` | 19.41 KB | 404 lines | Leagues Directory Page |
| 36 | `src/admin/media/dashboard/MediaDashboard.tsx` | 19.08 KB | 429 lines | Admin Media Hub |
| 37 | `src/components/MatchHeader.tsx` | 19.04 KB | 373 lines | Match Header Widget |
| 38 | `src/admin/homepage/components/block-form/BlockFormTabDesign.tsx` | 18.82 KB | 352 lines | Block Form Design Tab |
| 39 | `src/components/SearchModal.tsx` | 18.75 KB | 365 lines | Quick Search Drawer |
| 40 | `src/pages/LiveStreamPage.tsx` | 18.71 KB | 409 lines | Live Match Stream View |
| 41 | `src/admin/media/components/MediaUploadsView.tsx` | 18.21 KB | 430 lines | Media Uploader Dropzone |
| 42 | `src/components/MatchDetailView.tsx` | 18.12 KB | 286 lines | Match Detail Modal |
| 43 | `src/App.tsx` | 17.50 KB | 324 lines | Main App Router & Layout |
| 44 | `src/components/MatchStatsView.tsx` | 17.39 KB | 373 lines | Match Statistics Grid |
| 45 | `src/admin/news/rss/components/RssImportQueue.tsx` | 17.35 KB | 385 lines | Admin RSS Import Queue |
| 46 | `src/components/match/LiveMatchesCarousel.tsx` | 17.18 KB | 319 lines | Live Matches Strip |
| 47 | `src/admin/news/rss/components/RssProvidersList.tsx` | 16.93 KB | 389 lines | Admin RSS Providers |
| 48 | `src/admin/shared/SeoAnalytics.tsx` | 16.86 KB | 323 lines | Admin SEO Dashboard |
| 49 | `src/components/match/MatchCarousel.tsx` | 16.83 KB | 372 lines | Homepage Match Carousel |
| 50 | `src/admin/pages/SystemHealthPage.tsx` | 16.56 KB | 326 lines | Admin System Health Page |

---

## 4. Top 50 Largest Dependencies in `node_modules`

| # | Dependency Name | Installation Size | Scope & Purpose |
|---|---|---|---|
| 1 | `googleapis` | 197.87 MB | Server Google API integrations |
| 2 | `firebase` | 35.35 MB | Client Firebase Web SDK |
| 3 | `tsx` | 33.26 MB | Dev TS execution runtime |
| 4 | `lucide-react` | 29.42 MB | Icon System |
| 5 | `hls.js` | 23.64 MB | Video HLS Streaming Engine |
| 6 | `typescript` | 23.22 MB | TypeScript Compiler |
| 7 | `@google/genai` | 13.74 MB | Gemini Server AI SDK |
| 8 | `date-fns` | 10.40 MB | Date formatting utility |
| 9 | `recharts` | 6.99 MB | Data Visualizations & Charts |
| 10 | `react-dom` | 6.98 MB | React DOM Renderer |
| 11 | `jsdom` | 6.75 MB | DOM Testing Environment |
| 12 | `zod` | 4.35 MB | Data Schema Validation |
| 13 | `eslint` | 2.78 MB | Linter Tooling |
| 14 | `vite` | 2.53 MB | Vite Build Bundler |
| 15 | `@types/node` | 2.40 MB | Node Type Definitions |
| 16 | `cheerio` | 2.14 MB | Server HTML Parser |
| 17 | `rss-parser` | 1.99 MB | Server RSS Parser |
| 18 | `vitest` | 1.82 MB | Test Runner |
| 19 | `axios` | 1.69 MB | HTTP Client |
| 20 | `dompurify` | 1.62 MB | XSS Sanitizer |
| 21 | `firebase-admin` | 1.36 MB | Server Firebase Admin SDK |
| 22 | `socket.io-client` | 1.35 MB | WebSocket Client |
| 23 | `socket.io` | 1.35 MB | WebSocket Server |
| 24 | `tailwind-merge` | 991 KB | Tailwind Utility Merger |
| 25 | `@firebase/eslint-plugin-security-rules` | 964 KB | Security Linter |
| 26 | `sharp` | 936 KB | Server Image Processing |
| 27 | `@capacitor/cli` | 870 KB | Mobile Cross-Platform CLI |
| 28 | `d3` | 850 KB | Data Visualization Math |
| 29 | `@tanstack/react-query` | 838 KB | Async State Caching Engine |
| 30 | `ioredis` | 838 KB | Redis Client |
| 31 | `tailwindcss` | 745 KB | CSS Utility Engine |
| 32 | `motion` | 666 KB | UI Animation Engine |
| 33 | `@capacitor/android` | 437 KB | Mobile Android Platform |
| 34 | `react-firebase-hooks` | 422 KB | Firebase React Hooks |
| 35 | `@capacitor/ios` | 395 KB | Mobile iOS Platform |
| 36 | `@capacitor-community/admob` | 384 KB | Mobile AdMob Plugin |
| 37 | `@capacitor/core` | 365 KB | Mobile Core Runtime |
| 38 | `@testing-library/react` | 328 KB | React Test Utilities |
| 39 | `@testing-library/jest-dom` | 293 KB | Jest DOM Matchers |
| 40 | `express` | 273 KB | Node Web Server |
| 41 | `vite-plugin-pwa` | 235 KB | PWA Service Worker Builder |
| 42 | `imagekit` | 198 KB | ImageKit SDK |
| 43 | `autoprefixer` | 196 KB | CSS PostCSS Plugin |
| 44 | `react` | 167 KB | React Core Framework |
| 45 | `react-intersection-observer` | 159 KB | Lazy Load Intersection Hook |
| 46 | `express-rate-limit` | 142 KB | Express Rate Limiting |
| 47 | `esbuild` | 132 KB | Bundler Engine |
| 48 | `@tailwindcss/typography` | 111 KB | Tailwind Typography Plugin |
| 49 | `dotenv` | 101 KB | Env Variables Loader |
| 50 | `react-helmet-async` | 99 KB | Document Head / SEO Manager |

---

## 5. Actionable Optimization Strategy for Bundle Size Reduction

### Strategy 1: Public Image Compression (>90% Immediate Savings)
* **Finding**: Public PWA icons (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `logo-master.png`, `favicon.ico`) are **1.15 MB each** (totaling 12.75 MB).
* **Action**: Convert these raw uncompressed PNG files to WebP or optimized compressed 8-bit PNGs using `sharp` or `pngquant`.
* **Expected Result**: Reduces public asset payload from 12.75 MB down to < 400 KB (>96% payload reduction).

### Strategy 2: Admin Dashboard Route Code Splitting
* **Finding**: Heavy admin dashboard modules (`WorldCupCenter`, `MatchEditor`, `MatchesDashboard`, `RssArticleEditor`, `LeagueManager`) comprise > 600 KB of client JavaScript.
* **Action**: Ensure all `/admin/*` routes inside `App.tsx` remain isolated behind `React.lazy()` dynamic imports. Standard visitors loading the public homepage will avoid fetching admin code.

### Strategy 3: Lucide Icon Tree-Shaking Guard
* **Finding**: `lucide-react` node folder is 29.42 MB due to SVG definitions for every icon.
* **Action**: Maintain strict named imports (e.g. `import { Trophy } from 'lucide-react'`) to enable Vite tree-shaking and prevent whole-library bundle inclusion.

### Strategy 4: Modular Vendor Chunking Configuration
* **Status (Active)**: Vite configuration in `vite.config.ts` currently splits vendor libraries cleanly:
  - `vendor-firebase` (~695 KB)
  - `vendor-utils` (~567 KB)
  - `vendor-hls` (~511 KB)
  - `vendor-charts` (~373 KB)
  - `vendor-react` (~330 KB)
* **Benefit**: Ensures maximum browser caching efficiency so returning visitors only download modified app chunks without re-fetching vendor libraries.
