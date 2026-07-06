import React from 'react';
import SEO from '../components/SEO';
import { Info, Award, Heart, Shield, Users, Mail, Compass } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import * as cmsRepository from '../features/cms/repositories/cmsRepository';
import Markdown from 'react-markdown';

export default function AboutPage() {
  const [dynamicData, setDynamicData] = React.useState<{ title: string; content: string } | null>(null);

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await cmsRepository.getPageContent('about');
        if (data) {
          setDynamicData(data);
        }
      } catch (err) {}
    };
    fetchPage();
  }, []);

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "من نحن - منصة صافرة 90",
    "description": "تعرف على منصة صافرة 90، الوجهة العربية الرقمية الأولى لتغطية المباريات وإحصائيات كرة القدم العالمية والمحلية.",
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
        title="من نحن - منصة صافرة 90 الرياضية الشاملة"
        description="منصة صافرة 90 تقدم تغطية رياضية شاملة، خدمات بث مباشر، نتائج اللحظة، وتوقعات الذكاء الاصطناعي لكافة الدوريات الكبرى والبطولات العالمية."
        schema={aboutSchema}
      />

      <div className="container mx-auto px-4 pt-10">
        <Breadcrumbs 
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'من نحن' }
          ]}
        />

        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-sm">
            {/* Page Header */}
            <div className="bg-surface-hover px-8 py-14 text-center border-b border-border relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="text-primary w-10 h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">{dynamicData?.title || "من نحن - صافرة 90"}</h1>
              <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed relative z-10">
                الوجهة العربية الرقمية الأكثر تميزاً لتغطية حية وبث ذكي لعالم كرة القدم
              </p>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {dynamicData ? (
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm md:text-base markdown-body">
                  <Markdown>{dynamicData.content}</Markdown>
                </div>
              ) : (
                <>
                  {/* Our Mission */}
                  <section className="space-y-4">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Compass className="text-primary w-5 h-5" /> رؤيتنا ورسالتنا
                    </h2>
                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                      انطلقت منصة <span className="text-white font-bold">صافرة 90 (Kora 90)</span> برؤية طموحة تهدف إلى تغيير أسلوب متابعة الرياضة في العالم العربي. نلتزم بتقديم تغطية حية فائقة السرعة للمباريات، بالإضافة إلى البيانات الإحصائية المفصلة وتوقعات الذكاء الاصطناعي والتحليل المعمق الذي يبسط للمشجع الرياضي فهم تفاصيل ومجريات الساحرة المستديرة.
                    </p>
                  </section>

                  {/* Core Values */}
                  <section className="space-y-4">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <Award className="text-primary w-5 h-5" /> لماذا يثق بنا الآلاف؟
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                        <h3 className="font-bold text-white text-md">سرعة لا تضاهى</h3>
                        <p className="text-slate-400 text-xs">تحديث فوري لنتائج المباريات وأحداث الملعب لحظة بلحظة مع تغطية شاملة للهجمات والإنذارات.</p>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                        <h3 className="font-bold text-white text-md">ذكاء اصطناعي متطور</h3>
                        <p className="text-slate-400 text-xs">أدلة رقمية ومؤشرات تعتمد على التعلم الآلي لتقديم توقعات رياضية مبنية على البيانات لفرقكم المفضلة.</p>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                        <h3 className="font-bold text-white text-md">بيئة تفاعلية آمنة</h3>
                        <p className="text-slate-400 text-xs">حماية كاملة لبيانات المشتركين والزوار مع احترام صارم لخصوصية المستخدم وحقوق الطبع والنشر.</p>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                        <h3 className="font-bold text-white text-md">خدمات متعددة</h3>
                        <p className="text-slate-400 text-xs">من الراديو الرياضي المباشر إلى حجز الملاعب، نوفر باقات بريميوم ومتجر متكامل لتلبية كل احتياجات المشجع.</p>
                      </div>
                    </div>
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
