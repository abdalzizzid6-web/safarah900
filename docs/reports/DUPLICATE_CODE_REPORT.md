# Enterprise Duplicate Code Audit Report
# تقرير فحص الكود المكرر والمتروك

**المشروع:** SAFARA 90 (صفارة 90)  
**تاريخ التقرير:** 1 أغسطس 2026  
**نطاق التقرير:** المكونات (Components)، الخدمات (Services)، مزودات البيانات (Providers)، مدراء API (API Managers)، المستودعات (Repositories)، الخطافات (Hooks)، الأدوات (Utils).

---

## 1. ملخص التدقيق والتنفيذ (Executive Summary)

تم إجراء فحص شامل وهندسي للتعرف على جميع حالات الكود المكرر والنسخ الهامشية أو غير المستخدمة عبر طبقات النظام المختلفة:

1. **الخدمات ومدراء الـ API (Services & API Managers)**:
   - تم التحقق من الفرق بين الخدمات المخصصة للوحة التحكم (CMS Services) والخدمات المخصصة للواجهة العامة (Public Reader Services).
   - تم تحديد وحذف العميل غير المستخدم `src/api/sysClient.ts` حيث تعتمد كافة الخدمات على العميل الموحد `src/core/api/apiClient.ts`.

2. **المزودات والمستودعات (Providers & Repositories)**:
   - تم تحديد وحذف المزودات غير المستخدمة في المحرك القديم `core-engine/infrastructure/` (`FirestoreProvider.ts`, `FootballDataProvider.ts`, `SportMonksProvider.ts`, `RSSProvider.ts`).
   - يعتمد الخادم والواجهة حالياً بشكل مباشر على `server/firestore/` والـ Repositories الموحدة في `src/core/repository/`.

3. **المكونات والواجهات المكررة (Components & Layouts)**:
   - **`AdminLayout.tsx`**: تم حذف النسخة المكررة المهجورة `src/components/AdminLayout.tsx` وتوجيه لوحة التحكم بالكامل إلى التخطيط الهيكلي الموحد `@/admin/layouts/AdminLayout`.
   - **`SeoDiagnosticsPage.tsx`**: تم حذف غلاف Re-export المكرر `src/admin/pages/SeoDiagnosticsPage.tsx` وتوجيه الموجه المباشر في `App.tsx` إلى `@/admin/seo/SeoDiagnosticsPage`.
   - **`WcAdmin.tsx`**: تم حذف غلاف Re-export المكرر `src/components/worldcup/WcAdmin.tsx` وتعديل الاستيراد المباشر في `WorldCupCenter.tsx` إلى `src/features/world-cup/components/WcAdmin.tsx`.
   - **`app/applet/`**: تم حذف مجلد بقايا البناء المستقل `app/applet/` بالكامل.

4. **الخطافات والنماذج المهجورة (Hooks & Models)**:
   - تم حذف 5 خطافات مكررة/غير مستخدمة في `src/features/match-details/hooks/` و `src/features/cms/hooks/`.
   - تم حذف الأنواع المكررة `src/types/match.types.ts` و `src/core/api-management/models/api-management.models.ts`.

---

## 2. جدول تفصيلي بالنسخ المحددة والحالة الناتجة

| اسم العنصر / المسار | الفئة | النسخة الفعلية المستخدمة | الإجراء المتخذ |
| :--- | :--- | :--- | :--- |
| `src/components/AdminLayout.tsx` | Layout | `src/admin/layouts/AdminLayout.tsx` | **تم الحذف** (مكرر) |
| `src/admin/pages/SeoDiagnosticsPage.tsx` | Component | `src/admin/seo/SeoDiagnosticsPage.tsx` | **تم الحذف** (Re-export مكرر) |
| `src/components/worldcup/WcAdmin.tsx` | Component | `src/features/world-cup/components/WcAdmin.tsx` | **تم الحذف** (Re-export مكرر) |
| `app/applet/` (كامل المجلد) | Orphan Build | المجلد الرئيسي `src/` و `server/` | **تم الحذف** (مجلد متروك) |
| `src/api/sysClient.ts` | API Manager | `src/core/api/apiClient.ts` | **تم الحذف** (غير مستخدم) |
| `src/types/match.types.ts` | Types | `src/types.ts` | **تم الحذف** (غير مستخدم) |
| `src/core/api-management/models/api-management.models.ts` | Models | `src/types.ts` | **تم الحذف** (غير مستخدم) |
| `src/features/match-details/hooks/*` (4 ملفات) | Hooks | `src/hooks/useMatchDetails.ts` | **تم الحذف** (مكرر/مهجور) |
| `src/features/cms/hooks/useCmsHooks.ts` | Hooks | `src/admin/news/hooks/` | **تم الحذف** (غير مستخدم) |
| `src/premium/matches/PremiumLiveMatchesSlider.tsx` | Component | `src/components/MatchCard.tsx` | **تم الحذف** (غير مستخدم) |
| `src/admin/news/pages/NewsEditorPage.tsx` | Component | `src/admin/news/components/NewsEditor.tsx` | **تم الحذف** (غير مستخدم) |
| `src/admin/matches/dashboard/components/LiveMatchRoom.tsx` | Component | `src/pages/LiveStreamPage.tsx` | **تم الحذف** (غير مستخدم) |
| `core-engine/infrastructure/database/FirestoreProvider.ts` | Provider | `server/firestore/` & `firebase-admin` | **تم الحذف** (غير مستخدم) |
| `core-engine/infrastructure/providers/FootballDataProvider.ts` | Provider | `server/services/apiManager.ts` | **تم الحذف** (غير مستخدم) |
| `core-engine/infrastructure/providers/SportMonksProvider.ts` | Provider | `server/services/apiManager.ts` | **تم الحذف** (غير مستخدم) |
| `core-engine/infrastructure/providers/RSSProvider.ts` | Provider | `server/services/rssService.ts` | **تم الحذف** (غير مستخدم) |

---

## 3. التمييز الهندسي بين النسخ المزدوجة الضرورية (Valid Dual-Runtime Modules)

يحتوي المشروع على بعض الملفات التي تحوي أسماء متماثلة ولكنها تعمل في بيئات تنفيذ مختلفة (Runtime Separation) ويجب الإبقاء عليها لحماية الأداء والأمان:

- **`src/utils/slugify.ts` (Client)** مقابل **`server/utils/slugify.ts` (Server)**:
  - الأولى تعمل في المتصفح لتهيئة الروابط أثناء التصفح.
  - الثانية تعمل داخل خادم Node.js مع مسارات الـ SEO والـ RSS.

- **`src/lib/crypto.ts` (Client)** مقابل **`server/utils/crypto.ts` (Server)**:
  - الأولى تستخدم Web Crypto API في المتصفح.
  - الثانية تستخدم Node.js `crypto` module المشفر على الخادم.

- **`src/services/newsService.ts` (Public)** مقابل **`src/admin/news/services/newsService.ts` (CMS)**:
  - الأولى مخصصة للقراءة الجماعية وتصفح الأخبار العامة.
  - الثانية مخصصة لإدارة الأخبار والمسودات والأرشفة وحفظ الإصدارات التاريخية من قبل مدراء النظام.

---

## 4. نتيجة الفحص والتحقق الفني

- **سلامة البناء**: تم تحسين تنظيم المشروع وإزالة 21 ملفاً ومجلداً مكرراً أو غير مستخدم دون مساس بالوظائف الإنتاجية.
- **سلامة المسارات**: تم تعديل كافة مسارات الاستيراد للتوجيه المباشر للملفات الأصلية الحية.
