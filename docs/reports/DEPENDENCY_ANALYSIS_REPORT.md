# تقرير التحليل الجنائي للاعتماديات - طبقة API
(Forensic Dependency Analysis Report - API Layer)

**المشروع:** SAFARA 90
**التاريخ:** 07-07-2026
**الحالة:** تقرير نهائي (بدون إجراء تعديلات برمجية)

---

## 1. مسار تدفق البيانات (Data Call Graph)
تبدأ دورة حياة جلب البيانات في طبقة API من الواجهة وتنتهي في السيرفر عبر التسلسل التالي:

1. **مكون الواجهة (React Component):** `PremiumLiveMatchesList.tsx` أو `LiveScoreWidget.tsx`
2. **الخطاف (React Hook):** `src/hooks/useMatchesV2.ts` (يقوم بإدارة حالة React Query)
3. **طبقة الخدمة (Service Layer):** `src/services/matchService.ts` (يُستخدم كـ Wrapper متكرر)
4. **مستودع البيانات (Repository):** `src/core/repository/MatchesRepositoryV2.ts`
5. **طبقة الكاش المحلي (Client Cache):** `src/core/api/cacheManager.ts` (Memory & LocalStorage)
6. **مُرسل الطلبات (HTTP Client):** `src/core/api/apiClient.ts` (Axios) -> يرسل الطلب إلى `/api/matches/...`
7. **موجه السيرفر (Server Route):** `server/routes/matches.ts`
8. **مدير واجهات السيرفر (Server API Manager):** `server/services/apiManager.ts` (للاتصال بـ API-Football / SportMonks) أو الاتصال بـ `Firestore`.

---

## 2. تحليل استدعاءات الملفات الأساسية

### أ. ملف `MatchesRepositoryV2.ts`
يتم استدعاؤه بشكل مباشر أو غير مباشر في:
- `src/hooks/useMatchesV2.ts`
- `src/services/matchService.ts`
- `src/services/standingsService.ts`
- `src/features/match-details/repositories/matchRepository.ts`
- `src/admin/matches/services/matchAdminService.ts`
- `src/admin/matches/services/matchEnterpriseService.ts`
- `src/admin/shared/ChannelsCms.tsx`
- `src/admin/shared/TeamsCms.tsx`
- `src/components/match/H2HTab.tsx`

### ب. ملف `matchService.ts`
- `src/hooks/useFootballApi.ts`
- `src/hooks/useMatchesV2.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/SitemapPage.tsx`
- `src/admin/shared/AnalyticsCenter.tsx`
- `src/admin/matches/components/MatchDiagnosticTool.tsx`
- `src/admin/matches/dashboard/MatchesDashboard.tsx`
- `src/admin/matches/hooks/useMatchActions.ts`
- **جسور JS القديمة:** `src/api/playerApi.js`, `footballApi.js`, `leagueApi.js`, `teamApi.js`
- **مهام السيرفر:** `server/jobs/syncNotifications.ts`, `api/matches/cron.ts`

### ج. ملفات التوحيد (Normalization)
**`src/core/utils/matchNormalization.ts` يُستدعى في:**
- `src/services/matchMapper.ts`
- `src/features/match-details/repositories/matchRepository.ts`
- `src/core/repository/MatchesRepositoryV2.ts`

**`server/utils/normalizer.ts` يُستدعى في:**
- `server/routes/seo.ts`
- `server/routes/matches.ts`
- `server/firestore/cache.ts`
- `test_normalization.mjs`

*(ملاحظة: يوجد تكرار صريح لمنطق الـ Normalization بين السيرفر والواجهة الأمامية).*

### د. ملف `cacheManager.ts`
- `src/core/repository/MatchesRepositoryV2.ts`
- `src/core/repository/CmsRepositoryV2.ts`
- `src/core/api/index.ts`

### هـ. الاستدعاء المباشر لـ Firestore (`collection`, `getDocs`, `doc(db)`)
بعيداً عن مستودعات V2، توجد ملفات تستدعي Firestore مباشرة وتكسر نمط Repository:
- `src/admin/seo/services/seoDiagnosticsService.ts`
- `src/admin/news/services/newsService.ts`
- `src/admin/homepage/pages/HomepageManager.tsx`
- `src/services/userService.ts`
- `src/features/news/repositories/newsRepository.ts`

