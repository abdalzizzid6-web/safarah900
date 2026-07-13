# SAFARA90 Architecture Consolidation Master Plan

## 1. الوضع الحالي (Current State)
تم إجراء فحص شامل لهيكل مشروع SAFARA90 (Frontend, Backend, Mobile, Core Engine). يتبين أن المشروع يمتلك هيكلاً معقداً يتكون من عدة طبقات متداخلة تم بناؤها في مراحل مختلفة من دورة حياة المشروع.

### المكونات الحالية:
- **Frontend (React/Vite)**: يتوزع الكود بين `src/` (التطبيقات الأساسية)، و `src/admin/` (لوحة التحكم)، و `src/features/` (ميزات معزولة)، و `src/premium/` (خدمات متميزة). 
- **Backend (Express)**: يتمركز في `server/` مع وجود مسارات (routes) وخدمات (services) تتعامل مع قاعدة البيانات والمصادر الخارجية.
- **Core Engine (`core-engine/`)**: محرك معزول يحتوي على بنية تحتية ومزودي بيانات (Providers) وحالات استخدام (Use Cases) لتجريد التعامل مع البيانات، ويبدو أنه بُني كجهد حديث لتوحيد منطق جلب البيانات.
- **Mobile (`mobile/`)**: تطبيق مبني باستخدام React Native / Expo أو Capacitor مع هيكل مجلدات منفصل.
- **API (`api/`)**: مجلد يحتوي على وظائف مزامنة المباريات، ويبدو أنه يستخدم كـ Serverless Functions أو Vercel API.

### الملفات والمجلدات النشطة:
- `src/pages/`, `src/components/`, `server/routes/`, `server/services/`.
- التخزين المؤقت (Cache) مفعل في `server/utils/cache.ts`.

## 2. المشاكل المعمارية (Architecture Issues)
1. **تعدد مصادر الحقيقة (Multiple Sources of Truth)**: توجد طبقات متعددة للوصول إلى نفس البيانات (مثال: جلب المباريات يتم عبر `core-engine`، وعبر `src/services/matchService.ts`، وعبر `server/routes/matches.ts`).
2. **تداخل المسؤوليات (Leaking Abstractions)**: بعض مسارات الواجهة الأمامية تتصل مباشرة بـ Firebase أو بخدمات خارجية بدلاً من المرور عبر الخادم (Server Layer) الموحد.
3. **التكرار في طبقة الاتصال (Duplicated API Layers)**: وجود مجلدات API في `src/api` و `src/core/api` و `src/admin/api` و `server/routes` و `api/`.
4. **بقايا ملفات قديمة (Legacy JS Files)**: وجود ملفات JavaScript مثل `src/api/footballApi.js` و `src/api/leagueApi.js` و `src/services/statsMapper.js` تتداخل مع بنية TypeScript الحديثة.
5. **تكرار منطق الـ RSS**: يتواجد منطق RSS في `server/services/rssService.ts` و `core-engine/infrastructure/providers/RSSProvider.ts` و `src/admin/news/rss/parsers`.

## 3. الأنظمة المكررة (Duplicated Systems)

### API Layers
- **الموقع 1**: `/server/routes/*` (Backend Express)
- **الموقع 2**: `/src/api/*` (Client-side API callers - Legacy JS)
- **الموقع 3**: `/src/core/api/*` (Client-side API callers - Modern TS)
- **الموقع 4**: `/api/*` (Serverless functions)
- **القرار النهائي**: دمج وتوحيد جميع استدعاءات العميل (Client) في `src/core/api` (أو `src/shared/api`). وتوحيد جميع مسارات الخادم في `server/routes`. التخلص التدريجي من `/src/api` و `/api` إذا كانت مكررة ولا تقدم قيمة إضافية للمحرك.

### Services Layer
- **الموقع 1**: `src/services/*` (Client-side services)
- **الموقع 2**: `server/services/*` (Server-side services)
- **الموقع 3**: `core-engine/application/services/*` (Agnostic domain services)
- **القرار النهائي**: نقل منطق الأعمال الثقيل والتعامل مع مزودي البيانات (SportMonks, API-Football) بشكل كامل إلى `server/services` أو `core-engine`. طبقة `src/services` يجب أن تحتوي فقط على واجهات استدعاء لـ Backend.

### Data Providers & RSS
- **الموقع 1**: `src/services/theSportsDBService.ts`, `openFootballService.ts`, `sportMonksService.ts`
- **الموقع 2**: `core-engine/infrastructure/providers/*`
- **القرار النهائي**: الاعتماد الكامل على `core-engine` كطبقة تجريد (Adapter Pattern) وحذف مزودي الخدمة المباشرين من `src/services` لتجنب كشف المفاتيح البرمجية (API Keys) في الواجهة وتوحيد سياسة التخزين المؤقت (Caching).

### Frontend CMS & Admin
- **الموقع 1**: `src/admin/` (Full admin dashboard)
- **الموقع 2**: `src/features/cms/` 
- **القرار النهائي**: توحيد جميع صفحات الإدارة ومكونات الـ CMS داخل `src/admin/` وحذف التكرار من `src/features/cms/`.

## 4. القرار النهائي لكل نظام (Final Decisions)

