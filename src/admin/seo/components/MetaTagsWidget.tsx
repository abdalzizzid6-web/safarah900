import React from 'react';
import { SeoIssue } from '../types';
import { Layers, CheckCircle2 } from 'lucide-react';

interface MetaTagsWidgetProps {
  issues: SeoIssue[];
}

export const MetaTagsWidget: React.FC<MetaTagsWidgetProps> = ({ issues }) => {
  const missingTitle = issues.filter(i => i.type === 'missing_title').length;
  const missingDesc = issues.filter(i => i.type === 'missing_desc').length;
  const missingImage = issues.filter(i => i.type === 'missing_image').length;

  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4">
      <h3 className="text-sm font-black text-white flex items-center gap-2">
        <Layers size={16} className="text-amber-500" />
        <span>وسوم الميتا الأساسية (Meta Tags Audit)</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <span className="text-gray-400 block text-[10px]">عناوين الـ SEO المفقودة</span>
          <div className="flex justify-between items-baseline">
            <span className={missingTitle > 0 ? 'text-amber-500 font-bold' : 'text-emerald-400'}>
              {missingTitle} مقالات
            </span>
            {missingTitle === 0 && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <span className="text-gray-400 block text-[10px]">الوصف المفقود (Meta Description)</span>
          <div className="flex justify-between items-baseline">
            <span className={missingDesc > 0 ? 'text-amber-500 font-bold' : 'text-emerald-400'}>
              {missingDesc} مقالات
            </span>
            {missingDesc === 0 && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <span className="text-gray-400 block text-[10px]">الصور البارزة المفقودة</span>
          <div className="flex justify-between items-baseline">
            <span className={missingImage > 0 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>
              {missingImage} مقالات
            </span>
            {missingImage === 0 && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
        </div>
      </div>
    </div>
  );
};
