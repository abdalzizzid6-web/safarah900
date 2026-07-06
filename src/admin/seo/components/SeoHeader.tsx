import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SeoHeaderProps {
  onBack: () => void;
}

export const SeoHeader: React.FC<SeoHeaderProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
          <span className="hover:text-amber-500 cursor-pointer transition-colors" onClick={onBack}>
            لوحة التحكم
          </span>
          <span>/</span>
          <span className="text-white">مركز تشخيصات الـ SEO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-400 to-emerald-400 tracking-tight animate-fadeIn">
          مشخص ومحسن محركات البحث (SEO & News Center)
        </h1>
        <p className="text-xs text-gray-400 font-bold">
          مراقبة معايير الأرشفة، فحص خرائط الموقع Sitemaps، وتدقيق وسوم OpenGraph وTwitter Schema حياً.
        </p>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 transition-all cursor-pointer"
      >
        <ArrowRight size={14} />
        <span>العودة للمركز الرئيسي</span>
      </button>
    </div>
  );
};
