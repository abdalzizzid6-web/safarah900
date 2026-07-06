import React from 'react';

interface PerformanceWidgetProps {
  totalArticles: number;
  issuesCount: number;
}

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({
  totalArticles,
  issuesCount
}) => {
  const score = totalArticles > 0 ? Math.max(10, Math.floor(100 - (issuesCount * 3.5))) : 100;

  return (
    <div className="flex flex-col items-center text-center space-y-3 bg-black/20 p-6 rounded-2xl border border-white/5">
      <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-emerald-500/10 border-4 border-emerald-500/30">
        <span className="text-4xl font-black text-emerald-400 font-mono">
          {score}%
        </span>
      </div>
      <div>
        <h4 className="text-sm font-black text-white mt-1">SEO Health Index (مؤشر جودة السيو)</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          تعتمد هذه النسبة على وجود الصورة والوصف والارتباط الكنسي وحجم الكلمات في المقالات الرياضية.
        </p>
      </div>
    </div>
  );
};
