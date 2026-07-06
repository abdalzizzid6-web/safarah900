import React from 'react';
import { motion } from 'motion/react';
import { useNews } from '../hooks/useNews';
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumBadge,
} from '../premium/components/shared';
import { Newspaper, Calendar, User, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ImageResolver from '../components/ui/ImageResolver';

export default function NewsPage() {
  const { articles, loading, error, hasMore, loadMore } = useNews({ limitSize: 12 });

  return (
    <div className="min-h-screen bg-[var(--color-background)] py-10 px-4" dir="rtl">
      <SEO 
        title="أخبار كرة القدم العالمية والمحلية | صافرة 90" 
        description="تغطية شاملة لآخر أخبار كرة القدم، سوق الانتقالات، تصريحات اللاعبين، وتقارير حصرية من قلب الملاعب على صافرة 90."
      />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="space-y-4 text-right">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2">
            <Newspaper size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white italic">مركز <span className="text-primary tracking-tighter">الأخبار</span></h1>
          <p className="text-gray-400 font-bold max-w-xl">متابعة دقيقة وشاملة لكل ما يدور في عالم الساحرة المستديرة، من الدوريات الكبرى إلى البطولات القارية.</p>
        </header>

        {loading && articles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem]">
            <p className="text-rose-400 font-bold">حدث خطأ أثناء تحميل الأخبار. يرجى المحاولة لاحقاً.</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/5 rounded-[2.5rem]">
            <p className="text-gray-500 font-bold italic">لا توجد أخبار منشورة حالياً.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 6) * 0.1 }}
                >
                  <Link 
                    to={`/news/${article.seo?.slug || article.id}`}
                    className="group block h-full"
                  >
                    <PremiumCard className="overflow-hidden p-0 h-full hover:border-primary/20 transition-all flex flex-col">
                      {article.mainImage && (
                        <div className="aspect-video w-full overflow-hidden border-b border-white/5 bg-white/5">
                          <ImageResolver 
                            src={article.mainImage} 
                            alt={article.title}
                            fallbackType="default"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-1 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                            <Calendar size={12} />
                            {new Date(article.publishDate).toLocaleDateString('ar-EG')}
                          </div>
                          {article.categories?.[0] && (
                            <PremiumBadge variant="primary" size="sm">
                              {article.categories[0]}
                            </PremiumBadge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors leading-relaxed line-clamp-2">
                          {article.title}
                        </h3>
                        
                        <p className="text-gray-400 font-bold text-sm line-clamp-2 leading-loose flex-1">
                          {article.content.summary}
                        </p>

                        <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                            <User size={12} />
                            {typeof article.author === 'string' ? article.author : article.author?.name}
                          </div>
                          <span className="text-primary flex items-center gap-1 text-xs font-black group-hover:translate-x-[-4px] transition-transform">
                            اقرأ المقال
                            <ArrowLeft size={14} />
                          </span>
                        </div>
                      </div>
                    </PremiumCard>
                  </Link>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <PremiumButton 
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  className="px-10"
                >
                  {loading ? 'جاري التحميل...' : 'تحميل المزيد من الأخبار'}
                </PremiumButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
