import React from 'react';
import { NewsArticle } from '../types';
import { NewsStatusBadge } from './NewsStatusBadge';
import { Eye, Edit2, Calendar, FileText } from 'lucide-react';

interface Props {
  article: NewsArticle;
  onEdit: (article: NewsArticle) => void;
  onPreview: (article: NewsArticle) => void;
}

export function NewsCard({ article, onEdit, onPreview }: Props) {
  const formattedDate = article.publishDate 
    ? new Date(article.publishDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(article.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between h-full group">
      <div>
        {/* Featured Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-white/5">
          {article.featuredImage?.url ? (
            <img 
              src={article.featuredImage.url} 
              alt={article.featuredImage.altText || article.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              onError={(e) => { e.currentTarget.src = 'https://korea90.xyz/images/default-news.png'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <FileText className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <NewsStatusBadge status={article.status} />
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex flex-wrap gap-1 mb-3">
            {article.categories?.map((c) => (
              <span key={c} className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-bold">
                {c}
              </span>
            ))}
          </div>

          <h3 className="font-extrabold text-white text-lg leading-snug mb-2 hover:text-primary cursor-pointer line-clamp-2" onClick={() => onEdit(article)}>
            {article.title}
          </h3>

          <p className="text-gray-400 text-xs line-clamp-3 mb-4">
            {article.excerpt || article.content?.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 140) + '...'}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 border-t border-white/[0.03] bg-[#18181C] flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formattedDate}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(article)}
            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
            title="معاينة"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(article)}
            className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
            title="تعديل"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
