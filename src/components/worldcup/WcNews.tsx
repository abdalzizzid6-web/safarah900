import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Calendar, ArrowRight, Share2, Award, Bookmark, ArrowUpLeft } from 'lucide-react';
import ImageResolver from '../ui/ImageResolver';
import ShareButton from '../ShareButton';
import * as worldCupRepository from '../../features/world-cup/repositories/worldCupRepository';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  createdAt: any;
  author: string;
}

const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 'f1',
    title: 'ملاعب مونديال 2026 تستعد لاستقبال الجماهير بتحديثات غير مسبوقة',
    summary: 'تستعد الملاعب التاريخية الـ 16 في الولايات المتحدة وكندا والمكسيك لتأمين تجارب رقمية وبصرية متكاملة للجماهير بإدخال تقنيات الاتصال فائقة السرعة.',
    content: 'أعلنت اللجنة المنظمة لبطولة كأس العالم 2026 عن اكتمال التجهيزات الرئيسية في الملاعب الـ 16 المضيفة للحدث التاريخي. تم إدخال خدمات الجيل الجديد من البث الرقمي والشبكات ومقاعد كبار الشخصيات المذهبة، مما يجعل تجربة wcup2026.org فريدة تماماً. وذكر التقرير أن ملعب أزتيكا وملعب متلايف جاهزان بالكامل للحفل واللقاءات الكبرى.',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    createdAt: { seconds: Date.now() / 1000 - 86400 },
    author: 'هيئة التحرير wcup2026.org'
  },
  {
    id: 'f2',
    title: 'الكشف عن التفاصيل الفنية للبطولة وشرح نظام الـ 48 منتخباً الجديد',
    summary: 'توضيح توجيهات قرعة الـ 12 مجموعة المبتكرة وفرص بلوغ الأدوار الإقصائية لأفضل ثوالث للتأهل إلى دور الـ 32 الجديد.',
    content: 'لأول مرة في تاريخ اللعبة، سيشارك 48 منتخباً موزعين على 12 مجموعة تضم كل منها 4 منتخبات. سيتأهل بطل ووصيف كل مجموعة مع أفضل 8 منتخبات تحتل المركز الثالث إلى دور الـ 32 الجديد بالكامل. هذا التوسع يضمن إثارة بالغة ويلهم عشاق المستديرة برحلة طويلة ومبهرة تحت أضواء ذهبية.',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=800',
    createdAt: { seconds: Date.now() / 1000 - 172800 },
    author: 'اللجنة التقنية'
  },
  {
    id: 'f3',
    title: 'أبرز النجوم الصاعدين المتوقع منافستهم على جائزة الحذاء الذهبي بالمونديال',
    summary: 'قراءات تحليلية لفرص هدافين جدد يخلدون أسماءهم بمداد الذهب في البطولة الاستثنائية بـ 104 مباراة مشوقة.',
    content: 'يتطلع النقاد الرياضيون في wcup2026.org لمتابعة النجوم الصاعدين والأساطير لتسجيل أرقام خيالية في مونديال الـ 104 مباريات. تشير التوقعات إلى أن المنافسة على جائزة الحذاء الذهبي المذهب لأفضل هداف ستكون الأقوى تاريخياً لوفرة المواهب الشابة والجاهزية العالية.',
    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800',
    createdAt: { seconds: Date.now() / 1000 - 259200 },
    author: 'أخصائي الإحصائيات'
  }
];

