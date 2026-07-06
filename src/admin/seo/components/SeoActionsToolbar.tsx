import React from 'react';
import { Activity, RefreshCw, Sparkles, Download } from 'lucide-react';

interface SeoActionsToolbarProps {
  isRunningAudit: boolean;
  auditProgress: string;
  onRunAudit: () => void;
  onRepairSchema: () => void;
  onExportMatches: () => void;
  articlesListLength: number;
}

export const SeoActionsToolbar: React.FC<SeoActionsToolbarProps> = ({
  isRunningAudit,
  auditProgress,
  onRunAudit,
  onRepairSchema,
  onExportMatches,
  articlesListLength
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white/[0.01] border border-white/5 rounded-3xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Activity className={`w-5 h-5 ${isRunningAudit ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-bold">الحالة الفورية لعملية التحليل الفني</p>
          <p className="text-xs font-black text-gray-200 mt-0.5">
            {isRunningAudit ? auditProgress : 'بوابات الويب السحابية ومحللات الـ SEO جاهزة لبدء المسح الشامل'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
        <button
          onClick={onRunAudit}
          disabled={isRunningAudit}
          className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/5 font-black text-xs px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 select-none cursor-pointer hover:scale-[1.01] active:scale-95 transition-all"
        >
          <RefreshCw size={14} className={isRunningAudit ? 'animate-spin' : ''} />
          <span>تشغيل فحص الأرشفة (Run Audit)</span>
        </button>

        <button
          onClick={onRepairSchema}
          disabled={isRunningAudit || articlesListLength === 0}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-400 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 text-black font-black text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 select-none cursor-pointer transition-all shadow-lg shadow-amber-500/10"
        >
          <Sparkles size={14} />
          <span>إصلاح المخطط الذكي (Repair Schema)</span>
        </button>
        
        <button
          onClick={onExportMatches}
          disabled={isRunningAudit}
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-black text-xs px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 select-none cursor-pointer transition-all"
        >
          <Download size={14} />
          <span>تصدير روابط المباريات (CSV)</span>
        </button>
      </div>
    </div>
  );
};
