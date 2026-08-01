# enterprise code cleanup audit report - phase 1
# تقرير فحص وتنظيف الكود البرمجي - المرحلة الأولى

**تاريخ التقرير:** 1 أغسطس 2026  
**المشروع:** SAFARA 90 (صفارة 90)  
**حالة النشر الحالية:** الإنتاج يعمل بنجاح على `https://korea90.xyz` دون أي شاشة سوداء أو أخطاء تشغيل.  
**الهدف:** إجراء فحص شامل وهندسي لكافة ملفات المشروع (723 ملفاً) لتحليل جميع علاقات الاستيراد (Imports) والتصدير (Exports)، واكتشاف الملفات غير المستخدمة، الأكواد الميتة، المكررة، والمؤقتة وتصنيفها بدقة تمهيداً لتنظيف المشروع.

---

## 1. ملخص الفحص وتغطية شجرة المشروع (Executive Summary)

تم مسح وتحليل 723 ملفاً برمجيًا وهيكلياً موزعة على الأقسام التالية:
- **`src/`**: 525 ملفاً (مكونات الواجهة، الصفحات، الخطافات Hooks، الخدمات، والموجهات)
- **`server/`**: 42 ملفاً (خادم Express، الخدمات الخلفية، الموجهات، وإدارة الكاش والـ Firestore)
- **`api/`**: 7 ملفات (دوال Vercel Serverless الخاصة بـ SEO و API endpoints)
- **`core-engine/`**: 54 ملفاً (طبقة Clean Architecture للبيانات والـ Use Cases)
- **`mobile/`**: 19 ملفاً (تطبيق الهاتف المحمول المستقل المستند إلى Expo/React Native)
- **`public/`**: 25 ملفاً (الأصول الثابتة، الصور، الـ Sitemaps، و PWA Manifest)
- **`scripts/` & `app/`**: ملفات وأدوات نصية وتكوينية إضافية

---

## 2. جدول التصنيف الرئيسي للملفات (Classification & Risk Assessment)

وفقاً للتوجيهات الصارمة، **لم يتم حذف أي ملف حالياً**، وتم تقسيم الملفات إلى ثلاث فئات:

### 🔴 آمن للحذف (SAFE TO DELETE)
ملفات ميتة، مكررة بالكامل، أو مهجورة لا يتم استيرادها أو استدعاؤها في أي مسار تنفيذي بالويب.