### و. ملف `apiClient.ts`
- `src/components/GoalNotifier.tsx` *(تجاوز مباشر من المكون إلى apiClient!)*
- `src/components/NotificationCenter.tsx` *(تجاوز مباشر!)*
- جميع مستودعات البيانات: `MatchesRepositoryV2`, `NewsRepositoryV2`, `BaseRepository`, إلخ.
- جسور API القديمة: `playerApi.js`, `teamApi.js`, `leagueApi.js`.

---

## 3. تحليل التأثير (Impact Analysis)

إذا قمنا بحذف الملفات التالية، فهذا هو التأثير المتوقع:
1. **`matchService.ts`**: انهيار شبه كامل للتطبيق. تعتمد عليه خطافات `useMatchesV2.ts` (الجديدة) و `useFootballApi.ts` (القديمة)، إضافة إلى لوحات تحكم الإدارة وجسور JS.
2. **`matchMapper.ts`**: سيتأثر ملف `src/api/teamApi.js` فقط. تأثيره منخفض على مكونات V2 الحديثة.
3. **`useFootballApi.ts`**: ستتوقف الصفحات القديمة التي لم يتم تهجيرها لـ V2 بعد، مثل `LeaguePage.tsx` و `LiveMatches.tsx` عن العمل نهائياً.

---

## 4. الكود الميت والتكرار (Dead Code & Duplication)

### أ. ملفات JS و Services قديمة (غير مستخدمة أو مكررة)
- `src/api/playerApi.js`, `leagueApi.js`, `teamApi.js`, `footballApi.js` (مكررة لوظائف V2).
- `src/services/api/searchService.js` (غير مستخدم).
- `src/services/apiFootballMapper.js` و `statsMapper.js` (تجاوزها الزمن).

### ب. خطافات غير مستخدمة أو مكررة (Unused/Duplicate Hooks)
- `useLeagues` موجودة في `src/hooks/useLeagues.ts` وتم تكرار إرسالها (export) داخل `src/hooks/useFootballApi.ts`.

### ج. مسارات سيرفر غير مستخدمة نهائياً (Unused Routes)
- `server/routes/api.ts` (غير مدرجة في `server/index.ts`).
- `server/routes/leagues.ts` (غير مدرجة في `server/index.ts`).
- `server/routes/players.ts` (غير مدرجة في `server/index.ts`).

### د. نقاط نهاية لا يتم استدعاؤها من الواجهة (Uncalled Endpoints)
داخل مسار `server/routes/matches.ts`:
- `POST /api/matches/stats`
- `POST /api/matches/refresh`
- `GET /api/matches/proxy/:matchId`

---

## 5. خريطة الاعتماديات وجدول الإجراءات (Dependency Map & Action Table)

| الملف (File) | عدد المستدعين | عدد الاستدعاءات الصادرة | هل يمكن حذفه؟ | هل يجب دمجه؟ | مستوى الخطورة |
|-------------|:---:|:---:|:---:|:---:|:---:|
| `matchService.ts` | 14 | 2+ (`MatchesRepositoryV2`) | لا | نعم (نقل للـ Repos) | 🔴 High |
| `useFootballApi.ts` | 2 (`LeaguePage`, `LiveMatches`) | 1 (`matchService`) | لا | نعم (إلى V2) | 🟡 Medium |
| `matchMapper.ts` | 1 (`teamApi.js`) | 1 (`matchNormalization`) | نعم | نعم | 🟢 Low |
| `server/routes/api.ts` | 0 | 0 | **نعم** | لا | 🟢 Low |
| `server/routes/leagues.ts`| 0 | 0 | **نعم** | لا | 🟢 Low |
| `server/routes/players.ts`| 0 | 0 | **نعم** | لا | 🟢 Low |
| `api/footballApi.js` | 0 | 1 (`matchService`) | **نعم** | لا | 🟢 Low |
| `GoalNotifier.tsx` | UI | 1 (`apiClient.ts` مباشرة) | لا | نعم (إعادة توجيه) | 🟡 Medium |
| `matchNormalization.ts` | 3 | 0 | لا | نعم (دمج مع السيرفر) | 🟡 Medium |
| `cacheManager.ts` | 3 | 1 (`localStorage`) | لا | لا | 🟡 Medium |
