import React from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface ApiStatisticsWidgetProps {
  totalRequests: number;
  successRate: number;
  hourlyTrends: Array<{ hour: string; requests: number; success: number; errors: number; cost: number }>;
}

export const ApiStatisticsWidget: React.FC<ApiStatisticsWidgetProps> = React.memo(({
  totalRequests,
  successRate,
  hourlyTrends
}) => {
  return (
    <div className="bg-[#121214] border border-gray-800 rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF003C]/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF003C]" />
            تحليلات الاستهلاك الفوري
          </h3>
          <span className="text-xs text-gray-500 font-mono">Last 24 Hours</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 border border-gray-800/40 p-3 rounded-xl">
            <span className="text-xs text-gray-400 block">إجمالي طلبات النظام</span>
            <span className="text-2xl font-black text-gray-100 font-mono block mt-1">
              {totalRequests}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800/40 p-3 rounded-xl">
            <span className="text-xs text-gray-400 block">معدل نجاح الاتصال</span>
            <span className={`text-2xl font-black font-mono block mt-1 ${successRate >= 95 ? 'text-green-400' : 'text-amber-400'}`}>
              {successRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline / Trend visualization */}
      <div className="h-28 w-full mt-4">
        {hourlyTrends && hourlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTrends} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF003C" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#FF003C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1E', borderColor: '#333', color: '#fff', direction: 'rtl' }}
                labelFormatter={(label) => `الوقت: ${label}`}
              />
              <Area type="monotone" dataKey="requests" name="الطلبات" stroke="#FF003C" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-lg">
            في انتظار طلبات الزوار لتوليد المخطط البياني...
          </div>
        )}
      </div>
    </div>
  );
});

ApiStatisticsWidget.displayName = 'ApiStatisticsWidget';
export default ApiStatisticsWidget;