| اسم الملف / المسار | النوع | السبب والتحليل |
| :--- | :--- | :--- |
| `app/applet/src/admin/pages/ApiManagementCenter.tsx` | مكرر / بقايا مسار | نسخة مكررة قديمة داخل مجلد `app/applet/` المتروك. |
| `app/applet/core-engine/contracts/infrastructure/IApiConfigProvider.ts` | مكرر | نسخة مكررة متروكة في `app/applet/`. |
| `app/applet/tsconfig.node.json` | تكوين مكرر | ملف تكوين متروك داخل مجلد غير مستخدم. |
| `src/features/world-cup/components/WcAdmin.tsx` | مكون مكرر | نسخة مكررة؛ يتم استيراد `src/components/worldcup/WcAdmin.tsx` فعلياً. |
| `src/admin/seo/SeoDiagnosticsPage.tsx` | مكون مكرر | نسخة مكررة؛ يتم استخدام `src/admin/pages/SeoDiagnosticsPage.tsx` في الموجه `App.tsx`. |
| `src/components/AdminLayout.tsx` | مكون مكرر | نسخة مكررة قديمة؛ يتم استخدام `@/admin/layouts/AdminLayout` داخل `App.tsx`. |
| `src/premium/matches/PremiumLiveMatchesSlider.tsx` | مكون غير مستخدم | مكون شريط المباريات المباشرة البريميوم، لا يستورد في أي صفحة. |
| `src/admin/news/pages/NewsEditorPage.tsx` | صفحة ميتة | محرر أخبار قديم غير مربوط بأي مسار (Route) في لوحة التحكم. |
| `src/admin/matches/dashboard/components/LiveMatchRoom.tsx` | مكون غير مستخدم | غطاء لغرفة المباراة المباشرة غير مربوط بالواجهة. |
| `src/features/match-details/hooks/useMatchPredictions.ts` | Hook غير مستخدم | خطاف توقعات المباريات، لا يتلقى أي استدعاء. |
| `src/features/match-details/hooks/useMatchTimeline.ts` | Hook غير مستخدم | خطاف الجدول الزمني للمباراة، محلو بمكونات المخطط المباشرة. |
| `src/features/match-details/hooks/useMatchStats.ts` | Hook غير مستخدم | خطاف إحصائيات المباراة، تم دمج منطق الإحصائيات داخل `useMatchDetails`. |
| `src/features/match-details/hooks/useMatchH2H.ts` | Hook غير مستخدم | خطاف المواجهات المباشرة، تم الاستعاضة عنه في الخدمات الرئيسية. |
| `src/features/cms/hooks/useCmsHooks.ts` | Hook غير مستخدم | خطافات CMS قديمة غير مستدعاة. |
| `src/core/api-management/models/api-management.models.ts` | نماذج غير مستخدمة | نماذج إدارة API قديمة. |
| `src/api/sysClient.ts` | عميل غير مستخدم | عميل نظام قديم تم استبداله بـ `src/core/api/apiClient.ts`. |
| `src/types/match.types.ts` | أنواع مكررة | أنواع مكررة، الأنواع الاعتيادية موحدة في `src/types.ts`. |
| `src/__tests__/utils.test.ts` | اختبار قديم | اختبار وحدة مهجور. |
| `scripts/verify-build.ts` | سكريبت تطوير قديم | سكريبت تحقق من البناء غير مدروج في `package.json`. |
| `src/assets/images/wc2026_premium_bg_1781077994238.png` | صورة غير مستخدمة | خلفية بريميوم توليدية غير مستخدمة في أي CSS أو Component. |
| `core-engine/application/use-cases/GetLiveMatches.ts` | Use Case غير مستخدم | حالة استخدام ميتة في المحرك. |
| `core-engine/application/use-cases/GetMatchDetails.ts` | Use Case غير مستخدم | حالة استخدام ميتة في المحرك. |
| `core-engine/application/use-cases/RefreshCache.ts` | Use Case غير مستخدم | حالة استخدام ميتة في المحرك. |
| `core-engine/application/use-cases/GetMatchesByDate.ts` | Use Case غير مستخدم | حالة استخدام ميتة في المحرك. |
| `core-engine/application/use-cases/SyncMatches.ts` | Use Case غير مستخدم | حالة استخدام ميتة في المحرك. |
| `core-engine/application/services/ComparisonService.ts` | خدمة ميتة | خدمة مقارنة غير مستخدمة. |
| `core-engine/contracts/services/ILogger.ts` | عقد غير مستخدم | واجهة تسجيل غير مستدعاة. |
| `core-engine/contracts/services/INotification.ts` | عقد غير مستخدم | واجهة إشعارات غير مستدعاة. |
| `core-engine/contracts/services/IConfiguration.ts` | عقد غير مستخدم | واجهة إعدادات غير مستدعاة. |
| `core-engine/contracts/repositories/ISettingsRepository.ts` | عقد غير مستخدم | مستودع إعدادات غير مستدعى. |
| `core-engine/contracts/repositories/INewsRepository.ts` | عقد غير مستخدم | مستودع أخبار غير مستدعى. |
| `core-engine/contracts/repositories/IChannelRepository.ts` | عقد غير مستخدم | مستودع قنوات غير مستدعى. |
| `core-engine/contracts/cache/ICache.ts` | عقد غير مستخدم | واجهة كاش غير مستدعاة. |
| `core-engine/infrastructure/database/FirestoreProvider.ts` | مزود غير مستخدم | مزود Firestore موازٍ غير مستخدم (الخادم يستخدم `server/firestore/`). |
| `core-engine/infrastructure/providers/FootballDataProvider.ts` | مزود غير مستخدم | مزود بيانات ممرر غير مستخدم. |
| `core-engine/infrastructure/providers/SportMonksProvider.ts` | مزود غير مستخدم | مزود بيانات ممرر غير مستخدم. |
| `core-engine/infrastructure/providers/RSSProvider.ts` | مزود غير مستخدم | مزود RSS غير مستخدم. |
| `core-engine/tests/CacheTest.ts` | اختبار محرك | ملف اختبار كاش داخلي للمحرك. |
| `core-engine/tests/RepositoryTest.ts` | اختبار محرك | ملف اختبار مستودع داخلي للمحرك. |
| `core-engine/tests/IntegrationTest.ts` | اختبار محرك | ملف اختبار تكامل داخلي للمحرك. |

---

### 🟡 يحتاج مراجعة (NEEDS REVIEW)
ملفات مستقلة أو تكوينات منصات أخرى قد تكون مخصصة لتطبيقات هاتف أو بيئات تطوير مستقلة.

| اسم الملف / المسار | التصنيف / السبب | توصية المراجعة |
| :--- | :--- | :--- |
| `mobile/` (كامل المجلد - 19 ملفاً) | تطبيق Expo/React Native مستقل | مجلد تطبيق الهاتف. إذا كان التطبيق ينشر بشكل منفصل عبر Expo يجب الإبقاء عليه، أما إذا كان النشر للويب فقط فيمكن فصله في Repository مستقل. |
| `capacitor.config.ts` | ملف تكوين Capacitor | تكوين تحويل الويب إلى تطبيق محمول. |
| `vitest.config.ts` | ملف تكوين الاختبارات | مستخدم فقط عند تشغيل `npm test` أو `vitest`. |
| `eslint.config.js` | ملف تكوين Linter | مستخدم في فحص جودة الكود. |
| `public/data/rss_images/*` (4 صور) | صور كاش مؤقتة لـ RSS | صور مولدة تلقائياً كأيقونات للأخبار؛ يمكن تنظيفها دورياً عبر سكريبت Cron. |

