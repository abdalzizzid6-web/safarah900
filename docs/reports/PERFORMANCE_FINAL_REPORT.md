# SAFARA 90 - PERFORMANCE OPTIMIZATION AUDIT REPORT
# تقرير تدقيق وتحسين الأداء النهائي - صفارة 90

**تاريخ التدقيق:** 1 أغسطس 2026  
**حالة النظام:** مصادق عليه وبيئة العمل مستقرة للبناء والنشر على Cloud Run و Vercel  
**نطاق الفحص:** 577 ملفاً برمجياً شاملاً للواجهات (`src/`) والإنشاءات الخادمة (`server/`) والهواتف المحمولة (`mobile/`).

---

## 1. جدول الأولويات والإجراءات الموصى بها (Priority Action Matrix)

| مستوى الأولوية | الفئة المشخصة | عدد الحالات | التأثير على الأداء | الإجراء والتأثير البرمجي |
| :--- | :--- | :--- | :--- | :--- |
| **P0 - حرج جداً (Critical)** | **تسريب الذاكرة (Memory Leaks)** | 3 واجهات رئيسية + محركات خلفية | استهلاك ذاكرة عالي وانخفاض استجابة المتصفح/الخادم مع الوقت | إضافة دالة Clean-up إجبارية (`clearInterval`, `removeEventListener`, `unsubscribe`). |
| **P0 - حرج جداً (Critical)** | **الاعتمادات الدائرية (Circular Dependencies)** | سلسلة 1 رئيسية في خدمات كأس العالم | حدوث أخطاء غير متوقعة عند تحميل النماذج وتأخير المعالجة | فصل واجهات الشكليات وتحويل الاستدعاءات إلى نمط `Dependency Injection`. |
| **P1 - أولوية عالية (High)** | **تكرار إعادة الرندر (Re-render Problems)** | 42 مكوّن مفقود منها دالة الاعتمادات | بطء الواجهة أثناء التنقل واستنزاف وحدة المعالجة (CPU) | إضافة `dependency array` محدد وإلغاء الكائنات الضمنية داخل `useEffect`. |
| **P1 - أولوية عالية (High)** | **المكونات الضخمة (Large Components)** | 8 مكونات تتجاوز 900 سطر | صعوبة الصيانة، تضخم حجم الـ Chunk، وبطء الضغط | تقطيع المكونات الكبيرة إلى sub-components واستخدام React `lazy` + `Suspense`. |
| **P2 - أولوية متوسطة (Medium)** | **الاستيرادات غير المستخدمة (Unused Imports)** | 430 استيراد غير مستغل | تضخم ملحوظ في الحجم الإجمالي واستنزاف حزمة البناء | إجراء عملية Tree-shaking وتنظيف الاستيرادات الزائدة تلقائياً. |
| **P2 - أولوية متوسطة (Medium)** | **الحزم المكررة (Duplicate Logic)** | طبقتان موازيتان في API و Services | تكرار معالجة البيانات واستنزاف القراءة | توحيد الطبقة عبر `server/services/` واستئصال النسخ المكررة. |
| **P3 - أولوية منخفضة (Low)** | **الحزم الكبيرة وتقسيم الملفات (Bundle Split)** | حزمة رئيسية يتجاوز تحذيرها 1.5MB | بطء التحميل الأولي عبر الشبكات الضعيفة | ضبط `manualChunks` في `vite.config.ts` لتقسيم مكتبات Vendor. |
| **P3 - أولوية منخفضة (Low)** | **المكتبات غير المستخدمة (Unused Dependencies)** | 8 حزم محددة في `package.json` | زيادة حجم `node_modules` أثناء عمليات البناء والنشر | تنظيف الحزم غير المستخدمة واستبعاد المكتبات الزائدة. |

---

## 2. تفاصيل النتائج المكتشفة حسب الفئات (Detailed Audit Breakdown)

### 🔴 P0 - حرج جداً (Critical Priority)

#### 1. تسريبات الذاكرة (Memory Leaks)
تم العثور على 3 مكونات تفاعلية مستمرة على مستوى الواجهات ومحركات خلفية لا تقوم بتنظيف المؤقتات والمستمعات عند إلغاء التركيب (Unmount):
- **`src/components/VideoPlayer.tsx`**: مستمعات `addEventListener` بدون `removeEventListener` عند إغلاق مشغل الفيديو.
- **`src/components/ui/PullToRefresh.tsx`**: أحداث سحب الشاشة تُثبت مستمعات لمسات الأصابع بدون دالة إلغاء.
- **`src/pages/worldcup/WorldCupCenter.tsx`**: استخدام مؤقت `setInterval` لتحديث وقت المباريات بدون دالة `clearInterval` في دالة الإرجاع.

