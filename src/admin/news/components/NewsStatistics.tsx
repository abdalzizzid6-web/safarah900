import React from 'react';
import { useNewsStatistics } from '../hooks/useNewsStatistics';
import { BarChart3, TrendingUp, Eye, Clock, ThumbsUp, Percent, FileText, CheckCircle2 } from 'lucide-react';

export function NewsStatistics() {
  const { stats, loading, error } = useNewsStatistics();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 text-center text-rose-400 text-xs">
        ⚠️ فشل في استخراج إحصائيات الأخبار الفعلية
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Articles */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 flex justify-between items-center flex-row-reverse">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-bold">إجمالي المقالات</span>
            <span className="text-2xl font-black text-white">{stats.totalArticles}</span>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 flex justify-between items-center flex-row-reverse">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-bold">إجمالي المشاهدات</span>
            <span className="text-2xl font-black text-white">{stats.totalViews}</span>
          </div>
        </div>

        {/* Average CTR */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 flex justify-between items-center flex-row-reverse">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-bold">معدل النقر إلى الظهور CTR</span>
            <span className="text-2xl font-black text-white">{stats.avgCtr}%</span>
          </div>
        </div>

        {/* Average reading time */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 flex justify-between items-center flex-row-reverse">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-bold">متوسط وقت القراءة</span>
            <span className="text-2xl font-black text-white">{stats.avgReadingTime} دقيقة</span>
          </div>
        </div>
      </div>

      {/* Top tables list grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top articles */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center flex-row-reverse border-b border-white/[0.05] pb-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" /> المقالات الأكثر رواجاً
            </h4>
            <span className="text-[10px] text-gray-500 font-bold">حسب المشاهدات والنسبة</span>
          </div>

          <div className="space-y-3">
            {stats.topArticles.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">لا توجد بيانات قراءة متوفرة</p>
            ) : (
              stats.topArticles.map((art, idx) => (
                <div key={art.articleId} className="flex justify-between items-center flex-row-reverse text-xs bg-[#18181C] p-3 rounded-xl border border-white/[0.03]">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span className="w-5 h-5 bg-white/5 rounded flex items-center justify-center font-bold text-[10px] text-gray-400">{idx + 1}</span>
                    <span className="font-bold text-white line-clamp-1 max-w-[160px] text-right">{art.title}</span>
                  </div>
                  <div className="flex gap-4 font-mono text-gray-400 text-[10px]">
                    <span>👁️ {art.views}</span>
                    <span className="text-primary font-bold">{art.ctr}% CTR</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top categories */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center flex-row-reverse border-b border-white/[0.05] pb-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-400" /> التصنيفات الأعلى أداءً
            </h4>
            <span className="text-[10px] text-gray-500 font-bold">مشاهدات التصنيف</span>
          </div>

          <div className="space-y-3">
            {stats.topCategories.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">لا توجد تصنيفات نشطة حالياً</p>
            ) : (
              stats.topCategories.map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex justify-between items-center flex-row-reverse text-xs font-bold">
                    <span className="text-white">{cat.categoryName}</span>
                    <span className="text-gray-500 font-mono">{cat.views} مشاهدة ({cat.articlesCount} مقال)</span>
                  </div>
                  {/* Dynamic horizontal percentage bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (cat.views / Math.max(1, stats.totalViews)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top tags */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center flex-row-reverse border-b border-white/[0.05] pb-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> الكلمات والوسوم الشائعة
            </h4>
            <span className="text-[10px] text-gray-500 font-bold">تفضيلات القراء</span>
          </div>

          <div className="space-y-3">
            {stats.topTags.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">لا توجد وسوم مستخدمة</p>
            ) : (
              stats.topTags.map((tag) => (
                <div key={tag.tagId} className="space-y-1.5">
                  <div className="flex justify-between items-center flex-row-reverse text-xs font-bold">
                    <span className="text-white">#{tag.tagName}</span>
                    <span className="text-gray-500 font-mono">{tag.views} مشاهدة</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (tag.views / Math.max(1, stats.totalViews)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
