import React from 'react';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrafficWidget({ chartData }: { chartData: any[] }) {
  const lastDayViews = chartData.length > 0 ? chartData[chartData.length - 1].count : 0;

  return (
    <div className="lg:col-span-2 bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400 animate-pulse" />
            تحليل حركة المرور والتفاعل الفعلي
          </h3>
          <select className="bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-1.5 outline-none text-gray-400 focus:border-amber-500/50 cursor-pointer font-bold">
            <option>آخر 7 أيام</option>
            <option>آخر 30 يوم</option>
          </select>
        </div>

        <div className="h-[170px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{backgroundColor: '#121214', border: '1px solid #ffffff10', borderRadius: '16px', color: '#fff'}}
                itemStyle={{fontSize: '11px', fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-4 border-t border-white/[0.04] mt-3">
        <span>
          {lastDayViews > 0 
            ? `مجموع الزيارات الفنية المؤرشفة لليوم الأخير: ${lastDayViews.toLocaleString('ar-EG')} طلب خدمة` 
            : "مجموع الزيارات النشطة اليوم: جاري رصد الإحصائيات الفورية..."
          }
        </span>
        <span className="text-emerald-400 font-extrabold">بث لحظي مستمر</span>
      </div>
    </div>
  );
}
