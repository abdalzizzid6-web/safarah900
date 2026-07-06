import React from 'react';
import SEO from '../components/SEO';
import { Shield, Lock, EyeOff, Cookie, Share2, MessageCircle, Info, Database, Eye } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import * as cmsRepository from '../features/cms/repositories/cmsRepository';
import Markdown from 'react-markdown';

export default function PrivacyPage() {
  const [dynamicData, setDynamicData] = React.useState<{ title: string; content: string } | null>(null);

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await cmsRepository.getPageContent('privacy');
        if (data) {
          setDynamicData(data);
        }
      } catch (err) {}
    };
    fetchPage();
  }, []);
  const privacySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "سياسة الخصوصية - صافرة 90",
    "description": "اقرأ سياسة الخصوصية الرسمية لمنصة صافرة 90 للتعرف على كيفية جمع واستخدام وحماية البيانات الشخصية لزوارنا الكرام وفقاً للمعايير العالمية وقواعد Google AdSense.",
    "publisher": {
      "@type": "Organization",
      "name": "صافرة 90",
      "url": "https://korea90.xyz",
      "logo": "https://korea90.xyz/logo-master.png"
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-20" dir="rtl">
      <SEO 
        title="سياسة الخصوصية - التزامنا بحماية بياناتك وخصوصيتك في صافرة 90"
        description="نحن في صافرة 90 نلتزم التزاماً صارماً بحماية خصوصيتك وبياناتك الشخصية. اطلع على سياسة الخصوصية الخاصة بنا لفهم ممارسات حماية البيانات وعلاقتنا بملفات تعريف الارتباط."
        schema={privacySchema}
      />

      <div className="container mx-auto px-4 pt-10">
        <Breadcrumbs 
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'سياسة الخصوصية' }
          ]}
        />

        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-sm">
            {/* Page Header */}
            <div className="bg-surface-hover px-8 py-14 text-center border-b border-border relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-primary w-10 h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">{dynamicData?.title || "سياسة الخصوصية"}</h1>
              <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed relative z-10">
                ميثاق الأمان وحماية خصوصية البيانات الشخصية لدى مستخدمي منصة صافرة 90 الرياضية
              </p>
              <p className="text-xs text-slate-500 mt-4 font-mono relative z-10">تاريخ آخر تحديث: 31 مايو 2026</p>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {dynamicData ? (
                <div className="prose prose-invert max-w-none text-slate-350 leading-relaxed text-sm md:text-base markdown-body">
                  <Markdown>{dynamicData.content}</Markdown>
                </div>
              ) : (
                <>
                  {/* Introduction */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Shield className="text-primary w-5 h-5" /> 1. مقدمة وتمهيد بخصوص الثقة
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  نحن في <span className="text-white font-bold">صافرة 90 (Kora 90)</span> نولي أهمية قصوى لسرية وخصوصية بيانات مستخدمي وزوار موقعنا الإلكتروني. تهدف هذه الوثيقة إلى شرح ممارستنا المتعلقة بنوعية البيانات التي نجمعها، وكيفية معالجتها، والتدابير التقنية الصارمة التي نتبعها لضمان حماية بياناتك وفقاً للمعايير العالمية ومبدأ الشفافية المطلوبة لقبول محتوى الويب إعلانياً وتجارياً.
                </p>
              </section>

              {/* Data collected */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Database className="text-emerald-500 w-5 h-5" /> 2. البيانات التي نقوم بجمعها
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  خلال زيارتك وتفاعلك مع منصتنا الرياضية لعرض أخبار الملاعب أو نتائج المباريات، قد نقوم بجمع ومعالجة البيانات التالية:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> المعلومات الاختيارية التي تقدمها
                    </h4>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      وتشمل التفاصيل الشخصية التي تختار بكامل إرادتك مشاركتها معنا، مثل الاسم وعنوان بريدك الإلكتروني عند تعبئة نموذج "اتصل بنا"، أو الاشتراك في نظام التنبيهات الإخبارية الرياضية، أو عند إرسال تعليقات ومقترحات.
                    </p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                    <h4 className="text-white font-bold text-base flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> ملفات السجل والبيانات الآلية
                    </h4>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      يقوم موقعنا تلقائياً وبشكل مجهل بجمع بيانات فنية تتعلق بكيفية وصولك وجهاز المستخدم (مثل بروتوكول الإنترنت IP، نوع متصفح الويب، لغة التصفح، مزود الخدمة، تاريخ ووقت الزيارة، الصفحات التي تصفحتها، ومدة الاستخدام الممتد) لغرض تحسين الأداء التقني.
                    </p>
                  </div>
                </div>
              </section>

              {/* Cookies & Web Beacons */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Cookie className="text-amber-500 w-5 h-5" /> 3. ملفات تعريف الارتباط وعدادات الشبكة (Cookies & Web Beacons)
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  نحن نستخدم ملفات تعريف الارتباط المجهدة لتسهيل استخدام الموقع وحفظ إعداداتك المفضلة (مثل تذكر الوضع الداكن أو الدوري والفرق التي تشجعها). تساعدنا هذه الملفات على توفير محتوى موجه وتفادي الإدخال المتكرر للإعدادات ذاتها في كل زيارة. بإمكانك تعديل خصائص متصفحك لوقف قبول أو تنبيهك بملفات تعريف الارتباط من خلال إعدادات المتصفح.
                </p>
              </section>

              {/* Integration with Google Analytics & AdSense */}
              <section className="space-y-4 p-6 md:p-8 bg-blue-500/5 border border-blue-500/10 rounded-[32px]">
                <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                  <Eye className="text-primary w-5 h-5" /> 4. الإعلانات والتحليلات (Google AdSense & Analytics)
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  يتعاون موقع صافرة 90 مع شركاء خارجيين موثوقين لتقديم خدمات الإعلانات والتحليل الإحصائي للزوار:
                </p>
                <ul className="space-y-3 text-slate-400 text-xs md:text-sm list-disc list-inside mt-4">
                  <li>
                    <strong className="text-white">Google Analytics:</strong> نستخدمها لغرض تجميع إحصائيات دقيقة ومجهلة المصدر حول حركة حركة التصفح ونسب الزيارات وسلوك المستخدم داخل ثنايا الموقع بهدف التطوير الفني المستمر.
                  </li>
                  <li>
                    <strong className="text-white">Google AdSense:</strong> بصفتها موزعاً إعلانياً كطرف ثالث، تستخدم شركة Google ملفات تعريف الارتباط (مثل ملف DART) لعرض الإعلان المناسب لاهتماماتك بناءً على زياراتك السابقة لموقعنا ولمواقع الويب الأخرى.
                  </li>
                  <li>
                    تسمح هذه التقنيات لشركة Google والشركات الحليفة لها بعرض الإعلانات بناءً على اهتمامات المستخدم الرياضية والتجارية بطريقة آمنة ومشفرة تماماً.
                  </li>
                  <li>
                    بإمكانك دائماً إلغاء الاشتراك من تتبع الإعلانات المستهدفة وتتبع ملفات DART عبر الانتقال لصفحة إعدادات إعلانات Google والخصوصية مباشرة.
                  </li>
                </ul>
              </section>

              {/* SSL Security and encryption */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Lock className="text-emerald-500 w-5 h-5" /> 5. أمن وحماية البيانات الشخصية
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  نحن نستخدم بروتوكولات الأمان القياسية والتقنيات الاحترافية الأكثر موثوقية (مثل تشفير البيانات بنظام <strong>SSL/TLS</strong>) لحماية البيانات الحساسة المنقولة بين جهازك وخوادمنا من الفقدان، إساءة الاستخدام، التغيير غير المصرح به أو الاختراق الرقمي. نلتزم دورياً بمراجعة منافذ الأمان وصلاحية تراخيص الحماية للموقع لضمان بيئة آمنة للمشجع العربي.
                </p>
              </section>

              {/* External Links */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Share2 className="text-blue-500 w-5 h-5" /> 6. الروابط الخارجية ومواقع الطرف الثالث
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  قد تشتمل منصتنا على روابط إحالة لمواقع ومحطات ومصادر خارجية (مثل روابط البث التلفزيوني الرسمي، أو منصات التواصل للأندية، أو جهات رائدة). يرجى التفهم بأننا لا نمتلك أي سلطة قانونية أو إدارية على محتوى تلك الموارد أو ممارسات الخصوصية المتبعة لديها، لذا ننصح دائماً بقراءة سياسات الخصوصية الخاصة بها قبل استخدامها.
                </p>
              </section>

              {/* User Rights (GDPR/CCPA compliant) */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <EyeOff className="text-purple-500 w-5 h-5" /> 7. حقوق المستخدمين والتحكم بخصوصيتك
                </h2>
                <div className="space-y-3 text-slate-300 text-sm md:text-base leading-relaxed">
                  <p>
                    طبقاً للممارسات القانونية والتقنية الحديثة لحماية البيانات (مثل اللائحة العامة لحماية البيانات GDPR وقانون خصوصية المستهلك في كاليفورنيا CCPA)، يتمتع زوار صافرة 90 بالحقوق التالية:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-400 text-xs md:text-sm mr-2 md:mr-4 font-medium">
                    <li>الحق في تصفح الموقع بالكامل وقراءة الأخبار ومواعيد المباريات دون تقديم أي بيانات شخصية مجبرة.</li>
                    <li>الحق في الوصول إلى أي بيانات قدمتها ومعرفة طبيعة تخزينها.</li>
                    <li>الحق في مراجعة، تعديل وتحديث، أو تصحيح بياناتك الشخصية المخزنة لدينا في أي وقت.</li>
                    <li>الحق في طلب حذف كافة سجلاتك وبيانات بريدك الإلكتروني من برامجنا (حق نسيان البيانات).</li>
                  </ul>
                </div>
              </section>

              {/* Official Support contact for complaints */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <MessageCircle className="text-indigo-500 w-5 h-5" /> 8. اتصل بالمسؤول عن حماية البيانات
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  لقد خصصنا مكتب تفتيش وفريقاً فنياً مستقلاً ومكلفاً بحل وتلقي البلاغات والشكاوى المتعلقة بالسرية وخصوصية البيانات. لطلب الاستفسار أو ممارسة حقوق الخصوصية الخاصة بك، يُرجى إرسال رسالة رسمية لبريد الدعم الفني:
                </p>
                <div className="flex justify-center pt-6">
                  <div className="bg-slate-900 border border-white/10 px-8 py-5 rounded-2xl flex flex-col md:flex-row items-center gap-4 text-center">
                    <p className="text-slate-400 font-bold text-sm">بريد الاستفسارات وبلاغات الخصوصية الرسمية:</p>
                    <a href="mailto:support@korea90.xyz" className="text-primary font-mono font-black text-base hover:underline">
                      support@korea90.xyz
                    </a>
                  </div>
                </div>
              </section>
              </>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
