import React from 'react';
import { Cpu, Check } from 'lucide-react';
import { ApiHealth } from '../types/api';

interface ApiHealthWidgetProps {
  health: ApiHealth;
}

export const ApiHealthWidget: React.FC<ApiHealthWidgetProps> = React.memo(({ health }) => {
  return (
    <div className="bg-[#121214] border border-gray-800 rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-200 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            مراقبة كفاءة ومؤشرات الخادم
          </h3>
          <span className="text-xs text-cyan-400/80 font-semibold font-mono">Live Node</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-900/50 border border-gray-800/40 p-2 rounded-xl text-center">
            <span className="text-xs text-gray-400 block">نشط وسليم</span>
            <span className="text-lg font-black text-green-400 font-mono block mt-1">
              {health.healthyCount}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/40 p-2 rounded-xl text-center">
            <span className="text-xs text-gray-400 block">مجهد/محدود</span>
            <span className="text-lg font-black text-amber-400 font-mono block mt-1">
              {health.degradedCount}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/40 p-2 rounded-xl text-center">
            <span className="text-xs text-gray-400 block">متوقف/معطل</span>
            <span className="text-lg font-black text-red-400 font-mono block mt-1">
              {health.suspendedCount}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1 border-t border-gray-800/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">متوسط زمن الاستجابة (Latency)</span>
          <span className="text-cyan-400 font-mono font-bold">
            {health.averageLatency}ms
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">عدد الأخطاء / تجاوز المعدل</span>
          <span className="text-red-400 font-mono font-bold">
            {health.rateLimitsCount} (429) | {health.authErrorsCount} (403)
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">آلية الدعم الاحتياطي الفعال (Failover)</span>
          <span className="text-green-400 font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            تلقائي نشط
          </span>
        </div>
      </div>
    </div>
  );
});

ApiHealthWidget.displayName = 'ApiHealthWidget';
export default ApiHealthWidget;
