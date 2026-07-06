import React from 'react';
import { SeoIssue } from '../types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface CanonicalWidgetProps {
  issues: SeoIssue[];
}

export const CanonicalWidget: React.FC<CanonicalWidgetProps> = ({ issues }) => {
  const missingCanonicalCount = issues.filter(i => i.type === 'missing_canonical').length;

  return (
    <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-white">الروابط الكنسية (Canonical URLs)</h4>
        {missingCanonicalCount === 0 ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
          <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-gray-400 font-bold">الحالة الإجمالية للوسوم:</span>
        <span className={`text-xs font-black ${missingCanonicalCount === 0 ? 'text-emerald-400' : 'text-amber-500'}`}>
          {missingCanonicalCount === 0 ? 'مكتملة ومثالية ✅' : `مفقودة في ${missingCanonicalCount} مقال`}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
        الارتباط الكنسي يحمي الموقع من الفهرسة المستنسخة ويضمن توحيد روابط الأخبار أمام خوارزميات محركات البحث.
      </p>
    </div>
  );
};
