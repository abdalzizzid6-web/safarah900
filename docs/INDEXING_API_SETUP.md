# إعداد Google Indexing API للفهرسة التلقائية

يتيح هذا النظام إخطار محركات بحث Google تلقائياً عند نشر أو تحديث مقال إخباري جديد، مما يسرع عملية الفهرسة.

## الخطوات المطلوبة:

### 1. إعداد Google Cloud Project
1. توجه إلى [Google Cloud Console](https://console.cloud.google.com/).
2. اختر مشروعك المرتبط بالتطبيق.
3. ابحث عن **Indexing API** في مكتبة الخدمات (API Library) وقم بتفعيله.

### 2. إعداد الحساب الخدمي (Service Account)
1. في Google Cloud Console، توجه إلى **IAM & Admin** > **Service Accounts**.
2. قم بإنشاء حساب خدمي جديد إذا لم يكن لديك حساب حالياً.
3. من خيارات الحساب، قم بإنشاء **Key** من نوع **JSON**. احتفظ بملف الـ JSON (سيحتوي على `client_email` و `private_key`).
4. أضف قيمة `private_key` في إعدادات التطبيق (البيئة) تحت اسم `FIREBASE_SERVICE_ACCOUNT_KEY`.

### 3. ربط الحساب بـ Google Search Console
للسماح للحساب الخدمي بالإرسال، يجب إضافة البريد الإلكتروني الخاص به (`client_email` الموجود بملف الـ JSON) كـ **Owner** في [Google Search Console](https://search.google.com/search-console/):
1. افتح موقعك في Search Console.
2. توجه إلى **Settings** > **Users & permissions**.
3. أضف `client_email` الخاص بالحساب الخدمي بصلاحية **Owner**.

### 4. دمج التفعيل في الكود
يوجد بالفعل ملف مساعدة جاهز في `/src/utils/googleIndexing.ts`. كل ما عليك فعله هو استدعاء الدالة عند إجراء العملية.

مثال للتطبيق في `/src/services/newsService.ts`:

```typescript
import { notifyGoogleIndexing } from '../utils/googleIndexing';

// داخل دالة createNews:
async createNews(newsData: Partial<News>): Promise<string> {
    const docRef = await addDoc(this.newsCollection, { ...newsData });
    // إخطار جوجل بعد النشر الناجح
    notifyGoogleIndexing(`https://korea90.xyz/news/${docRef.id}`, 'URL_UPDATED');
    return docRef.id;
}
```

هذا الإجراء سيضمن إرسال إشارة لـ Google بمجرد نشر أي خبر جديد.
