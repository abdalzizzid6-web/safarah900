import React from 'react';
import { useNews } from '../hooks/useNews';
import { useFeaturedNews } from '../hooks/useFeaturedNews';
import { Star, Eye, Calendar } from 'lucide-react';

export function FeaturedSelector() {
  const { articles, loading } = useNews();
  const { featuredIds, toggleFeatured } = useFeaturedNews();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 md:p-8 space-y-6 text-right">
      <div>
        <h3 className="text-xl font-black text-white">إدارة الأخبار المميزة (Featured Stories)</h3>
        <p className="text-xs text-gray-500 mt-1">
          حدد المقالات الأكثر أهمية ليتم تثبيتها تلقائياً في واجهة الموقع وصدارة السلايدر الرئيسي للتطبيق
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art) => {
          const isFeatured = featuredIds.includes(art.id);

          return (
            <div 
              key={art.id} 
              className={`border rounded-2xl p-4 flex justify-between items-center transition-all flex-row-reverse ${
                isFeatured 
                  ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.05)]' 
                  : 'bg-[#18181C] border-white/[0.05] hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 flex-row-reverse">
                {art.featuredImage?.url && (
                  <img 
                    src={art.featuredImage.url} 
                    alt="" 
                    className="w-12 h-12 object-cover rounded-xl"
                    onError={(e) => { e.currentTarget.src = 'https://korea90.xyz/images/default-news.png'; }}
                  />
                )}
                <div>
                  <h4 className="font-bold text-white text-sm text-right line-clamp-1">{art.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1 flex-row-reverse">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(art.createdAt).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {art.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Star toggle */}
              <button
                onClick={() => toggleFeatured(art.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isFeatured 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                    : 'bg-white/5 border-white/[0.05] text-gray-500 hover:text-white'
                }`}
                title={isFeatured ? 'إزالة من الأخبار المميزة' : 'تحديد كخبر مميز'}
              >
                <Star className={`w-4 h-4 ${isFeatured ? 'fill-current' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
