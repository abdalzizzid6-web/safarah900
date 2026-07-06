import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, Share2, Tag, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import ReactMarkdown from 'react-markdown';
import ImageResolver from '../components/ui/ImageResolver';
import { NewsArticle } from '../hooks/useNews';
import { useArticle } from '../hooks/useArticle';

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading: loading, error: fetchError } = useArticle(slug || '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    if (!article) return;
    const shareUrl = window.location.href;
    const shareTitle = article.title;

    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const errorToDisplay = (fetchError as any)?.message || error;
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorToDisplay || !article) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-4">{errorToDisplay || 'المقال غير موجود'}</h2>
        <button 
          onClick={() => navigate('/news')}
          className="bg-primary text-black px-8 py-3 rounded-2xl font-black text-sm"
        >
          العودة للأخبار
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] py-10 px-4" dir="rtl">
      <SEO 
        title={`${article.title} | صافرة 90`} 
        description={article.excerpt}
        ogImage={article.featuredImage?.url}
      />

      <article className="max-w-3xl mx-auto space-y-10">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link 
            to="/news" 
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
          >
            <ArrowRight size={16} />
            <span>العودة لجميع الأخبار</span>
          </Link>
          <button 
            onClick={() => handleShare('copy')}
            className={`p-3 rounded-full transition-all duration-300 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-primary'}`}
            title="نسخ الرابط"
          >
            {copied ? (
              <svg className="w-[18px] h-[18px] stroke-current fill-none animate-bounce" viewBox="0 0 24 24" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <Share2 size={18} />
            )}
          </button>
        </div>

        {/* Hero Section */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-black">
              {article.categories?.[0] || 'أخبار عامة'}
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(article.publishDate).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
            </div>
            <div className="flex items-center gap-1.5">
              <User size={14} />
              بواسطة {typeof article.author === 'string' ? article.author : article.author?.name}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              {Math.ceil((typeof article.content === 'string' ? article.content : article.content.fullText).split(' ').length / 200)} دقيقة قراءة
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {article.title}
          </h1>

          <p className="text-xl text-gray-400 font-bold leading-relaxed border-r-4 border-primary/30 pr-6 py-2">
            {article.content.summary}
          </p>
        </header>

        {/* Featured Image */}
        {article.mainImage && (
          <div className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-white/5">
            <ImageResolver 
              src={article.mainImage} 
              alt={article.title}
              fallbackType="default"
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}

        {/* Content Section */}
        <div className="bg-[#0e1622]/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
          <div className="prose prose-invert prose-primary max-w-none prose-p:leading-loose prose-p:font-medium prose-p:text-gray-300 prose-headings:font-black prose-headings:text-white prose-a:text-primary prose-img:rounded-3xl prose-strong:text-white">
            <ReactMarkdown>{typeof article.content === 'string' ? article.content : article.content.fullText}</ReactMarkdown>
          </div>
        </div>

        {/* Social Share Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
          <span className="text-sm font-black text-gray-300 flex items-center gap-2">
            <Share2 size={16} className="text-primary" />
            <span>مشاركة هذا الخبر:</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* WhatsApp */}
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 rounded-2xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.117.954 11.487.955c-5.434 0-9.858 4.37-9.862 9.8.002 2.01.534 3.975 1.54 5.723L2.13 21.8l5.517-1.446z" />
              </svg>
              <span>واتساب</span>
            </button>

            {/* X (formerly Twitter) */}
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>إكس (تويتر)</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/20 rounded-2xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>فيسبوك</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={() => handleShare('copy')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'}`}
            >
              <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6">
            {article.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 px-4 py-2 rounded-2xl text-xs font-bold hover:border-primary/20 hover:text-white cursor-pointer transition-all">
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Related Section CTA */}
        <div className="bg-gradient-to-l from-primary/10 to-transparent border border-primary/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="text-xl font-black text-white">هل أعجبك هذا التحليل؟</h3>
            <p className="text-gray-400 text-sm font-bold">اشترك في تنبيهات الأخبار لتصلك أهم التقارير فور نشرها.</p>
          </div>
          <button className="bg-primary text-black px-8 py-4 rounded-2xl font-black text-sm whitespace-nowrap hover:scale-105 transition-transform">
            تفعيل التنبيهات
          </button>
        </div>
      </article>
    </div>
  );
}