---

### 🟢 ممنوع الحذف (DO NOT DELETE)
الملفات الأساسية التي تعمل في بيئة التشغيل الحية ومصادر البيانات الرئيسية.

- **جميع صفحات الموجهات والتحكم (`src/pages/*`, `src/admin/*`, `src/premium/*`)**: مستوردة في `App.tsx` و `AdminLayout.tsx`.
- **المكونات التفاعلية (`src/components/*`)**: المكونات الحية مثل `MatchCard`, `MatchCountdown`, `Schedule`, `LiveMatchIndicator`, إلخ.
- **الخدمات المباشرة والخلفية (`server/*`, `api/*`, `src/services/*`)**: مسارات Vercel Serverless و خادم Express ومعالجات Firestore.
- **ملفات التكوين الحيوية**: `package.json`, `vite.config.ts`, `tailwind.config.js`, `vercel.json`, `firebase-applet-config.json`, `metadata.json`.

---

## 3. تفصيل الكود الميت والمكرر والمؤقت (Detailed Audit Patterns)

### أ. الكود المكرر (Duplicate Code)
1. **مكونات لوحة التحكم المكررة**:
   - `src/components/AdminLayout.tsx` مكرر مع `src/admin/layouts/AdminLayout.tsx`.
   - `src/admin/seo/SeoDiagnosticsPage.tsx` مكرر مع `src/admin/pages/SeoDiagnosticsPage.tsx`.
   - `src/features/world-cup/components/WcAdmin.tsx` مكرر مع `src/components/worldcup/WcAdmin.tsx`.
   - `app/applet/src/admin/pages/ApiManagementCenter.tsx` نسخة متروكة في مجلد فرعي.

2. **الدوال المكررة بين Client و Server**:
   - `src/utils/slugify.ts` و `server/utils/slugify.ts`: توحيد منطق إنشاء الروابط الصديقة لـ SEO.
   - `src/lib/crypto.ts` و `server/utils/crypto.ts`: توحيد معالجة التشفير.

### ب. الكود الوهمي والمحاكاة (Mock & Demo Code)
تم فحص المشروع وفقاً للقاعدة الذهبية **"ممنوع البيانات الوهمية"**:
- **`src/services/leagueService.ts` & `teamService.ts`**: تحتوي على بعض مصفوفات Fallback عند فشل الشبكة الحاد. تم توجيهها لتعتمد على Firestore بصفة أصلية.
- **`server/firestore/collections.ts`**: تحتوي على معالجات افتراضية آمنة (Empty States / Fallbacks) عند عدم توفر مستندات في Firestore، دون اختراع نتائج مباريات أو إحصائيات وهمية.
- **`src/components/Profile.tsx` & `WeekMatchesCalendar.tsx`**: تحتوي على نصوص توضيحية لبعض الواجهات التي تم تأمينها.

### ج. الكود القديم وتوافق الأنظمة (Legacy Code)
- **`src/types.ts`**: يحتوي على بعض الإعلانات القديمة للأنواع التي تمت ترقيتها إلى v2 (`MatchV2`).
- **`core-engine/application/services/ShadowValidationService.ts`**: نظام تحقق ظلي قديم تم استخدامه أثناء اختبار التحول لـ Firestore.

---

## 4. خطة العمل الموصى بها للمرحلة الثانية (Execution Plan Phase 2)

بناءً على نتائج هذا التقرير وبعد موافقة الإدارة الهندسية:

1. **تنظيف المجلدات الفرعية المتروكة**:
   - حذف المجلد المتروك بالكامل `app/applet/`.

2. **دمج وإزالة المكونات المكررة**:
   - إزالة `src/components/AdminLayout.tsx` والاعتماد الكلي على `@/admin/layouts/AdminLayout`.
   - إزالة `src/admin/seo/SeoDiagnosticsPage.tsx` والاعتماد على `@/admin/pages/SeoDiagnosticsPage`.
   - إزالة `src/features/world-cup/components/WcAdmin.tsx` والاعتماد على `src/components/worldcup/WcAdmin.tsx`.

3. **حذف الملفات الميتة (SAFE TO DELETE)**:
   - حذف الـ Hooks الميتة في `src/features/match-details/hooks/`.
   - حذف `src/premium/matches/PremiumLiveMatchesSlider.tsx`.
   - حذف الصورة غير المستخدمة `src/assets/images/wc2026_premium_bg_1781077994238.png`.
   - تنظيف الـ Use Cases والأكواد غير المستدعاة في `core-engine/`.

---
*تم إنشاء هذا التقرير وتحديثه تلقائياً وحفظه في `/docs/reports/CODE_CLEANUP_AUDIT.md` مع الحفاظ التام على سلامة الكود والتشغيل المباشر للموقع.*
