import React from 'react';
import { NewsArticle, NewsArticleStatus } from '../types';
import { NewsStatusBadge } from './NewsStatusBadge';
import { Edit2, Eye, Trash2, Calendar, FileText, CheckCircle2, AlertTriangle, Archive, Send } from 'lucide-react';

interface Props {
  articles: NewsArticle[];
  onEdit: (article: NewsArticle) => void;
  onDelete: (id: string) => void;
  onPreview: (article: NewsArticle) => void;
  onTransitionStatus: (id: string, status: NewsArticleStatus) => void;
  loading: boolean;
}

export function NewsTable({ articles, onEdit, onDelete, onPreview, onTransitionStatus, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-12 text-center">
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-white font-bold mb-2">لا توجد مقالات إخبارية</h3>
        <p className="text-gray-400 text-sm">ابدأ بإنشاء أول مقال إخباري رياضي عبر زر الإضافة</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#18181C] border-b border-white/[0.05] text-xs text-gray-400 font-bold uppercase tracking-wider">
              <th className="px-6 py-4">المقال والعنوان</th>
              <th className="px-6 py-4">التصنيفات والوسوم</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4">الإحصائيات</th>
              <th className="px-6 py-4">تاريخ النشر</th>
              <th className="px-6 py-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03] text-sm text-gray-300">
            {articles.map((article) => {
              const formattedDate = article.publishDate 
                ? new Date(article.publishDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date(article.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

              return (
                <tr key={article.id} className="hover:bg-white/[0.02] transition-all">
                  {/* Article Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {article.featuredImage?.url ? (
                        <img 
                          src={article.featuredImage.url} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded-xl border border-white/[0.05]"
                          onError={(e) => { e.currentTarget.src = 'https://korea90.xyz/images/default-news.png'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-base hover:text-primary transition-all cursor-pointer" onClick={() => onEdit(article)}>
                          {article.title}
                        </h4>
                        <span className="text-xs text-gray-500">الكاتب: {article.author?.name || 'محرر سفارة ٩٠'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Categories & Tags */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {article.categories?.map((c) => (
                          <span key={c} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {article.tags?.slice(0, 3).map((t) => (
                          <span key={t} className="bg-white/5 text-gray-400 px-1.5 py-0.5 rounded text-[9px]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-6 py-4">
                    <NewsStatusBadge status={article.status} />
                  </td>

                  {/* Views / Clicks Stats */}
                  <td className="px-6 py-4 text-xs font-mono">
                    <div className="space-y-0.5 text-gray-400">
                      <div>المشاهدات: <span className="text-white font-bold">{article.views || 0}</span></div>
                      <div>النقرات: <span className="text-white font-bold">{article.clicks || 0}</span></div>
                    </div>
                  </td>

                  {/* Date Published */}
                  <td className="px-6 py-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {formattedDate}
                    </div>
                  </td>

                  {/* Actions buttons */}
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {/* State transitions quick shortcuts */}
                      {article.status !== NewsArticleStatus.PUBLISHED && (
                        <button
                          onClick={() => onTransitionStatus(article.id, NewsArticleStatus.PUBLISHED)}
                          title="نشر الآن"
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {article.status === NewsArticleStatus.PUBLISHED && (
                        <button
                          onClick={() => onTransitionStatus(article.id, NewsArticleStatus.ARCHIVED)}
                          title="أرشفة"
                          className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl transition-all"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onPreview(article)}
                        title="معاينة"
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(article)}
                        title="تعديل"
                        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(article.id)}
                        title="حذف"
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