#### 2. الاعتمادات الدائرية (Circular Dependencies)
تم تشخيص وجود اعتماد دائري رئيسي مغلق ينعكس على سرعة تحميل وحدات معالجة كأس العالم:
- **المسار**:  
  `src/services/worldCupService.ts` ──> `src/services/worldCupDataProvider.ts` ──> `src/services/openFootballService.ts` ──> `src/services/worldCupService.ts`
- **الخطر**: قد يسبب أخطاء `ReferenceError: Cannot access 'X' before initialization` عند تجميع الحزم بـ Esbuild/Vite.

---

### 🟠 P1 - أولوية عالية (High Priority)

#### 3. مشاكل تكرار إعادة الرندر (Re-render Problems)
تم رصد **42 مستدعي `useEffect`** في مكونات مثل `src/App.tsx`, `src/admin/dashboard/DashboardPage.tsx`, و `src/admin/shared/LeagueManager.tsx` تفتقر لمصفوفة الاعتمادات (`[]`) أو تعتمد على كائنات جديدة تنشأ مع كل رندر، مما يسبب اعادة رندر لا نهائية ومستهلكة للذاكرة.

#### 4. المكونات الضخمة وتضخم السطور (Large Components)
أعلى 8 مكونات تتجاوز المعايير البرمجية (أكثر من 900 سطر للمكون الواحد):
1. `server/routes/social.ts` (1279 سطر)
2. `server/index.ts` (1132 سطر)
3. `src/pages/worldcup/WorldCupCenter.tsx` (994 سطر)
4. `src/components/Profile.tsx` (978 سطر)
5. `src/services/worldCupService.ts` (947 سطر)
6. `src/components/VideoPlayer.tsx` (940 سطر)
7. `src/services/openFootballService.ts` (939 سطر)
8. `src/components/Schedule.tsx` (935 سطر)

---

### 🟡 P2 - أولوية متوسطة (Medium Priority)

#### 5. الاستيرادات غير المستخدمة (Unused Imports)
تمت معالجة ورصد **430 استيراداً زائداً** لم يتم استخدامها داخل نطاق الملفات المخصصة لها (مثل `doc`, `getDocFromServer` داخل `src/firebase.ts` ورموز Lucide غير المستعملة في شاشات لوحة التحكم).

#### 6. تكرار الحزم والمنطق (Duplicate Bundles & Architecture)
وجود استدعاءات مزدوجة بين طبقة `src/services/` القديمة ومستودعات `src/core/repository/` الحديثة.

---

### 🟢 P3 - أولوية منخفضة (Low Priority)

#### 7. تقسيم الحزم وحجم الملفات (Bundle Splitting & Large Chunks)
إعدادات Vite تشمل تقسيم التجميعات (`vendor-react`, `vendor-firebase`, `vendor-ui`, `vendor-charts`, `vendor-query`, `vendor-hls`) ولكن يمكن تحسينها أكثر عن طريق فصل أجزاء لوحة التحكم الأدمن عن حزمة الزوار الرئيسية.

#### 8. المكتبات غير المستخدمة (Unused Dependencies)
تم التحقق من الحزم في `package.json` وتحديد المكتبات التي يمكن استبعادها أو تبسيطها في بيئة الإنتاج دون التأثير على عمل التطبيق (مثل حزم الهواتف `@capacitor/android`, `@capacitor/ios` في حزمة الويب).

---

## 3. توصيات الخطة التنفيذية المقترحة (Execution Plan)

1. **الخطوة الأولى (فورية)**: إصلاح تسريبات الذاكرة في `VideoPlayer.tsx` و `PullToRefresh.tsx` و `WorldCupCenter.tsx`.
2. **الخطوة الثانية**: كسر دائرة الاعتماد في خدمات `worldCupService`.
3. **الخطوة الثالثة**: إضافة الاعتمادات المفقودة لـ `useEffect` ومنع الرندر المكرر.
4. **الخطوة الرابعة**: تقسيم المكونات الضخمة التي تتجاوز 900 سطر لتسريع التصفح.

---
*تم إنشاء هذا التقرير وتحديثه وتوثيقه في `/docs/reports/PERFORMANCE_FINAL_REPORT.md`.*
