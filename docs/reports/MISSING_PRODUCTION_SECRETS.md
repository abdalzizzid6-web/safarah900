# تقرير كامل للمتغيرات والأسرار البرمجية المفقودة (MISSING_PRODUCTION_SECRETS.md)

يحتوي هذا التقرير على فحص شامل وتدقيق كامل لجميع متغيرات البيئة (Environment Variables) والأسرار البرمجية (Secrets) المستخدمة في كامل شيفرة مشروع **Safara 90** (Frontend, Backend, APIs, Firebase Admin, Vercel Server, Dashboard).

يتبع هذا التقرير سياسة صارمة بعدم إدراج أي قيم وهمية أو عينات أو أمثلة (No placeholders/No dummy data). القيم المعروضة هي القيم الحقيقية المستخرجة مباشرة من ملفات المشروع وإعداداته البرمجية، وما لم يتم العثور عليه يُكتب بجانبه بوضوح تام: **NOT FOUND**.

---

## 1. المتغيرات الموجودة فعلاً داخل ملفات المشروع مع قيمها الحقيقية

تم العثور على المتغيرات التالية مدمجة أو كقيم احتياطية (Fallback Constants) داخل شيفرة المشروع أو ملفات التهيئة:

### أ. قيم تهيئة عميل فايربيز (Firebase Client Config)
مستخرجة بالكامل من الملف الحقيقي `/firebase-applet-config.json` المستخدم للربط من جهة العميل (Client-Side):
- **projectId**: `gen-lang-client-0959045190`
- **appId**: `1:958469007898:web:7c9a852967b8c2b5b97fa3`
- **apiKey**: `AIzaSyB4asms_LyYqluR9v9EZrKohsvNF7Xqwbo`
- **authDomain**: `gen-lang-client-0959045190.firebaseapp.com`
- **firestoreDatabaseId**: `ai-studio-safarah90-8063f3e8-1dda-4447-afcd-1abf0dc4041d`
- **storageBucket**: `gen-lang-client-0959045190.firebasestorage.app`
- **messagingSenderId**: `958469007898`
- **measurementId**: `G-B04BY0JFTZ`

### ب. القيم الاحتياطية المدمجة في الأكواد (Hardcoded Fallbacks)
تم العثور على القيم التالية مدمجة داخل الكود لاستخدامها كبديل في حال عدم تعيين المتغيرات في البيئة السحابية:
- **VITE_API_KEY** (مفتاح API-Football الاحتياطي): `6ca2df456728038b3401fbba80a13344`
  *(المصدر: `server/services/apiManager.ts` السطر 109 والسطر 232)*
- **VITE_FOOTBALL_DATA_KEY** (مفتاح Football-Data.org الاحتياطي): `b52fe40577134e59a5796404b7ebc73c`
  *(المصدر: `server/index.ts` السطر 450)*
- **VITE_FOOTBALL_DATA_BASE** (الرابط الأساسي الاحتياطي لـ Football-Data.org): `https://api.football-data.org/v4`
  *(المصدر: `server/index.ts` السطر 439)*
