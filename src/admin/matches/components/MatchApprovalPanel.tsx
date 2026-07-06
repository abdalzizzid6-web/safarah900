import React from 'react';
import { Zap, RefreshCw, Plus, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function MatchApprovalPanel({ 
  filteredMatchesLength, 
  loadData, 
  loading, 
  handleStartAddMatch, 
  showAdvancedFilters, 
  setShowAdvancedFilters,
  selectedLeagueFilter,
  selectedDateFilter,
  searchQuery
}: any) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shrink-0">
          <Zap className="text-primary fill-primary/10 animate-pulse" size={20} />
        </div>
        <div>
          <h3 className="font-black text-sm text-white flex items-center gap-2">
            لوحة التحكم في اعتماد المباريات
            <span className="text-xs bg-white/5 border border-white/5 text-gray-400 font-mono px-2 py-0.5 rounded-lg font-black">
              {filteredMatchesLength} مصفاة
            </span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">اعتماد المباريات القادمة من الواجهات التقنية وترخيصها للنشر</p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button 
          onClick={async () => {
            alert("بدء مزامنة كأس العالم...");
            const { syncWorldCupToFirestore } = await import('@/src/services/worldCupSyncService');
            const results = await syncWorldCupToFirestore();
            alert(`تمت المزامنة بنجاح: ${JSON.stringify(results)}`);
          }} 
          className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black shadow-lg shadow-blue-500/10 hover:scale-[1.02]"
        >
          Sync WC
        </button>
        <button 
          onClick={handleStartAddMatch} 
          className="p-3 bg-green-500 hover:bg-green-600 text-black rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black shadow-lg shadow-green-500/10 hover:scale-[1.02]"
        >
          <Plus size={14} /> إضافة مباراة
        </button>
        <button 
          onClick={loadData} 
          disabled={loading} 
          className="p-3 bg-white/5 border border-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black"
        >
          <RefreshCw className={cn("text-primary", loading && "animate-spin")} size={14} /> تحديث
        </button>
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
          className={cn("p-3 rounded-xl transition-all border flex items-center gap-2 text-xs font-black cursor-pointer select-none", showAdvancedFilters || selectedLeagueFilter !== 'ALL' || selectedDateFilter || searchQuery ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10")}
        >
          <SlidersHorizontal size={14} /> تصفية {showAdvancedFilters ? '▲' : '▼'}
        </button>
      </div>
    </div>
  );
}
