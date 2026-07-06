import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useNews } from '../../hooks/useNews';
import { Link } from 'react-router-dom';
import { Clock, Eye, BookOpen, Newspaper, TrendingUp, Flame, Sparkles, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PremiumBadge } from './shared';
import ImageResolver from '../../components/ui/ImageResolver';

interface Props {
  title?: string;
  category?: string;
  block?: any;
}

export default function PremiumNewsSection({ title, category, block }: Props) {
  // Determine block type and default configurations
  const blockType = block?.type || 'LATEST_NEWS';
  const displayTitle = title || block?.title || 'أهم الأخبار الرياضية';
  const maxItems = (block?.dataConfig as any)?.maxItems || 4;

  // Query news articles. Query a few more to filter them reliably
  const { articles: news, loading } = useNews({
    category,
    limitSize: 12
  });

  // Calculate estimated reading time
  const getReadingTime = (text?: string) => {
    if (!text) return 'دقيقة واحدة قراءة';
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} دقائق قراءة`;
  };

  // Safely format publication date
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'منذ قليل';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ar });
    } catch (e) {
      return 'منذ قليل';
    }
  };

  // Filter and sort articles based on block type
  const displayNews = useMemo(() => {
    if (!news || news.length === 0) return [];

    let filtered = [...news];

    // Filter by type specifically
    if (blockType === 'BREAKING_NEWS') {
      filtered = news.filter(n => n.isBreaking === true);
    } else if (blockType === 'FEATURED_NEWS') {
      filtered = news.filter(n => n.isFeatured === true);
    } else if (blockType === 'TRENDING_NEWS') {
      filtered = news.filter(n => n.isTrending === true || n.isPopular === true);
    }

    // Fallback to general list if specific filters returned empty results (ensuring page is never empty)
    if (filtered.length === 0) {
      filtered = [...news];
    }

    // Return capped to max items requested
    return filtered.slice(0, maxItems);
  }, [news, blockType, maxItems]);

  // Render Premium Skeleton Loaders
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Title row skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 w-36 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-16 bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* Bento grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Hero Story skeleton */}
          <div className="lg:col-span-7 h-[360px] bg-white/5 rounded-[2rem] p-6 flex flex-col justify-end gap-3 animate-pulse">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-8 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-1/2 bg-white/5 rounded" />
          </div>

          {/* Side stories list skeleton */}
          <div className="lg:col-span-5 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl animate-pulse">
                <div className="w-20 h-20 bg-white/10 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-1/4 bg-white/10 rounded" />
                  <div className="h-4 w-5/6 bg-white/10 rounded" />
                  <div className="h-3 w-1/3 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!displayNews || displayNews.length === 0) {
    return null;
  }

  const featured = displayNews[0];
  const sideArticles = displayNews.slice(1);

  // Get matching block type icon and color theme
  type BadgeVariantType = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

  const blockHeaderConfig: {
    icon: React.ReactNode;
    badgeText: string;
    badgeVariant: BadgeVariantType;
  } = {
    icon: <Newspaper className="text-primary" size={20} />,
    badgeText: 'تغطية حصرية',
    badgeVariant: 'primary',
  };

  if (blockType === 'BREAKING_NEWS' || featured.isBreaking) {
    blockHeaderConfig.icon = <Flame className="text-red-500 animate-pulse" size={20} />;
    blockHeaderConfig.badgeText = 'خبر عاجل ⚡';
    blockHeaderConfig.badgeVariant = 'danger';
  } else if (blockType === 'FEATURED_NEWS' || featured.isFeatured) {
    blockHeaderConfig.icon = <Sparkles className="text-amber-400" size={20} />;
    blockHeaderConfig.badgeText = 'انفراد خاص 🏆';
    blockHeaderConfig.badgeVariant = 'warning';
  } else if (blockType === 'TRENDING_NEWS' || featured.isTrending) {
    blockHeaderConfig.icon = <TrendingUp className="text-purple-400" size={20} />;
    blockHeaderConfig.badgeText = 'الأكثر قراءة 🔥';
    blockHeaderConfig.badgeVariant = 'info';
  }

  // Fallback cover image
  const defaultImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';

  return (
    <section className="space-y-6 text-right" dir="rtl">
      {/* Dynamic Header Block */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
            {blockHeaderConfig.icon}
          </span>
          <div>
            <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              {displayTitle}
            </h2>
          </div>
        </div>
        <Link 
          to="/news" 
          className="text-xs text-primary font-black hover:text-primary-hover transition-colors flex items-center gap-1 group/btn"
        >
          <span>عرض كافة الأخبار</span>
          <ArrowLeft size={12} className="group-hover/btn:-translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT COLUMN: Huge World-class Featured Hero Story (Spans 7/12) */}
        <div className="lg:col-span-7">
          <Link to={`/news/${featured.seo?.slug || featured.id}`}>
            <motion.div 
              whileHover={{ y: -4, scale: 1.005 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full h-[380px] md:h-[420px] rounded-[2rem] overflow-hidden group shadow-2xl border border-white/5 flex flex-col justify-end"
            >
              {/* Cover Image with continuous hover zooming */}
              <ImageResolver 
                src={featured.mainImage || featured.featuredImage?.url || defaultImage} 
                alt={featured.title} 
                fallbackType="default"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
              />
              
              {/* Dual-layered professional dark overlays for clear text reading */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity group-hover:opacity-95" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

              {/* Top corner category */}
              <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
                <PremiumBadge variant={blockHeaderConfig.badgeVariant} size="sm">
                  {blockHeaderConfig.badgeText}
                </PremiumBadge>
                {featured.category && (
                  <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full border border-white/15">
                    {featured.category}
                  </span>
                )}
              </div>

              {/* Bottom interactive metadata pane */}
              <div className="relative z-10 p-6 md:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/70 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    <span>{formatTimeAgo(featured.publishDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-sky-400" />
                    <span>{getReadingTime(featured.content?.fullText)}</span>
                  </div>
                  {featured.viewCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Eye size={13} className="text-emerald-400" />
                      <span>{featured.viewCount} مشاهدة</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg md:text-2xl font-black text-white group-hover:text-primary transition-colors leading-relaxed tracking-tight line-clamp-2">
                  {featured.title}
                </h3>

                {featured.content?.summary && (
                  <p className="text-xs md:text-sm text-gray-300 font-bold leading-relaxed line-clamp-2 opacity-90">
                    {featured.content.summary}
                  </p>
                )}

                {/* Styled Bottom Bar details */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-400 font-black">
                    بقلم: <span className="text-white">{typeof featured.author === 'string' ? featured.author : featured.author?.name || 'محرر صافرة 90'}</span>
                  </span>
                  <span className="text-primary text-[11px] font-black group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                    <span>قراءة التقرير بالكامل</span>
                    <ArrowLeft size={12} />
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* LEFT COLUMN: Highly Polished Secondary Stories List (Spans 5/12) */}
        <div className="lg:col-span-5 space-y-4">
          {sideArticles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#0e1622]/40 border border-white/5 rounded-2xl">
              <span className="text-2xl mb-2">⚽</span>
              <p className="text-xs font-bold text-gray-400">تابع تغطياتنا المتواصلة للمزيد من التحليلات الكروية المقررة اليوم!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sideArticles.map((article, index) => {
                const isSecondaryBreaking = article.isBreaking;
                const readingTime = getReadingTime(article.content?.fullText);

                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Link to={`/news/${article.seo?.slug || article.id}`} className="group block">
                      <div className="flex gap-4 p-3 bg-[#0e1622]/40 hover:bg-[#0e1622]/80 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 relative overflow-hidden">
                        
                        {/* Interactive thumbnail with zoom */}
                        <div className="w-20 md:w-24 h-20 md:h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
                          <ImageResolver 
                            src={article.mainImage || article.featuredImage?.url || defaultImage} 
                            alt={article.title}
                            fallbackType="default"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          {isSecondaryBreaking && (
                            <span className="absolute bottom-1 right-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">
                              عاجل
                            </span>
                          )}
                        </div>

                        {/* Story Information */}
                        <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                          <div className="space-y-1.5">
                            {/* Tags & dates */}
                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                              <span className="text-primary text-[10px] font-black truncate max-w-[100px]">
                                {article.category || 'أخبار عامة'}
                              </span>
                              <div className="flex items-center gap-1 text-[9px] text-white/50">
                                <Clock size={10} />
                                <span>{formatTimeAgo(article.publishDate)}</span>
                              </div>
                            </div>

                            {/* Secondary Title */}
                            <h4 className="text-xs md:text-sm font-black text-white group-hover:text-primary transition-colors leading-relaxed line-clamp-2">
                              {article.title}
                            </h4>
                          </div>

                          {/* Extra interactive metadata */}
                          <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold border-t border-white/5 pt-1.5 mt-1">
                            <span className="flex items-center gap-1">
                              <BookOpen size={9} />
                              <span>{readingTime}</span>
                            </span>
                            {article.viewCount > 0 && (
                              <span className="flex items-center gap-1 text-emerald-500/80">
                                <Eye size={9} />
                                <span>{article.viewCount} مشاهدة</span>
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
