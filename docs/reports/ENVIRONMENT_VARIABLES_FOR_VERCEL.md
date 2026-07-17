# تدقيق كامل لجميع متغيرات البيئة (ENVIRONMENT_VARIABLES_FOR_VERCEL.md)

يحتوي هذا المستند على تدقيق شامل لجميع متغيرات البيئة المستخدمة في مشروع **Safara 90** عبر الواجهة الأمامية والخلفية والـ APIs والـ Admin والخدمات المختلفة لضمان جاهزية التشغيل والنشر السلس على منصة **Vercel**.

*ملاحظة هامة: لا يحتوي هذا الجدول على أي قيم تجريبية أو افتراضية أو وهمية. إذا لم يكن المتغير موجوداً في ملفات المشروع الحالية، تم تصنيفه بـ `NOT FOUND` بشكل واضح.*

---

## جدول متغيرات البيئة المستخدمة في المشروع

| اسم المتغير | مطلوب؟ | مكان استخدامه | القيمة الحالية إن وجدت | مثال للقيمة | هل هو سري؟ | ملاحظات |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **نعم** (إلزامي للإنتاج والـ SEO) | `src/utils/googleIndexing.ts`, `src/lib/firebase-admin.ts`, `api/test-firebase.ts` | **NOT FOUND** | **NOT FOUND** | نعم | ملف حساب الخدمة الخاص بـ Firebase Admin SDK. غيابه يعطل خادم الإنتاج على Vercel ويسبب خطأ `HTTP 500`. |
| `GEMINI_API_KEY` | **نعم** (إلزامي للذكاء الاصطناعي) | `server/routes/admin.ts`, `server/routes/media.ts`, `server/services/rssClassifier.ts`, `server/services/aiService.ts`, `server/utils/crypto.ts`, `server/index.ts` | **NOT FOUND** | **NOT FOUND** | نعم | مفتاح الوصول لنموذج Gemini AI لتصنيف الأخبار وتوليد ميزات البث المباشر والمقالات وتشفير حسابات السوشيال. |
| `APP_URL` | **نعم** (إلزامي للإنتاج والـ Social) | `server/routes/social.ts` | **NOT FOUND** | **NOT FOUND** | لا | الرابط الأساسي للتطبيق المستضاف، يستخدم لتوليد روابط توجيه OAuth وتسجيل الدخول الاجتماعي. |
| `VITE_API_KEY` | **نعم** (إلزامي للبيانات الرياضية) | `src/App.tsx`, `src/api/apiClient.ts`, `server/services/apiManager.ts` | `6ca2df456728038b3401fbba80a13344` (قيمة احتياطية مدمجة بالكود) | `6ca2df456728038b3401fbba80a13344` | نعم | المفتاح الأساسي لجلب البيانات الرياضية من **API-Football**. |
| `VITE_FOOTBALL_DATA_KEY` | **نعم** (اختياري / كخط دفاع ثانٍ) | `server/routes/proxies.ts`, `server/index.ts` | `b52fe40577134e59a5796404b7ebc73c` (قيمة احتياطية مدمجة بالكود) | `b52fe40577134e59a5796404b7ebc73c` | نعم | مفتاح الوصول لـ **Football-Data.org** كخادم بيانات احتياطي عند حدوث فشل في المزود الرئيسي. |
| `VITE_FOOTBALL_DATA_BASE` | لا | `server/index.ts` | `https://api.football-data.org/v4` (قيمة احتياطية مدمجة بالكود) | `https://api.football-data.org/v4` | لا | الرابط الأساسي لـ Football-Data.org. |
| `VITE_IMAGEKIT_PUBLIC` / `IMAGEKIT_PUBLIC` | **نعم** (إلزامي للميديا) | `src/admin/shared/MediaManager.tsx`, `api/imagekit.ts`, `server/routes/imagekit.ts` | **NOT FOUND** | **NOT FOUND** | لا | المفتاح العام لمنصة ImageKit لإدارة ورفع صور المقالات والمباريات. |
| `IMAGEKIT_PRIVATE` | **نعم** (إلزامي للرفع) | `api/imagekit.ts`, `server/routes/imagekit.ts` | **NOT FOUND** | **NOT FOUND** | نعم | المفتاح الخاص بـ ImageKit لتوقيع طلبات الرفع الآمنة من جهة الخادم. |
| `VITE_IMAGEKIT_URL_ENDPOINT` / `IMAGEKIT_URL_ENDPOINT` | **نعم** (إلزامي للميديا) | `src/admin/shared/MediaManager.tsx`, `src/lib/imageUtils.ts`, `api/imagekit.ts`, `server/routes/imagekit.ts` | **NOT FOUND** | **NOT FOUND** | لا | رابط الـ CDN الخاص بـ ImageKit لعرض وتحسين جودة الصور. |
| `VITE_FCM_VAPID_KEY` | **نعم** (إلزامي للإشعارات) | `src/services/notificationService.ts`, `src/firebase.ts` | **NOT FOUND** | **NOT FOUND** | لا | مفتاح VAPID العام للاتصال بـ Firebase Cloud Messaging لإرسال الإشعارات الفورية. |
| `ENCRYPTION_KEY` | لا | `src/lib/crypto.ts` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` (قيمة احتياطية مدمجة بالكود) | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | نعم | مفتاح التشفير الخاص بخوارزمية AES-256-CBC المستخدمة لتأمين البيانات محلياً. |
| `SOCIAL_ENCRYPTION_KEY` | لا | `server/utils/crypto.ts` | `safara-90-secret-fallback-key-32b` (قيمة احتياطية مدمجة بالكود) | `safara-90-secret-fallback-key-32b` | نعم | مفتاح التشفير لتأمين حسابات التواصل ورموز الوصول (OAuth tokens). |
| `REDIS_URL` | لا | `server/socket.js` | **NOT FOUND** | **NOT FOUND** | نعم | رابط الاتصال بـ Redis لإدارة جلسات الـ WebSockets المشتركة عبر الخوادم المتعددة. |
| `VITE_SUPABASE_URL` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | لا | غير مستخدم في شيفرة المشروع. |
| `VITE_SUPABASE_ANON_KEY` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | نعم | غير مستخدم في شيفرة المشروع. |
| `VITE_RAPID_API_KEY` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | نعم | غير مستخدم في شيفرة المشروع. |
| `VITE_API_BASE_URL` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | لا | غير مستخدم في شيفرة المشروع. |
| `VITE_API_FOOTBALL_KEY` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | نعم | غير مستخدم في شيفرة المشروع. |
| `VITE_API_FOOTBALL_BASE` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | لا | غير مستخدم في شيفرة المشروع. |
| `GITHUB_TOKEN` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | نعم | غير مستخدم برمجياً داخل كود التطبيق. |
| `GITHUB_REPO_URL` | لا (غير مستخدم برمجياً) | غير مستخدم بالكود | **NOT FOUND** | **NOT FOUND** | لا | غير مستخدم برمجياً داخل كود التطبيق. |
