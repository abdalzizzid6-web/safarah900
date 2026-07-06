import React from 'react';
import { cn } from '@/src/lib/utils';
import { Clock, ShieldCheck, Star, Activity, Archive } from 'lucide-react';

export default function MatchStatistics({ statsSummary, statusFilter, setStatusFilter }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div onClick={() => setStatusFilter('PENDING')} className={cn("slate-glass p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group", statusFilter === 'PENDING' ? "border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]")}>
        <div className="flex items-center justify-between"><span className="text-[10px] text-yellow-500 font-bold">قيد الانتظار ⏳</span><Clock size={16} className={statusFilter === 'PENDING' ? "text-yellow-500" : "text-gray-500"} /></div>
        <span className="block text-2xl font-black text-white mt-1.5 font-mono">{statsSummary.pending}</span>
        <span className="text-[9px] text-gray-500 font-medium block mt-0.5">مباريات تتطلب الاعتماد</span>
        {statusFilter === 'PENDING' && <div className="absolute left-0 bottom-0 top-0 w-1 bg-yellow-500" />}
      </div>
      <div onClick={() => setStatusFilter('APPROVED')} className={cn("slate-glass p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group", statusFilter === 'APPROVED' ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]")}>
        <div className="flex items-center justify-between"><span className="text-[10px] text-emerald-400 font-bold">معتمدة للإرسال ✅</span><ShieldCheck size={16} className={statusFilter === 'APPROVED' ? "text-emerald-400" : "text-gray-500"} /></div>
        <span className="block text-2xl font-black text-white mt-1.5 font-mono">{statsSummary.approved}</span>
        <span className="text-[9px] text-gray-500 font-medium block mt-0.5">جاهزة أو جارية حالياً</span>
        {statusFilter === 'APPROVED' && <div className="absolute left-0 bottom-0 top-0 w-1 bg-emerald-500" />}
      </div>
      <div onClick={() => setStatusFilter('FEATURED')} className={cn("slate-glass p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group", statusFilter === 'FEATURED' ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]")}>
        <div className="flex items-center justify-between"><span className="text-[10px] text-amber-500 font-bold">المميزة والقمة ⭐</span><Star size={16} className={statusFilter === 'FEATURED' ? "fill-amber-400 text-amber-400" : "text-gray-500"} /></div>
        <span className="block text-2xl font-black text-white mt-1.5 font-mono">{statsSummary.featured}</span>
        <span className="text-[9px] text-gray-500 font-medium block mt-0.5">مثبتة بالواجهة</span>
        {statusFilter === 'FEATURED' && <div className="absolute left-0 bottom-0 top-0 w-1 bg-amber-500" />}
      </div>
      <div onClick={() => setStatusFilter('ALL')} className={cn("slate-glass p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group", statusFilter === 'ALL' ? "border-red-500 bg-red-500/5 shadow-lg shadow-red-500/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]")}>
        <div className="flex items-center justify-between"><span className="text-[10px] text-red-500 font-bold">بث مباشر الآن 🔴</span><Activity size={16} className={statusFilter === 'ALL' ? "text-red-500" : "text-gray-500"} /></div>
        <span className="block text-2xl font-black text-white mt-1.5 font-mono">{statsSummary.live}</span>
        <span className="text-[9px] text-gray-500 font-medium block mt-0.5">مباريات جارية حالياً</span>
        {statusFilter === 'ALL' && <div className="absolute left-0 bottom-0 top-0 w-1 bg-red-500" />}
      </div>
      <div onClick={() => setStatusFilter('ARCHIVED')} className={cn("slate-glass p-4 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden group", statusFilter === 'ARCHIVED' ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/5" : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]")}>
        <div className="flex items-center justify-between"><span className="text-[10px] text-purple-400 font-bold">المؤرشفة 📦</span><Archive size={16} className={statusFilter === 'ARCHIVED' ? "text-purple-400" : "text-gray-500"} /></div>
        <span className="block text-2xl font-black text-white mt-1.5 font-mono">{statsSummary.archived}</span>
        <span className="text-[9px] text-gray-500 font-medium block mt-0.5">أرشيف قديم منتهي</span>
        {statusFilter === 'ARCHIVED' && <div className="absolute left-0 bottom-0 top-0 w-1 bg-purple-500" />}
      </div>
    </div>
  );
}
