import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import SEO from '../components/SEO';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-right hover:bg-white/5 transition-all"
      >
        <span className="font-black text-white">{question}</span>
        {isOpen ? <ChevronUp className="text-primary" /> : <ChevronDown className="text-gray-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6"
          >
            <p className="text-gray-400 font-bold leading-loose text-sm">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FAQPage() {
  const faqs = [
    {
      question: "ما هي منصة صافرة 90؟",
      answer: "صافرة 90 هي منصة رياضية رقمية متكاملة تهدف لنقل أحداث كرة القدم العالمية والعربية بدقة احترافية، من خلال توفير بث مباشر للنتائج، إحصائيات دقيقة، وتوقعات مدعومة بالذكاء الاصطناعي."
    },
    {
      question: "هل البث المباشر مجاني؟",
      answer: "نعم، نحن نوفر متابعة حية لنتائج المباريات وتغطية شاملة للأحداث الكروية الكبرى بشكل مجاني تماماً لمستخدمينا."
    },
    {
      question: "كيف يمكنني تفعيل التنبيهات؟",
      answer: "يمكنك تفعيل التنبيهات من خلال الانتقال إلى ملفك الشخصي واختيار إعدادات التنبيهات، أو الضغط على زر الجرس في صفحات المباريات المفضلة لديك."
    },
    {
      question: "هل تتوفر إحصائيات كأس العالم 2026؟",
      answer: "بكل تأكيد، لدينا قسم خاص مخصص لتغطية المونديال القادم، يتضمن ترتيب المجموعات، نتائج التصفيات، وأرشيف كامل للمباريات."
    }
  ];

  return (
    <div className="space-y-12 py-8">
      <SEO 
        title="الأسئلة الشائعة" 
        description="كل ما تريد معرفته عن منصة صافرة 90 واستخداماتها ومميزاتها التقنية المتطورة. البث المباشر، إحصائيات كأس العالم، والخدمات الرياضية المتكاملة."
        faq={faqs}
      />

      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-primary/10 rounded-3xl text-primary mb-2">
          <HelpCircle size={48} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white italic">الأسئلة <span className="text-primary tracking-tighter">الشائعة</span></h1>
        <p className="text-gray-400 font-bold max-w-2xl mx-auto">كل ما تريد معرفته عن منصة صافرة 90 واستخداماتها ومميزاتها التقنية المتطورة.</p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        {faqs.map((faq, i) => (
          <FAQItem key={i} {...faq} />
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-[3rem] p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 blur-[80px]" />
        <h2 className="text-2xl font-black text-white mb-4 relative z-10">لديك سؤال آخر؟</h2>
        <p className="text-gray-400 font-bold mb-8 relative z-10">فريق الدعم الفني لدينا متاح دائماً للإجابة على جميع استفساراتك بأسرع وقت ممكن.</p>
        <button className="bg-primary text-black px-12 py-4 rounded-2xl font-black text-sm relative z-10 hover:scale-105 transition-all shadow-xl shadow-primary/20">
          تواصل معنا الآن
        </button>
      </div>
    </div>
  );
}
