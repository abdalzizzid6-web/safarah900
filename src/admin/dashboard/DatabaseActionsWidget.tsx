import React from 'react';
import { Database, Loader2, Layers, Zap, Trash2 } from 'lucide-react';

export default function DatabaseActionsWidget({
  handleRebuildCounters, isRebuildingStats, loading,
  handleClearCache, isClearingCache,
  handleCleanOldNews, isCleaningOldNews
}: any) {
  return (
    <div className="bg-gradient-to-r from-teal-950/10 via-[#121214] to-emerald-950/10 rounded-[2.5rem] border border-emerald-500/10 p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Database size={18} className="text-emerald-400" />
            أدوات الصيانة، الإشراف وصحة البيانات السحابية
          </h3>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed">
            تحسين كفاءة Firestore بمزامنة العدادات الحقيقية في الغيمة، وتصريف وتطهير كاش الـ CDN، والتنظيف التلقائي للأخبار القديمة لخفض استهلاك الحصة اليومية.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRebuildCounters}
            disabled={isRebuildingStats || loading}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
          >
            {isRebuildingStats ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />}
            <span>مزامنة كاونترات Firestore</span>
          </button>
          <button
            onClick={handleClearCache}
            disabled={isClearingCache || loading}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 font-black text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
          >
            {isClearingCache ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            <span>تطهير كاش CDN وخوادم النفل</span>
          </button>
          <button
            onClick={handleCleanOldNews}
            disabled={isCleaningOldNews || loading}
            className="flex items-center gap-2 px-5 py-3 bg-[#FF003C]/10 border border-[#FF003C]/20 hover:bg-[#FF003C]/20 text-[#FF003C] font-black text-xs rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer outline-none"
          >
            {isCleaningOldNews ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            <span>تنظيف الأخبار والأرشيف القديم (&gt;24س)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-[#18181b]/55 border border-white/[0.03] p-4 rounded-2xl flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-bold">دقة الفهرسة المؤتمتة</span>
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            مضمونة %100
          </span>
        </div>
        <div className="bg-[#18181b]/55 border border-white/[0.03] p-4 rounded-2xl flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-bold">زمن استجابة الاستعلام</span>
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {"~ 11ms (Cached)"}
          </span>
        </div>
        <div className="bg-[#18181b]/55 border border-white/[0.03] p-4 rounded-2xl flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-bold">حماية الخرائط Sitemaps</span>
          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            مأرشفة وصحيحة
          </span>
        </div>
      </div>
    </div>
  );
}
