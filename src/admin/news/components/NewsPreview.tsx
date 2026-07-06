import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { X, Calendar, User, Clock, Eye, Smartphone, Monitor, Globe } from 'lucide-react';

interface Props {
  article: NewsArticle;
  onClose: () => void;
}

export function NewsPreview({ article, onClose }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const formattedDate = article.publishDate 
    ? new Date(article.publishDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : new Date(article.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end items-center p-4 md:p-8 backdrop-blur-md">
      {/* Container */}
      <div className="w-full max-w-5xl bg-[#0F0F11] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header Toolbar */}
        <div className="bg-[#141417] border-b border-white/[0.05] p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-white text-lg">معاينة المقال الإخباري</h3>
          </div>

          {/* Device toggle */}
          <div className="flex items-center gap-2 bg-[#1C1C21] p-1.5 rounded-2xl border border-white/[0.05]">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-xl transition-all ${device === 'desktop' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-xl transition-all ${device === 'mobile' ? 'bg-primary text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#09090B]">
          <div className={`transition-all duration-300 w-full ${device === 'mobile' ? 'max-w-[420px] bg-[#0F0F11] border border-white/5 rounded-[40px] px-5 py-8 h-fit shadow-2xl overflow-y-auto' : 'max-w-3xl'}`}>
            {/* Header section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {article.categories?.map((c) => (
                  <span key={c} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    {c}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight text-right">
                {article.title}
              </h1>

              {/* Author & date metadata info row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 border-y border-white/[0.03] py-3 font-medium">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  بواسطة: {article.author?.name || 'محرر سفارة ٩٠'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  وقت القراءة: {article.seo?.readingTime || 1} دقيقة
                </span>
              </div>
            </div>

            {/* Featured Image banner */}
            {article.featuredImage?.url && (
              <div className="rounded-3xl overflow-hidden border border-white/[0.05] mb-6 relative">
                <img 
                  src={article.featuredImage.url} 
                  alt={article.featuredImage.altText || ''} 
                  className="w-full h-auto object-cover max-h-[400px]"
                  onError={(e) => { e.currentTarget.src = 'https://korea90.xyz/images/default-news.png'; }}
                />
                {article.featuredImage.caption && (
                  <div className="bg-[#141417] p-3 text-xs text-gray-400 border-t border-white/[0.05] text-right">
                    {article.featuredImage.caption} {article.featuredImage.credit && <span className="text-gray-600">({article.featuredImage.credit})</span>}
                  </div>
                )}
              </div>
            )}

            {/* Main Rich text body */}
            <div className="text-gray-200 leading-relaxed text-right space-y-4 text-base font-medium whitespace-pre-wrap">
              {article.content}
            </div>

            {/* Associated Tags block */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/[0.03] flex flex-wrap gap-2 justify-start">
                {article.tags.map((t) => (
                  <span key={t} className="bg-white/5 hover:bg-white/10 text-gray-400 px-3 py-1 rounded-full text-xs cursor-pointer">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* SEO NewsArticle structured meta data box */}
            <div className="mt-8 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl text-right">
              <h4 className="text-white font-extrabold text-sm mb-2 flex items-center gap-2 justify-end">
                <Globe className="w-4 h-4 text-emerald-400" /> البيانات المنظمة لمؤشرات SEO (NewsArticle)
              </h4>
              <p className="text-gray-400 text-xs leading-relaxed mb-3">
                يقوم محرك البحث بالتقاط هذه البيانات المنظمة JSON-LD تلقائياً لإبراز الخبر في لوحة "أبرز القصص الإخبارية" (Google Top Stories) في بحث Google.
              </p>
              <pre className="text-[10px] text-gray-500 font-mono bg-[#09090B] p-3 rounded-lg overflow-x-auto text-left">
                {JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'NewsArticle',
                  'headline': article.title,
                  'image': article.featuredImage?.url,
                  'author': article.author?.name
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
