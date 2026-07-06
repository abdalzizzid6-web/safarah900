import React from 'react';
import { SeoIssue } from '../types';

interface IndexingStatusWidgetProps {
  issues: SeoIssue[];
}

export const IndexingStatusWidget: React.FC<IndexingStatusWidgetProps> = ({ issues }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-black text-gray-300">أكثر الإشكاليات رصداً بقاعدة البيانات:</h4>
      
      <div className="space-y-3 font-semibold text-xs text-gray-400">
        <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all">
          <span>غياب الصور الرئيسية (Featured Images)</span>
          <span className="text-slate-200 font-mono font-black">
            {issues.filter(i => i.type === 'missing_image').length} مقال
          </span>
        </div>

        <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all">
          <span>وصف SEO مفقود أو غير فعال (Meta Description)</span>
          <span className="text-slate-200 font-mono font-black">
            {issues.filter(i => i.type === 'missing_desc').length} مقال
          </span>
        </div>

        <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all">
          <span>رابط كنسي غير معرف (Canonical missing)</span>
          <span className="text-slate-200 font-mono font-black">
            {issues.filter(i => i.type === 'missing_canonical').length} مقال
          </span>
        </div>

        <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all">
          <span>محتوى ضئيل وغير كاف (Thin Content)</span>
          <span className="text-slate-200 font-mono font-black">
            {issues.filter(i => i.type === 'thin_content').length} مقال
          </span>
        </div>
      </div>
    </div>
  );
};
