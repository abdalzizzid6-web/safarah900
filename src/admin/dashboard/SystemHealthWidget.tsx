import React from 'react';
import { Cpu, Info } from 'lucide-react';

export default function SystemWidget({ cpuLoad, memoryLoad, apiPing }: any) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <Cpu size={16} className="text-amber-500" />
            تحليلات صحة السيرفر
          </h3>
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black rounded-lg text-[10px]">
            مستقر وآمن
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-bold">معالج البيانات (CPU Load)</span>
              <span className="text-white font-mono font-bold">{cpuLoad}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000" 
                style={{ width: `${cpuLoad}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-bold">الذاكرة العشوائية (RAM Memory)</span>
              <span className="text-white font-mono font-bold">{memoryLoad}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000" 
                style={{ width: `${memoryLoad}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-bold">زمن الاستجابة للـ API</span>
              <span className="text-white font-mono font-bold">{apiPing}ms</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, apiPing * 3.3)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
        <Info size={14} className="text-amber-500 shrink-0" />
        <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
          تراقب هذه اللوحة استهلاك المعالج ومزودات الـ REST API والمخازن التخزينية في الغيمة تلقائياً.
        </p>
      </div>
    </div>
  );
}