export default function WcNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch news from Firestore once
    const loadNews = async () => {
      try {
        const list = await worldCupRepository.getNews();
        
        if (list.length > 0) {
          setArticles(list as NewsArticle[]);
        } else {
          setArticles(FALLBACK_NEWS);
        }
      } catch (error) {
        console.warn("Firestore news fetch declined or empty:", error);
        setArticles(FALLBACK_NEWS);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const formatDate = (timestampObj: any) => {
    if (!timestampObj) return 'الآن';
    const seconds = timestampObj.seconds || (timestampObj.toDate ? timestampObj.toDate().getTime() / 1000 : null);
    if (!seconds) return 'منذ أيام';
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title block */}
      <div className="flex items-center gap-3 border-b border-[#d4af37]/15 pb-4">
        <div className="p-2 bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 rounded-xl">
          <Newspaper className="w-5 h-5 text-[#f3c623]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">صحافة وأخبار كأس العالم 2026</h2>
          <p className="text-xs text-gray-400">تغطية صحفية لآخر التطورات الرياضية، الملاعب، وتحليلات بلسان ذهبي</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(id => (
            <div key={id} className="h-96 bg-black/40 border border-white/5 rounded-3xl animate-pulse space-y-4 p-4">
              <div className="h-44 bg-white/5 rounded-2xl w-full" />
              <div className="h-6 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-10 bg-white/5 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            {articles.map((article) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                key={article.id}
                className="group relative bg-[#0d0d0d] hover:bg-[#121212] transition-all border border-[#d4af37]/10 hover:border-[#d4af37]/30 rounded-3xl overflow-hidden p-5 flex flex-col md:flex-row gap-6 shadow-xl"
              >
                {/* Image */}
                <div className="md:w-1/3 shrink-0 rounded-2xl overflow-hidden relative h-48 md:h-auto bg-black border border-white/5">
                  <ImageResolver
                    src={article.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=500'}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-3 right-3 text-[10px] bg-[#d4af37] text-black font-black px-2 py-0.5 rounded-lg border border-amber-300">
                    {article.author}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Calendar size={12} className="text-[#d4af37]" />
                      <span>{formatDate(article.createdAt)}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-white group-hover:text-[#f3c623] transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-gray-400 font-bold leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="text-xs font-black text-[#f3c623] hover:text-[#d4af37] flex items-center gap-1.5 transition-all"
                    >
                      <span>اقرأ التفاصيل الكاملة</span>
                      <ArrowRight size={14} className="rotate-180" />
                    </button>

                    <ShareButton 
                      variant="icon"
                      title={article.title}
                      text={article.summary}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Side Widget: Interactive branding or stats block */}
          <div className="space-y-6">
            <div className="p-5 rounded-3xl border border-[#d4af37]/20 bg-[#0d0d0d] bg-gradient-to-b from-[#18150f] to-transparent space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#f3c623] animate-pulse" />
                <h4 className="text-sm font-black text-white">تحت المجهر wcup2026.org</h4>
              </div>
              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                المنصة الإخبارية غير الرسمية لتتبع جميع مستجدات ومباريات مونديال 2026. من الأخبار التقنية إلى قنوات البث وملاعب البطولة!
              </p>
              <div className="border-t border-[#d4af37]/10 pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-gray-300">
                  <span>الأخبار الموثقة</span>
                  <span className="font-mono text-[#f3c623] font-bold">{articles.length} أخبار</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-300">
                  <span>اللغة الرسمية</span>
                  <span className="text-[#f3c623] font-bold">العربية (RTL)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-300">
                  <span>حالة البث</span>
                  <span className="text-emerald-400 font-bold">مباشر ومستمر ⬤</span>
                </div>
              </div>
            </div>

            {/* Static Ad-placement Mock */}
            <div className="border border-white/5 rounded-3xl p-5 text-center bg-black/40 space-y-3">
              <span className="text-[9px] text-[#d4af37]/40 block uppercase tracking-widest font-bold">مساحة إعلانية مذهبة</span>
              <div className="py-12 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border border-[#d4af37]/10 rounded-2xl flex flex-col justify-center items-center">
                <Bookmark className="w-6 h-6 text-[#d4af37]/30 mb-2" />
                <span className="text-xs text-gray-500 font-bold">رعاة wcup2026.org الرسميِّين</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#0d0d0d] border border-[#d4af37]/30 rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-[#d4af37]/10 flex items-center justify-between bg-black/60 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-[#f3c623]" />
                  <span className="text-xs font-black text-gray-400">قراءة الخبر بالكامل</span>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all"
                >
                  <ArrowUpLeft size={16} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1">
                {/* Hero image in modal */}
                <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-white/5 relative bg-black">
                  <ImageResolver
                    src={selectedArticle.image}
                    className="w-full h-full object-cover"
                    alt={selectedArticle.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center text-xs text-gray-400">
                    <span className="bg-[#d4af37]/10 text-[#f3c623] px-2.5 py-1 rounded-lg border border-[#d4af37]/25 font-bold">
                      {selectedArticle.author}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-[#d4af37]" />
                      <span>{formatDate(selectedArticle.createdAt)}</span>
                    </div>
                  </div>

                  <h1 className="text-xl md:text-2xl font-black text-white leading-snug">
                    {selectedArticle.title}
                  </h1>

                  <div className="text-sm text-gray-300 font-bold leading-relaxed space-y-4 border-t border-[#d4af37]/10 pt-4 whitespace-pre-line">
                    {selectedArticle.content || selectedArticle.summary}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-6 py-2 bg-[#d4af37] text-black text-xs font-black rounded-xl hover:bg-[#f3c623] transition-all"
                >
                  إغلاق نافذة الخبر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