| النظام / الطبقة | الموقع المعتمد (Source of Truth) | الإجراء المطلوب (Action) |
|---|---|---|
| **API Client** | `src/core/api/apiClient.ts` | حذف `src/api/*` (الملفات القديمة JS). |
| **Data Fetching (Client)** | `react-query` hooks في `src/hooks/` | إزالة الاستدعاءات المباشرة من `useEffect` داخل المكونات. |
| **Business Logic & Providers** | `core-engine/` و `server/services/` | إزالة منطق الاتصال بـ API Football وغيرها من `src/services/`. |
| **RSS Engine** | `server/services/rssService.ts` | توحيد عمليات جلب الأخبار وجعلها مجدولة (Cron Jobs) تخزن في Firestore. |
| **Authentication** | `src/features/users/` أو Context | توحيد استخدام `react-firebase-hooks` وإزالة أي استدعاءات مكررة. |

## 5. الهيكل المستقبلي (Future Production Architecture Proposal)

```text
SAFARA90/
├── core-engine/                # (محرك الأعمال والبيانات الأساسي الموحد - Agnostic Logic)
│   ├── contracts/
│   ├── domain/
│   ├── infrastructure/
│   └── application/
│
├── server/                     # (Express Backend)
│   ├── routes/                 # مسارات API للعميل
│   ├── services/               # خدمات تتصل بالـ core-engine والـ Firestore
│   ├── utils/                  # خدمات الكاش و SEO
│   └── middleware/             # Rate Limiting, Auth, etc.
│
├── src/                        # (React Frontend)
│   ├── core/                   # (الطبقة الأساسية للواجهة الأمامية)
│   │   ├── api/                # Axios instances & Endpoints الموحدة
│   │   ├── config/
│   │   └── store/              # Zustand state management
│   ├── features/               # (ميزات معزولة - Feature-Sliced Design)
│   │   ├── matches/            # مكونات وصفحات المباريات
│   │   ├── news/               # مكونات وصفحات الأخبار
│   │   └── world-cup/          # ميزات كأس العالم
│   ├── admin/                  # (لوحة التحكم الموحدة)
│   ├── shared/                 # (المكونات العامة والأدوات - UI, Hooks)
│   └── types/                  # أنواع TypeScript العامة
│
└── docs/                       # تقارير البنية والمستندات
```

## 6. خطة التنفيذ (Migration Plan)

خطة انتقال آمنة ومرحلية، لا تعطل بيئة الإنتاج:

### PHASE 1: توحيد API Client
- **التأثير**: واجهة المستخدم.
- **الخطوات**: نقل أي استدعاء يعتمد على `src/api/*.js` إلى `src/core/api/apiClient.ts`.
- **المخاطر**: تعطل بعض الصفحات التي تعتمد على مسارات قديمة.
- **Rollback**: الاحتفاظ بمجلد `src/api` كنسخة احتياطية حتى انتهاء الاختبار.

### PHASE 2: ترحيل وإغلاق طبقة Services في Frontend
- **التأثير**: واجهة المستخدم والخادم.
- **الخطوات**: إزالة مزودي البيانات الخارجيين من `src/services` واستبدالهم باستدعاءات للـ `server/routes` الموحدة.
- **المخاطر**: بطء مؤقت إذا لم يُفعل التخزين المؤقت (Cache) بشكل صحيح على الخادم.
- **الاختبار**: مراجعة شاشات المباريات والإحصائيات والتأكد من أنها تجلب البيانات من الخادم (Port 3000) بدلاً من استدعاء API Football مباشرة.

### PHASE 3: تنظيف ملفات الـ JS القديمة (Legacy Code)
- **التأثير**: الكود المصدري.
- **الخطوات**: تحويل أو إزالة ملفات `.js` و `.mjs` المتبقية في الواجهة مثل `footballApi.js`.

### PHASE 4: تقليل التكرار في CMS & Admin
- **التأثير**: لوحة التحكم.
- **الخطوات**: مراجعة `src/features/cms` ودمجه داخل `src/admin` ليكون Admin هو نقطة الإدخال الوحيدة لإدارة المحتوى.

### PHASE 5: تحسين الأداء (Performance Optimization)
- **الخطوات**: تفعيل React Query لجميع استدعاءات البيانات لتقليل `Firestore Reads`. ضبط `Session Storage` للمحتوى الثابت.

### PHASE 6: فحص الإنتاج (Production Validation)
- إجراء اختبارات كاملة قبل إصدار التحديث (End-to-End Testing)، ومراجعة معدلات قراءة قاعدة البيانات.

## 7. قواعد الحفاظ على نظافة المشروع (Safety Rules)

لتجنب تراكم الديون التقنية مجدداً، يجب الالتزام الصارم بالتالي:
1. ❌ **يمنع منعاً باتاً إنشاء ملف API جديد في الواجهة الأمامية**: استخدم `src/core/api/apiClient.ts` أو استدعِ الخادم دائماً.
2. ❌ **يمنع استدعاء API خارجي (مثل API-Football) من متصفح العميل**: جميع الاستدعاءات يجب أن تتم في Backend وتخزن في Cache لحماية المفاتيح.
3. ❌ **يمنع كتابة منطق الأعمال (Business Logic) المعقد داخل مكونات React**: يجب أن تُعزل في Custom Hooks أو Server Services.
4. ❌ **يمنع إضافة مجلدات أساسية جديدة**: يجب الالتزام بالهيكلية (features / shared / core).
5. ❌ **يمنع استخدام Listeners (`onSnapshot`) في الواجهة بشكل عام**: إلا لحالات البث المباشر المحددة جداً.
6. ✅ **يُطلب تفعيل الكاش (Caching)**: لكل مسار (Route) في الخادم لتقليل الاعتماد على استدعاءات الـ API الخارجية وتقليل استهلاك Firestore.
