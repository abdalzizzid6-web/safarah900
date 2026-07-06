import React from 'react';
import { NewsSeo } from '../types';
import { Globe, Clock, Search, ShieldCheck } from 'lucide-react';

interface Props {
  seo: NewsSeo;
  onChange: (seo: NewsSeo) => void;
}

export function SeoEditor({ seo, onChange }: Props) {
  const handleKeywordAdd = (word: string) => {
    if (!word.trim()) return;
    if (seo.keywords.includes(word.trim())) return;
    onChange({
      ...seo,
      keywords: [...seo.keywords, word.trim()]
    });
  };

  const handleKeywordRemove = (word: string) => {
    onChange({
      ...seo,
      keywords: seo.keywords.filter((k) => k !== word)
    });
  };

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-6 text-right">
      <div className="border-b border-white/[0.05] pb-4 flex justify-between items-center flex-row-reverse">
        <h3 className="font-black text-white text-lg flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" /> إعدادات تحسين محركات البحث (SEO)
        </h3>
        <span className="text-xs text-gray-500">مؤشرات الأداء والسيو التقني</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slug */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">رابط المقال الفرعي (URL Slug)</label>
          <input
            type="text"
            value={seo.slug || ''}
            onChange={(e) => onChange({ ...seo, slug: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary text-left font-mono"
            placeholder="slug-url-example"
          />
        </div>

        {/* Canonical URL */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">الرابط النموذجي (Canonical URL)</label>
          <input
            type="text"
            value={seo.canonicalUrl || ''}
            onChange={(e) => onChange({ ...seo, canonicalUrl: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary text-left font-mono"
            placeholder="https://korea90.xyz/news/slug"
          />
        </div>

        {/* Meta Title */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">عنوان السيو (Meta Title)</label>
          <input
            type="text"
            value={seo.metaTitle || ''}
            onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
            placeholder="أدخل عنواناً جذاباً لمحركات البحث"
          />
        </div>

        {/* Sitemap switch */}
        <div className="space-y-2 flex flex-col justify-end">
          <div className="flex items-center justify-between bg-[#18181C] border border-white/[0.05] p-3.5 rounded-xl">
            <span className="text-xs font-bold text-gray-300">أرشفة تلقائية في ملف الـ Sitemap.xml</span>
            <input
              type="checkbox"
              checked={seo.includeInSitemap}
              onChange={(e) => onChange({ ...seo, includeInSitemap: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-400">وصف السيو (Meta Description)</label>
        <textarea
          value={seo.metaDescription || ''}
          onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
          rows={3}
          className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-500"
          placeholder="أدخل ملخصاً للخبر يظهر في صفحة نتائج بحث Google (يفضل بين ١٢٠ إلى ١٦٠ حرف)"
        />
      </div>

      {/* Keywords tag builder */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-400">الكلمات المفتاحية (Meta Keywords)</label>
        <input
          type="text"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleKeywordAdd((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-500"
          placeholder="اكتب كلمة واضغط Enter للإضافة"
        />
        <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
          {seo.keywords?.map((k) => (
            <span key={k} className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
              {k}
              <button onClick={() => handleKeywordRemove(k)} className="text-gray-400 hover:text-white font-black text-[10px]">×</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
