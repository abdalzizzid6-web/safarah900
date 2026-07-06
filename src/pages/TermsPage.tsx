import React from 'react';
import SEO from '../components/SEO';
import { FileText, Settings, AlertCircle, Cpu, Copyright, Edit3, ShieldAlert, Award } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import * as cmsRepository from '../features/cms/repositories/cmsRepository';
import Markdown from 'react-markdown';

export default function TermsPage() {
  const [dynamicData, setDynamicData] = React.useState<{ title: string; content: string } | null>(null);

  React.useEffect(() => {
    const fetchPage = async () => {
      try {
        const data = await cmsRepository.getPageContent('terms');
        if (data) {
          setDynamicData(data);
        }
      } catch (err) {}
    };
    fetchPage();
  }, []);
  const termsSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "الشروط والأحكام - صافرة 90",
    "description": "يرجى قراءة شروط الخدمة والأحكام الخاصة بمنصة صافرة 90 بعناية. توضح هذه الاتفاقية القواعد والمسؤوليات والقيود المفروضة على الاستخدام الشخصي والأكاديمي للمحتوى الرياضي.",
    "publisher": {
      "@type": "Organization",
      "name": "صافرة 90",
      "url": "https://korea90.xyz",
      "logo": "https://korea90.xyz/logo-master.png"
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <SEO 
        title="الشروط والأحكام - اتفاقية استخدام منصة صافرة 90"
        description="اقرأ بنود الخدمة والشروط والأحكام المنظمة لتطبيق وموقع صافرة 90. إن استخدامك لخدماتنا يعني قبولك الضمني بكافة مواد وقواعد هذه الاتفاقية."
        schema={termsSchema}
      />

      <div className="container mx-auto px-4 pt-10">
        <Breadcrumbs 
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'الشروط والأحكام' }
          ]}
        />

        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-surface border border-white/5 rounded-[40px] shadow-2xl overflow-hidden">
            {/* Page Header */}
            <div className="bg-slate-900/60 px-8 py-14 text-center relative border-b border-white/10">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <FileText size={160} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">{dynamicData?.title || "الشروط والأحكام"}</h1>
              <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed relative z-10">
                القواعد القانونية والبنود التنظيمية لاستخدام منصة صافرة 90 الرقمية
              </p>
              <p className="text-xs text-slate-500 mt-4 font-mono relative z-10">تاريخ السريان والعمل: 31 مايو 2026</p>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {dynamicData ? (
                <div className="prose prose-invert max-w-none text-slate-350 leading-relaxed text-sm md:text-base markdown-body">
                  <Markdown>{dynamicData.content}</Markdown>
                </div>
              ) : (
                <>
                  {/* Introduction & Acceptance of terms */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Settings className="text-primary w-5 h-5" /> 1. قبول شروط الخدمة والاتفاقية
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  بدخولك وعرضك للمحتوى المنشور في تطبيق أو موقع <span className="text-white font-bold">صافرة 90</span>، أنت توافق وتوافقين صراحة وبكامل الأهلية القانونية على الالتزام بكافة الشروط والأحكام المنصوص عليها في هذه الاتفاقية. إذا كنت لا تبدي قبلاً بكامل هذه المواد والشروط أو أي بند منها، يرجى منك التوقف فوراً عن استخدام الخدمة وإغلاق صفحات الموقع.
                </p>
              </section>

              {/* Intellectual Property */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Copyright className="text-amber-500 w-5 h-5" /> 2. الملكية الفكرية وحماية المحتوى
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  جميع حقوق الملكية الفكرية في موقع صافرة 90، بما في ذلك التصاميم والواجهات، والشعارات التعبيرية وعلامة "Kora 90"، والنصوص الإخبارية وتقارير المباريات المحررة بأيدي خبرائنا، والترتيبات والبرمجيات والأنظمة الرياضية، هي ملك حصري وخاضع لحاجة وبنود حماية الممتلكات الرقمية لمنصة <span className="text-white font-bold">صافرة 90</span> ومحمية بموجب القوانين والاتفاقيات الدولية لحقوق الملكية الفكرية. يُمنع إعادة صياغة أو بيع أو ترخيص أو تداول أو استغلال أي مادة بالموقع دون موافقة خطية ومعتمدة تحت طائلة المسؤولية والملاحقة القانونية.
                </p>
              </section>

              {/* Content usage limits & Crawl restriction */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Cpu className="text-blue-500 w-5 h-5" /> 3. حدود استخدام المحتوى وقيود كشط البيانات
                </h2>
                <div className="space-y-3 text-slate-300 text-sm md:text-base leading-relaxed">
                  <p>تُقدم البيانات الرياضية ومواقيت الملاعب في صافرة 90 لأغراض الاستخدام الفردي المباشر والشخصي فقط غير التجاري. ويتعهد المستخدم صراحة بالامتناع عن:</p>
                  <ul className="list-disc list-inside space-y-2 mr-2 md:mr-4 text-slate-400 text-xs md:text-sm font-medium">
                    <li>استخدام أي روبوتات أو برامج زاحفة أو عوازل آلية لكشط البيانات (Web Scraping) بهدف استخراج المواد الرياضية وإعادتها ومنافستنا بها.</li>
                    <li>إساءة استخدام المنصة لإرسال رسائل سبام، أو تعليقات بذيئة وصادمة للذوق والأخلاق، أو مهاجمة خوادمنا الرياضية.</li>
                    <li>إزالة إشعارات حقوق الملكية الفكرية أو العلامة المائية للصور المنشورة في أخبار ميركاتو الخاصة بـ صافرة 90.</li>
                  </ul>
                </div>
              </section>

              {/* Advertising & Third party disclosures */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Award className="text-primary w-5 h-5" /> 4. الإعلانات ومحتوى جهات الطرف الثالث
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  تضم منصتنا في جوانبها مساحات إعلانية مدعومة من شركاء خارجيين مثل Google AdSense وشركائهم. إن هذه الجهات تمتلك معايير خصوصية وشروط سياق مستقلة عن صافرة 90. إن تصفحك للموقع وتفاعلك مع الإعلان والضغط عليه يقع تحت مسؤوليتك وخاضع لبنود خدمة الجهة المعلنة. لا تقدم منصة صافرة 90 أي تعهدات أو تأكيدات بخصوص جودة تلك المنتجات أو الخدمات المحال إليها إعلانياً.
                </p>
              </section>

              {/* Limits of liability */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <AlertCircle className="text-red-500 w-5 h-5" /> 5. حدود المسؤولية وإخلاء الضمانات
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  نحن نعمل على توفير أحدث البيانات وأكثر النتائج وسرعة وتزامن، ومع ذلك، فإن صافرة 90 تقدم خدماتها الرياضية "كما هي" وبدون أي ضمانات بخصوص خلو النتائج من غفلة المصادر الرياضية، الأخطاء البشرية، الأعراض والخلل البرمجي، أو تعطل خادم تكنولوجيا المعلومات. بناءً على ذلك، لا تتحمل المنصة أي مسؤولية قانونية عن خسارة مادية أو معنوية تصيب المستخدم بناءً على ثقة أو قرار اتخذ استناداً لمواقيت وتداول وحسابات وتوقعات الرياضة المعروضة.
                </p>
              </section>

              {/* Modified of terms */}
              <section className="space-y-4">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <Edit3 className="text-emerald-500 w-5 h-5" /> 6. تعديل وتطوير الشروط والأحكام
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  يمتلك مجلس إدارة صافرة 90 الحق القانوني والكامل في تغيير وتعديل وإلغاء وتحديث بنود هذه الاتفاقية في أي وقت وظرف تقتضيه المصلحة التقنية والإدارية ودون حاجة لتوجيه إنذار رسمي مسبق. تدخل التغييرات حيز السريان والتنفيذ والتطبيق الفوري بمجرد صدورها ونشرها وتحديث تاريخ التعديل في هذه الصفحة، لذا ننصح بزيارتها ومتبعة بنودها دورياً.
                </p>
              </section>

              {/* Security Warning */}
              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-start gap-4">
                <ShieldAlert className="text-red-500 shrink-0 w-6 h-6" />
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">مخالفة الشروط وحظر الاستخدام</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    تحتفظ منصة صافرة 90 بحقها الكامل في حظر أي عنوان آي بي (IP Address) أو حظر تصفح أي مستخدم يثبت تورطه في محاولات لزعزعة الخوارزميات، أو قرصنة المنصة، أو شن هجمات حرمان الخدمة (DDoS)، وملاحقة المتورطين قضائياً بالتوافق مع القوانين والجرائم التقنية المعتمدة دولياً وعربياً.
                  </p>
                </div>
              </div>
              </>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
