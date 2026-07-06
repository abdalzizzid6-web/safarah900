import React from 'react';
import SEO from '../components/SEO';
import { ShieldAlert, Info, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import * as cmsRepository from '../features/cms/repositories/cmsRepository';
import Markdown from 'react-markdown';

export default function DisclaimerPage() {
  const [dynamicData, setDynamicData] = React.useState<{ title: string; content: string } | null>(null);

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await cmsRepository.getPageContent('disclaimer');
        if (data) {
          setDynamicData(data);
        }
      } catch (err) {}
    };
    fetchPage();
  }, []);

  const sSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "إخلاء المسؤولية - صافرة 90",
    "description": "يرجى قراءة إخلاء المسؤولية القانوني لصفحة صافرة 90 بشأن دقة البيانات، المحتوى الخارجي، وخدمات البث والمباريات."
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-20" dir="rtl">
      <SEO 
        title="إخلاء المسؤولية - التوضيحات القانونية لمنصة صافرة 90"
        description="اقرأ إخلاء المسؤولية القانوني لمنصة صافرة 90 للتعرف على حدود مسؤوليتنا القانونية بشأن دقة الإحصائيات الرياضية وروابط البث الخارجية."
        schema={sSchema}
      />

      <div className="container mx-auto px-4 pt-10">
        <Breadcrumbs 
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'إخلاء المسؤولية' }
          ]}
        />

        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-sm">
            {/* Page Header */}
            <div className="bg-surface-hover px-8 py-14 text-center border-b border-border relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-red-500 w-10 h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">{dynamicData?.title || "إخلاء المسؤولية القانونية"}</h1>
              <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed relative z-10">
                التوضيحات والحدود القانونية المتعلقة بالبيانات والمعلومات المعروضة على المنصة
              </p>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {dynamicData ? (
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm md:text-base markdown-body">
                  <Markdown>{dynamicData.content}</Markdown>
                </div>
              ) : (
                <>
                  <section className="space-y-4">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <AlertTriangle className="text-red-500 w-5 h-5 animate-pulse" /> 1. طبيعة المعلومات والمسؤولية
                    </h2>
                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                      جميع البيانات المفصلة والنتائج والتواريخ وإحصائيات الفرق المعروضة في منصة <span className="text-white font-bold">صافرة 90</span> تُجلب من مصادر عامة ومزودي معلومات رياضية رسميين ومستقلين. بالرغم من حرصنا الشديد وسعينا الدائم لتدقيق ومراجعة وتحديث هذه المعلومات، إلا أننا لا نقدم أي ضمانات صريحة أو ضمنية بدقة المحتوى أو خلوه التام من الأخطاء العارضة أو التأخير الناتج عن أسباب فنية. استخدامك للمعلومات الواردة في هذا الموقع يتم تحت مسؤوليتك الخاصة بالكامل.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Info className="text-blue-500 w-5 h-5" /> 2. الروابط الخارجية والمواقع الشريكة
                    </h2>
                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                      قد تحتوي منصتنا على روابط إلكترونية خارجية أو صفحات فرعية لخدمات تابعة لأطراف ثالثة (مثل إعلانات Google AdSense أو خدمات حجز مستقلة). هذه الروابط والمواقع الخارجية غير خاضعة لإدارة أو رقابة منصة صافرة 90. إننا نخلي مسؤوليتنا التامة والكاملة عن أي محتوى أو معايير خصوصية أو معاملات تجارية أو ضرر قد ينتج عن استخدامك لتلك الروابط أو المواقع الخارجية.
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
