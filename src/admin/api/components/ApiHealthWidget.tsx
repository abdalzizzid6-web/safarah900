import React from 'react';
import { Cpu, Check, Activity, Zap, HardDrive, RefreshCw, ShieldAlert, BarChart3 } from 'lucide-react';
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
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            مراقبة كفاءة ومؤشرات الخادم (Health Dashboard)
          </h3>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 border border-cyan-500/20 rounded font-bold font-mono">Live Node</span>
        </div>

        {/* Nodes active counters */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-900/50 border border-gray-800/40 p-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block">نشط وسليم</span>
            <span className="text-lg font-black text-green-400 font-mono block mt-0.5">
              {health.healthyCount}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/40 p-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block">محدود / مجهد</span>
            <span className="text-lg font-black text-amber-400 font-mono block mt-0.5">
              {health.degradedCount}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/40 p-2 rounded-xl text-center">
            <span className="text-[10px] text-gray-400 block">معطل / احتياط</span>
            <span className="text-lg font-black text-red-400 font-mono block mt-0.5">
              {health.suspendedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Performance & Failover Panel */}
      <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-gray-800/50 text-xs">
        {/* Requests / sec */}
        <div className="flex items-center gap-2.5 bg-gray-900/30 p-2 rounded-lg border border-gray-800/30">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block">معدل الطلبات</span>
            <span className="font-bold text-gray-100 font-mono">{health.requestsPerSecond} req/s</span>
          </div>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-2.5 bg-gray-900/30 p-2 rounded-lg border border-gray-800/30">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block">متوسط الاستجابة</span>
            <span className="font-bold text-gray-100 font-mono">{health.averageLatency}ms</span>
          </div>
        </div>

        {/* Cache Hit / Miss Rate */}
        <div className="flex items-center gap-2.5 bg-gray-900/30 p-2 rounded-lg border border-gray-800/30">
          <HardDrive className="w-4 h-4 text-green-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block">أداء الكاش (Hit / Miss)</span>
            <span className="font-bold text-gray-100 font-mono">{health.cacheHitRate}% / {health.cacheMissRate}%</span>
          </div>
        </div>

        {/* Retry / Timeout Count */}
        <div className="flex items-center gap-2.5 bg-gray-900/30 p-2 rounded-lg border border-gray-800/30">
          <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block">المحاولات والمهل الزمنية</span>
            <span className="font-bold text-gray-100 font-mono">
              R:{health.retryCount} | T:{health.timeoutCount}
            </span>
          </div>
        </div>

        {/* Quota Usage */}
        <div className="flex items-center gap-2.5 bg-gray-900/30 p-2 rounded-lg border border-gray-800/30">
          <BarChart3 className="w-4 h-4 text-[#FF003C] shrink-0" />
          <div className="w-full">
            <span className="text-[10px] text-gray-400 block">استهلاك الحصة اليومية</span>
            <span className="font-bold text-gray-100 font-mono">{health.quotaUsage}%</span>
          </div>
        </div>

        {/* Provider Availability */}
        <div className="flex items-center gap-2.5 bg-gray-900/30 p-2 rounded-lg border border-gray-800/30">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block">جاهزية قنوات التوزيع</span>
            <span className="font-bold text-green-400 font-mono">{health.providerAvailability}%</span>
          </div>
        </div>
      </div>

      {/* Failover Status Summary */}
      <div className="flex items-center justify-between text-[11px] pt-3 border-t border-gray-800/30">
        <span className="text-gray-400 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-green-400" />
          آلية الدعم الذاتي (Failover Recovery)
        </span>
        <span className="text-green-400 font-extrabold flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          نشط وتلقائي
        </span>
      </div>
    </div>
  );
});

ApiHealthWidget.displayName = 'ApiHealthWidget';
export default ApiHealthWidget;
