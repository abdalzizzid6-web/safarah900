import React from 'react';
import { motion } from 'motion/react';
import { Megaphone, Calendar, ChevronLeft } from 'lucide-react';

const AnnouncementCard = ({ date, title, content, tag }: { date: string, title: string, content: string, tag: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 group hover:border-primary/20 transition-all"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <Calendar size={20} />
        </div>
        <span className="text-xs font-black text-gray-500 font-mono tracking-widest">{date}</span>
      </div>
      <span className="text-[10px] font-black bg-white/5 border border-white/10 text-gray-400 px-3 py-1 rounded-full uppercase tracking-tighter">
        {tag}
      </span>
    </div>

    <div className="space-y-3">
      <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-gray-400 font-bold text-sm leading-loose">
        {content}
      </p>
    </div>

    <button className="flex items-center gap-2 text-xs font-black text-primary self-start group-hover:translate-x-2 transition-transform">
      <span>عرض التفاصيل الكاملة</span>
      <ChevronLeft size={16} />
    </button>
  </motion.div>
);

export default function AnnouncementsPage() {
  const news = [
    {
      date: "2026/06/05",
      tag: "تفعيل",
      title: "إطلاق التوقعات الذكية لكأس العالم 2026",
      content: "يسرنا أن نعلن عن إدراج محرك التوقعات الرياضي الجديد المدفوع ببيانات الذكاء الاصطناعي، لتقديم تحليل أدق لمباريات تصفيات المونديال القادمة."
    },
    {
      date: "2026/05/28",
      tag: "تحديث",
      title: "تحديث واجهة المستخدم (The Arena Edition)",
      content: "تم إطلاق النسخة الجديدة من واجهة التطبيق، مع تحسينات كبيرة في سرعة تصفح النتائج المباشرة وتطوير نظام التنبيهات الفورية."
    },
    {
      date: "2026/05/15",
      tag: "تنبيه",
      title: "صيانة مجدولة لخوادم البيانات الحية",
      content: "سيكون هناك توقف مؤقت لبعض خدمات البيانات الحية لمدة ساعة واحدة يوم الأحد القادم لأغراض الترقية الأمنية لضمان استقرار البث."
    }
  ];

  return (
    <div className="space-y-12 py-8">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6">
        <div className="space-y-4 text-right">
          <div className="inline-flex p-3 bg-red-500/10 rounded-2xl text-red-500 mb-2">
            <Megaphone size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic">مركز <span className="text-primary tracking-tighter">الإعلانات</span></h1>
          <p className="text-gray-400 font-bold max-w-xl">ابق على اطلاع دائم بآخر التحديثات، أخبار الصيانة، والميزات الجديدة في منصة صافرة 90.</p>
        </div>
        
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-black text-white">12</div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">إعلان نشط</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-2xl font-black text-primary">Premium</div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">فئة الاشتراك</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((n, i) => (
          <AnnouncementCard key={i} {...n} />
        ))}
      </div>

      <div className="bg-[#0b1121] border border-white/5 rounded-[3rem] p-12 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-right">
            <h2 className="text-3xl font-black text-white">هل تريد استلام التحديثات فوراً؟</h2>
            <p className="text-gray-400 font-bold">قم بالاشتراك في النشرة الإخبارية عبر البريد الإلكتروني لتصلك آخر المستجدات التقنية في عالم صافرة 90.</p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
             <input 
              type="email" 
              placeholder="بريدك الإلكتروني" 
              className="flex-grow md:w-80 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
            />
            <button className="bg-primary text-black px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 transition-all">
              اشترك الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
