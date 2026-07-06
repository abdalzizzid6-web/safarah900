import React, { useState } from 'react';
import { PlayCircle, AlertTriangle } from 'lucide-react';

export default function LiveWidget({ liveMatches, auditStreamLink, auditingStreamId, auditResult, showToast }: any) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="space-y-1">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <PlayCircle className="text-rose-500 animate-pulse" size={17} />
            فاحص ومدقق خطوط البث الرياضي التلقائي
          </h3>
          <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
            مراقبة المباريات الحالية والتحقق بنقرة واحدة من سلامة روابط سيرفرات البث وصحة التشغيل قبل انطلاق صافرة اللقاء.
          </p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          أدوات التشغيل الحصرية
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {liveMatches.slice(0, 6).map((match: any) => {
          const hasLinks = match.hasStreams;
          const res = auditResult[match.id];
          
          return (
            <div 
              key={match.id} 
              className="bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] p-4 rounded-2xl flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white line-clamp-1">{match.homeName} ضد {match.awayName}</p>
                  <p className="text-[10px] text-gray-500 font-semibold">حالة اللقاء: {match.status || 'مجدول اليوم'}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                  hasLinks ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {hasLinks ? `${match.streamsCount} خطوط بث` : 'لا توجد روابط'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 mt-1">
                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                  الفحص: 
                  {res === 'checking' && <span className="text-gray-400 animate-pulse">جاري الفحص...</span>}
                  {res === 'online' && <span className="text-emerald-400 font-black">● متصل وسليم (Online)</span>}
                  {res === 'offline' && <span className="text-red-400 font-black flex items-center gap-0.5"><AlertTriangle size={10} /> معطل (Offline)</span>}
                  {!res && <span className="text-gray-500 font-black">بانتظار الفحص</span>}
                </span>

                <button
                  onClick={() => auditStreamLink(match.id)}
                  disabled={auditingStreamId === match.id}
                  className="text-[10px] font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/10 transition-colors"
                >
                  {auditingStreamId === match.id ? 'جاري التحقق...' : 'اختبار البث'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
