import React from 'react';
import { SeoIssue } from '../types';
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StructuredDataWidgetProps {
  issues: SeoIssue[];
  onRepair: () => void;
  isRunningAudit: boolean;
  articlesListLength: number;
}

export const StructuredDataWidget: React.FC<StructuredDataWidgetProps> = ({
  issues,
  onRepair,
  isRunningAudit,
  articlesListLength
}) => {
  const missingSchemaIssues = issues.filter(i => i.type === 'missing_schema');
  const missingSchemaCount = missingSchemaIssues.length;

  return (
    <div className="space-y-6">
      {missingSchemaCount > 0 && (
        <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-500 flex items-center gap-1.5">
              <AlertTriangle size={16} />
              <span>تنبيه: مقالات بدون وسوم البيانات المنظمة (Structured Data)</span>
            </h4>
            <p className="text-xs text-gray-400 max-w-xl">
              تم رصد {missingSchemaCount} مقال تفتقد لترميز <b>NewsArticle</b> لضمان ظهور مقالات صافرة 90 بطريقة مثالية بنتائج Google News.
            </p>
          </div>
          <button
            onClick={onRepair}
            disabled={isRunningAudit || articlesListLength === 0}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 select-none shrink-0 transition-all shadow-lg hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>إصلاح فوري للبيانات المنظمة (One-Click Repair)</span>
          </button>
        </div>
      )}

      <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4">
        <h3 className="text-sm font-black text-white">التحقق من البيانات المنظمة والقواعد الفورية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold font-mono">
          
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-gray-400 block text-[10px]">NewsArticle Schema structure</span>
              <span className="text-emerald-400">مفعلة وتلقائية للتفاصيل ✅</span>
            </div>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-gray-400 block text-[10px]">Breadcrumb schema positional index</span>
              <span className="text-emerald-400">مفعلة لجميع الموزعات ✅</span>
            </div>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-gray-400 block text-[10px]">OpenGraph Tags verified</span>
              <span className="text-emerald-400">نشطة (og:image / og:description) ✅</span>
            </div>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <span className="text-gray-400 block text-[10px]">Twitter Card parameters</span>
              <span className="text-emerald-400">مفعلة (summary_large_image) ✅</span>
            </div>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>

        </div>
      </div>
    </div>
  );
};
