import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Clock } from 'lucide-react';
import { auth } from '@/firebase';

export default function DashboardHeader({ fetchStats, loading, title }: { fetchStats: () => void, loading: boolean, title: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-60 h-40 bg-emerald-500/5 rounded-full blur-[80px]" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              {title}
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md uppercase tracking-wider">
                PRO ACTIVE V3.8
              </span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm font-semibold max-w-2xl leading-relaxed">
            أهلاً بك، <span className="text-white font-extrabold">{auth.currentUser?.displayName || 'المدير العام'}</span> • تتبع وإدارة السيرفرات الحية، مزامنة قواعد البيانات Cloud DB وتدقيق سلامة البث بكفاءة فائقة.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <button 
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2.5 px-5 py-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-2xl text-xs font-black text-gray-200 transition-all cursor-pointer disabled:opacity-50 inline-flex shadow-lg"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-amber-500' : 'text-gray-400'} />
            تحديث المؤشرات الحية
          </button>
          <div className="px-5 py-3 bg-black/40 border border-white/[0.04] rounded-2xl text-xs font-semibold text-gray-400 shadow-inner flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-amber-500" />
              <span>{time.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-white/60">
              <Clock size={11} className="text-emerald-500" />
              <span>{time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
  );
}
