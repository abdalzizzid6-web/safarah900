import React from 'react';
import SEO from '../components/SEO';
import { Cookie, ShieldAlert, Settings, Info, Chrome, ShieldCheck } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';

export default function CookiePolicyPage() {
  const cookiePolicySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "سياسة ملفات تعريف الارتباط - Safara 90",
    "description": "توفر هذه الصفحة معلومات مفصلة وشاملة حول استخدام ملفات تعريف الارتباط (Cookies) والتقنيات المشابهة في موقع Safara 90، لمساعدتك على فهم خياراتك والتحكم بخصوصيتك.",
    "publisher": {
      "@type": "Organization",
      "name": "Safara 90",
      "url": "https://korea90.xyz",
      "logo": "https://korea90.xyz/logo-master.png"
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      <SEO 
        title="سياسة ملفات تعريف الارتباط (Cookies) - Safara 90"
        description="اقرأ سياسة ملفات تعريف الارتباط لمنصة صافرة 90 المعتمدة. نوضح في هذه الصفحة أنواع ملفات تعريف الارتباط المستخدمة، أغراضها، وعلاقتها بإعلانات Google AdSense وGoogle Analytics."
        schema={cookiePolicySchema}
      />

      <div className="container mx-auto px-4 pt-10">
        <Breadcrumbs 
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'سياسة ملفات تعريف الارتباط' }
          ]}
        />

        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-surface border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
            {/* Header section with gradient */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 px-8 py-14 text-center border-b border-white/10 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_60%)] pointer-events-none" />
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cookie className="text-amber-500 w-10 h-10 animate-pulse" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">سياسة ملفات تعريف الارتباط (Cookies)</h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base relative z-10 leading-relaxed">
                في <span className="text-primary font-bold">Safara 90</span>، نؤمن بالشفافية المطلقة. توضح هذه السياسة بالتفصيل كيف ولماذا نستخدم ملفات تعريف الارتباط والتقنيات المشابهة لتقديم وتحسين خدماتنا الرياضية الرقمية.
              </p>
              <p className="text-xs text-slate-500 mt-4 font-mono relative z-10">آخر تحديث: 31 مايو 2026</p>
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {/* Introduction */}
              <section className="space-y-4">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <Info className="text-primary w-6 h-6" /> ما هي ملفات تعريف الارتباط؟
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة ومجردة يتم تخزينها على جهاز الكمبيوتر أو الهاتف الذكي الخاص بك عند زيارتك لموقعنا الإلكتروني. تُساعد هذه الملفات متصفحك في التعرف على تفضيلاتك وتفاعلاتك السابقة، مما يسهّل عليك تصفح الموقع، ويحفظ إعداداتك الخاصة (مثل تحديد مظهر الموقع الداكن أو الفاتح، أو تفضيل الدوري المفضل) دون الحاجة لإعادة ضبطها مع كل زيارة.
                </p>
              </section>

              {/* Types of cookies */}
              <section className="space-y-6">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <Settings className="text-primary w-6 h-6" /> أنواع ملفات تعريف الارتباط التي نستخدمها
                </h2>
                <p className="text-slate-300 text-sm md:text-base">
                  نحن نستخدم فئات مختلفة من ملفات تعريف الارتباط لتوفير أفضل تجربة رياضية ممكنة، وتتلخص في الآتي:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-3">
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black">ضرورية للغاية</span>
                    <h3 className="text-base font-bold text-white">ملفات التشغيل الصارمة</h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      هذه الملفات أساسية لعمل الموقع وتصفح وظائفه بحرية وأمان. لا يمكن للموقع العمل بدونها بشكل صحيح، مثل تخزين حالة تسجيل الدخول، وحفظ جلسات المستخدم الأمنة، وتفادي هجمات الاختراق التقني.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-3">
                    <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black">أداء وإحصائيات</span>
                    <h3 className="text-base font-bold text-white">ملفات التحليل والقياس</h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      تسمح لنا بفهم كيفية تفاعل الزوار مع صفحات صافرة 90، ومعرفة الصفحات الأكثر والأقل قراءة، وتتبع سرعة استجابة الموقع لتقديم الخدمة الأسرع لحظة بلحظة. نستخدم في هذا الشأن أداة Google Analytics بشكل مجهل تماماً.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-3">
                    <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-black">وظيفية وتفضيلية</span>
                    <h3 className="text-base font-bold text-white">حفظ التفضيلات الفردية</h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      تُستخدم هذه الملفات لتذكر تفضيلاتك وخياراتك المخصصة لجعل تجربة تصفحك أكثر سرعة وسلاسة، مثل تذكر الفريق أو الدوري المفضل لديك، حالة التنبيهات ونظام الإشعارات، لتوفير المحتوى الرياضي الملائم لشخصيتك تلقائياً.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-3">
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-black">إعلانية مستهدفة</span>
                    <h3 className="text-base font-bold text-white">ملفات AdSense والطرف الثالث</h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      يتم تفعيلها من قبل شركائنا الإعلانيين كـ Google AdSense. تُساعد هذه الملفات في عرض إعلانات مخصصة تهم تطلعاتك الرياضية أو التجارية بدلاً من الإعلانات العشوائية، بفضل تقنيات تتبع اهتمامات التصفح السابقة بطريقة آمنة ومشفرة.
                    </p>
                  </div>
                </div>
              </section>

              {/* Google AdSense & Analytics Detail */}
              <section className="space-y-4 p-6 md:p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Chrome className="text-primary w-5 h-5" /> ملف تعريف الارتباط DART من Google
                </h2>
                <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
                  <p>
                    تستخدم شركة Google بصفتها طرفًا ثالثًا ملفات تعريف الارتباط لعرض الإعلانات على شبكة الإنترنت وتطبيق <span className="text-white font-semibold">صافرة 90</span>.
                  </p>
                  <p>
                    يُمكّن ملف تعريف الارتباط <strong>DART</strong> شركة Google ومورديها من تقديم إعلانات مخصصة ومجردة للمشتركين بناءً على زياراتهم لمنصتنا ومواقع أخرى على شبكة الإنترنت.
                  </p>
                  <p>
                    يمكن للمستخدمين اختيار إلغاء وعطل استخدام ملف تعريف الارتباط DART من خلال مراجعة سياسة الخصوصية الخاصة بالإعلانات المحسّنة من Google في الرابط المتاح في إعدادات خصوصية حساب Google الخاص بهم.
                  </p>
                </div>
              </section>

              {/* How to disable cookies */}
              <section className="space-y-4">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                  <ShieldAlert className="text-red-500 w-6 h-6" /> كيف تتحكم بملفات تعريف الارتباط وتلغي تفعيلها؟
                </h2>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                  يمكنك التحكم في ملفات تعريف الارتباط وإدارتها بشكل كامل من خلال إعدادات متصفح الإنترنت الخاص بك. توفر معظم المتصفحات خيارات لمنع قبول كوكيز جديدة، أو تنبيهك عند استقبال ملفات جديدة، أو إلغاء تفعيل كافة ملفات الكوكيز بشكل كامل.
                </p>
                <div className="space-y-3 font-medium text-xs md:text-sm text-slate-400 mr-2 md:mr-4">
                  <p>إليك طرق إدارة ملفات تعريف الارتباط في أشهر متصفحات الويب الراقية:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-slate-200">Google Chrome:</strong> الإعدادات &gt; الخصوصية والأمان &gt; ملفات تعريف الارتباط وبيانات الموقع الأخرى.</li>
                    <li><strong className="text-slate-200">Apple Safari:</strong> تفضيلات &gt; الخصوصية &gt; منع كل ملفات تعريف الارتباط.</li>
                    <li><strong className="text-slate-200">Mozilla Firefox:</strong> الخيارات &gt; الخصوصية والأمان &gt; كوكيز وبيانات الموقع.</li>
                    <li><strong className="text-slate-200">Microsoft Edge:</strong> الإعدادات &gt; ملفات تعريف الارتباط وأذونات الموقع.</li>
                  </ul>
                  <p className="text-amber-400/80 mt-4 leading-relaxed font-semibold">
                    * ملاحظة وتنبيه: يرجى العلم بأن تعطيل ملفات تعريف الارتباط كلياً قد يؤثر سلباً على أداء بعض الميزات التفاعلية المتقدمة وتخصيص تجربة التصفح في صافرة 90.
                  </p>
                </div>
              </section>

              {/* Agreement statement */}
              <section className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center gap-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-emerald-500 w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-base">استمرارك في التصفح يعني القبول والموافقة</h4>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                    باستمرارك في تصفح واستخدام منصة صافرة 90 وتصفح أخبار الملاعب ومواعيد المباريات الحية، فإنك توافق على استخدامنا لملفات تعريف الارتباط طبقاً لما هو موضح في هذه السياسة المتكاملة لضمان جودة الأداء المتميز.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
