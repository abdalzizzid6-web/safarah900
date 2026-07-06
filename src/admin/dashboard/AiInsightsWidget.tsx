import React from 'react';
import { Sparkles, Loader2, Server, Megaphone, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

export default function AiInsightsWidget({ handleFetchAiInsights, loadingAi, aiInsights }: any) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400 animate-pulse" />
            مستشار التشغيل التكتيكي والـ SEO القائم على Gemini AI
          </h3>
          <p className="text-xs text-gray-400 font-semibold leading-relaxed">
            تحليل شامل لكافة كاونترات المسابقات والإحصائيات بالذكاء الاصطناعي لإنشاء خطة تسويقية، توصية أمان وأرشفة لموقعك.
          </p>
        </div>
        <button
          onClick={handleFetchAiInsights}
          disabled={loadingAi}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-95 cursor-pointer outline-none disabled:opacity-50"
        >
          {loadingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          <span>استخلاص التوجيهات الذكية ✨</span>
        </button>
      </div>

      {aiInsights ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#161619] border border-white/5 p-5 rounded-[1.8rem] space-y-3 shadow-inner">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.03]">
              <Server size={14} className="text-teal-400" />
              <span className="text-xs font-black text-white">إشراف البث والـ CDN</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              {aiInsights.serverOptimization}
            </p>
          </div>

          <div className="bg-[#161619] border border-white/5 p-5 rounded-[1.8rem] space-y-3 shadow-inner">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.03]">
              <Megaphone size={14} className="text-amber-400" />
              <span className="text-xs font-black text-white">استراتيجية الإعلانات والأرباح</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              {aiInsights.adsStrategy}
            </p>
          </div>

          <div className="bg-[#161619] border border-white/5 p-5 rounded-[1.8rem] space-y-3 shadow-inner">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.03]">
              <FileText size={14} className="text-indigo-400" />
              <span className="text-xs font-black text-white">استراتيجية الـ SEO والأرشفة</span>
            </div>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              {aiInsights.contentStrategy}
            </p>
          </div>

          {aiInsights.criticalPriorities && aiInsights.criticalPriorities.length > 0 && (
            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-emerald-950/10 border border-emerald-500/10 p-5 rounded-[1.8rem] space-y-3 shadow-sm">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 pb-2.5 border-b border-emerald-500/10">
                  <CheckSquare size={13} />
                  أولويات العمل الفورية المقترحة
                </h4>
                <ul className="space-y-2.5 text-xs text-gray-300 font-semibold">
                  {aiInsights.criticalPriorities.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-emerald-400 font-extrabold mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-950/10 border border-red-500/10 p-5 rounded-[1.8rem] space-y-3 shadow-sm">
                <h4 className="text-xs font-black text-red-400 flex items-center gap-1.5 pb-2.5 border-b border-red-500/10">
                  <AlertTriangle size={13} />
                  تحذيرات ومخاطر حركة المرور الكثيفة
                </h4>
                <ul className="space-y-2.5 text-xs text-gray-300 font-semibold">
                  {aiInsights.trafficAlerts.map((item: string, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="text-red-400 font-black mt-0.5">⚡</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/[0.012] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
          <span className="text-xs font-semibold text-gray-500">لا تتوفر نصائح استراتيجية نشطة للسلامة حالياً. اضغط على الزر بالأعلى لتشغيل مستشار الذكاء الاصطناعي الفوري.</span>
        </div>
      )}
    </div>
  );
}
