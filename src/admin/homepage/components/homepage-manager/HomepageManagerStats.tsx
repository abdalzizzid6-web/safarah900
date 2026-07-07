import React from 'react';
import { Check, Smartphone, Code, Clock } from 'lucide-react';

interface HomepageManagerStatsProps {
  totalActive: number;
  blocksLength: number;
  mobileVisible: number;
  customScriptsCount: number;
  cachedDurationAvg: number;
}

export const HomepageManagerStats: React.FC<HomepageManagerStatsProps> = ({
  totalActive,
  blocksLength,
  mobileVisible,
  customScriptsCount,
  cachedDurationAvg
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-right">
      <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4 justify-between">
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400">الأقسام النشطة بالبث</div>
          <div className="text-xl font-black text-white font-mono mt-0.5">
            {totalActive} <span className="text-xs text-gray-500 font-sans">/ {blocksLength}</span>
          </div>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
          <Check size={20} />
        </div>
      </div>

      <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4 justify-between">
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400">ظهور كامل على الموبايل</div>
          <div className="text-xl font-black text-white font-mono mt-0.5">
            {mobileVisible} <span className="text-xs text-gray-500 font-sans">أقسام</span>
          </div>
        </div>
        <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
          <Smartphone size={20} />
        </div>
      </div>

      <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4 justify-between">
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400">كود مخصص HTML/Widgets</div>
          <div className="text-xl font-black text-white font-mono mt-0.5">
            {customScriptsCount} <span className="text-xs text-gray-500 font-sans">مكونات</span>
          </div>
        </div>
        <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
          <Code size={20} />
        </div>
      </div>

      <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4 justify-between">
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400">زمن تخزين الاستجابة</div>
          <div className="text-xl font-black text-white font-mono mt-0.5">
            {cachedDurationAvg} <span className="text-xs text-gray-500 font-sans">دقائق (ذكي)</span>
          </div>
        </div>
        <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
          <Clock size={20} />
        </div>
      </div>
    </div>
  );
};