- **ENCRYPTION_KEY** (مفتاح تشفير الجلسات المحلية الاحتياطي): `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
  *(المصدر: `src/lib/crypto.ts` السطر 7)*
- **SOCIAL_ENCRYPTION_KEY** (مفتاح تشفير السوشيال الاحتياطي): `safara-90-secret-fallback-key-32b`
  *(المصدر: `server/utils/crypto.ts` السطر 10)*

---

## 2. جميع المتغيرات المفقودة (Missing Variables)
المتغيرات التالية مستخدمة برمجياً في الكود ولكن **لم يتم العثور على أي قيمة لها** (لا حقيقية ولا احتياطية) داخل ملفات المشروع، مما يعني وجوب تعيينها في لوحة تحكم Vercel عند الإنتاج:

- **FIREBASE_SERVICE_ACCOUNT_KEY**: **NOT FOUND**
- **GEMINI_API_KEY**: **NOT FOUND**
- **APP_URL**: **NOT FOUND**
- **IMAGEKIT_PRIVATE**: **NOT FOUND**
- **IMAGEKIT_PUBLIC** / **VITE_IMAGEKIT_PUBLIC**: **NOT FOUND**
- **IMAGEKIT_URL_ENDPOINT** / **VITE_IMAGEKIT_URL_ENDPOINT**: **NOT FOUND**
- **VITE_FCM_VAPID_KEY**: **NOT FOUND** *(الكود يحتوي على قيمة وهمية مخرّبة `BPHr1zPz1...` ويقوم برفضها تلقائياً)*
- **REDIS_URL**: **NOT FOUND**

---

## 3. المتغيرات الموجودة في الكود ولكنها ليست موجودة في ملفات البيئة (`.env.example`)
هذه المتغيرات يتم استدعاؤها في الشيفرة المصدرية للمشروع، ولكن لم تكن مدرجة مسبقاً في ملف الإعدادات النموذجي `.env.example`:

- **VERCEL** (متغير نظام يتم التحقق منه لمعرفة بيئة التشغيل):
  *(مكان الاستخدام: `server/routes/social.ts` السطر 1266، `server/services/apiManager.ts` السطر 83، `server/index.ts` السطر 895)*
- **VITE_VERCEL** (متغير واجهة أمامية للتحقق من النشر على فيرسيل):
  *(مكان الاستخدام: `src/pages/DashboardPage.tsx` السطر 143)*
- **NOW_REGION** (متغير نظام من فيرسيل لتحديد موقع الخادم):
  *(مكان الاستخدام: `server/services/apiManager.ts` السطر 83)*
- **PORT** (متغير نظام لتحديد منفذ الخادم):
  *(مكان الاستخدام: `server/services/apiManager.ts` السطر 83، `server/index.ts` السطر 1113)*
- **NODE_ENV** (متغير لتحديد بيئة التطوير أو الإنتاج):
  *(مكان الاستخدام: `server/index.ts`, `api/seo.ts`, `src/features/analytics/repositories/analyticsRepository.ts`)*

---

## 4. المتغيرات الموجودة في ملفات البيئة (`.env.example`) ولكن لا يستخدمها الكود
تم فحص الكود بالكامل وتبين أن هذه المتغيرات مدرجة في ملفات الشرح أو الهياكل القديمة، ولكن **لا يوجد لها أي استدعاء أو استخدام برمجي على الإطلاق**:

- **VITE_RAPID_API_KEY** (غير مستخدم)
- **VITE_API_BASE_URL** (غير مستخدم)
- **VITE_API_FOOTBALL_KEY** (غير مستخدم، يتم استخدام `VITE_API_KEY` بدلاً منه)
- **VITE_API_FOOTBALL_BASE** (غير مستخدم)
- **VITE_SUPABASE_URL** (غير مستخدم، النظام يعتمد بالكامل على Firestore)
- **VITE_SUPABASE_ANON_KEY** (غير مستخدم، النظام يعتمد بالكامل على Firestore)
- **GITHUB_TOKEN** (غير مستخدم برمجياً داخل كود التطبيق)
- **GITHUB_REPO_URL** (غير مستخدم برمجياً داخل كود التطبيق)

---

## 5. المتغيرات المفقودة المسببة للمشاكل والتعطل بالإنتاج

أظهر الفحص البرمجي الدقيق أن غياب بعض المتغيرات هو المسؤول المباشر عن حدوث الأعطال التالية في بيئة الإنتاج:

### أ. حدوث خطأ HTTP 500 وتعطل Firebase و Sitemap و SEO
- **المتغير المسبب للتعطل:** `FIREBASE_SERVICE_ACCOUNT_KEY`
- **التفسير التقني:** يحاول ملف `src/lib/firebase-admin.ts` وملف `src/utils/googleIndexing.ts` تهيئة مكتبة `firebase-admin` للاتصال بـ Firestore من جهة الخادم (Server-Side) لتوليد روابط الـ Sitemap ديناميكياً ولتقديم الصفحات المحسنة للـ SEO عبر مسار `/api/seo`. 
عند غياب هذا المتغير في الإنتاج، تفشل عملية التهيئة مباشرة مسببة استثناءً مفتوحاً (Unhandled Exception) داخل دوال فيرسيل اللاسلكية (Vercel Serverless Functions). هذا الانهيار يمنع معالجة الطلب بالكامل ويُرجع للمستخدم صفحة الخطأ الشهيرة **500: INTERNAL_SERVER_ERROR** مع كود الفشل `FUNCTION_INVOCATION_FAILED`. كما تنهار روابط sitemap.xml بالكامل وتتوقف محركات البحث عن أرشفة الموقع.

### ب. تعطل عمليات تسجيل الدخول بواسطة السوشيال ميديا (OAuth Authentication)
- **المتغير المسبب للتعطل:** `APP_URL`
- **التفسير التقني:** عند محاولة تسجيل دخول المستخدمين بواسطة منصات Google أو Twitter أو Facebook، يعتمد الكود في `server/routes/social.ts` على المتغير `process.env.APP_URL` لبناء روابط إعادة التوجيه الآمنة (Callback/Redirect URIs). 
في حال غياب هذا المتغير، يتراجع الكود إلى عنوان فارغ أو افتراضي غير مطابق لإعدادات تطبيق العميل في المنصات الخارجية، مما يولد فوراً خطأ **Redirect URI Mismatch** ويفشل تسجيل الدخول بالكامل.

### ج. تعطل النشر التلقائي ومصنف الأخبار (Auto-Posting & RSS Classifier)
- **المتغير المسبب للتعطل:** `GEMINI_API_KEY` و `SOCIAL_ENCRYPTION_KEY`
- **التفسير التقني:** يقوم مصنف الأخبار `server/services/rssClassifier.ts` بمطالبة نموذج الذكاء الاصطناعي Gemini بتصنيف وتلخيص الأخبار بمجرد جلبها، ثم كتابتها آلياً. غياب `GEMINI_API_KEY` يوقف محرك الذكاء الاصطناعي بالكامل. 
بالإضافة إلى ذلك، يتم تخزين رموز الوصول الحساسة (OAuth Access Tokens) الخاصة بقنوات السوشيال ميديا مشفرة بقاعدة البيانات لحمايتها. ويعتمد تشفير وفك تشفير هذه المفاتيح برمجياً في `server/utils/crypto.ts` على `SOCIAL_ENCRYPTION_KEY` أو `GEMINI_API_KEY`. غياب المتغيرين يجعل فك التشفير مستحيلاً، وبالتالي لا يستطيع النظام النشر التلقائي على حسابات التواصل الاجتماعي.

### د. تعطل رفع وإدارة الصور في لوحة التحكم الإدارية
- **المتغير المسبب للتعطل:** `IMAGEKIT_PRIVATE`
- **التفسير التقني:** لرفع صورة بأمان من جهة الواجهة الأمامية عبر لوحة التحكم `MediaManager.tsx` يتم عمل طلب توقيع آمن من جهة الخادم في `api/imagekit.ts`. غياب `IMAGEKIT_PRIVATE` يسبب انهيار دالة التوقيع البرمجية مسببة خطأ **HTTP 500** وتوقف المشرفين عن رفع صور المقالات والشعارات والفرق بالكامل.
