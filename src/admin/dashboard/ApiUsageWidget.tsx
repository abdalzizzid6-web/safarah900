import React, { useEffect, useState } from 'react';
import { Activity, Loader2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { auth } from '../../firebase';

export default function ApiUsageWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRequests, setTotalRequests] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/admin/api-management/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('فشل جلب إحصائيات API');
        const json = await res.json();
        if (json.error) throw new Error(json.message);
        
        if (isMounted) {
          setData(json.analytics?.hourlyTrends || []);
          setTotalRequests(json.analytics?.totalRequests || 0);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsage();
    const interval = setInterval(fetchUsage, 60000); // refresh every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 flex flex-col min-h-[350px]">
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
        <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
          <Activity size={16} className="text-[#FF003C]" />
          مراقبة استهلاك الموارد (API Usage)
        </h3>
        <div className="px-3 py-1 bg-[#FF003C]/10 border border-[#FF003C]/20 text-[#FF003C] font-black rounded-lg text-[10px]">
          في الوقت الفعلي
        </div>
      </div>

      <div className="mb-6 flex gap-4">
         <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1">
            <span className="text-gray-400 text-xs font-bold block mb-1">الطلبات اليومية</span>
            <span className="text-2xl font-mono font-black text-white">{totalRequests}</span>
         </div>
      </div>

      <div className="flex-1 w-full min-h-[200px] relative">
        {loading && data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400">
             <AlertTriangle className="w-6 h-6" />
             <span className="text-xs font-bold">{error}</span>
           </div>
        ) : data.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs font-bold">
              لا توجد بيانات متاحة
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF003C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF003C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
              <XAxis 
                dataKey="hour" 
                stroke="#666" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A1A1E', borderColor: '#333', borderRadius: '12px', color: '#fff', direction: 'rtl' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                labelFormatter={(label) => `الوقت: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="requests" 
                name="إجمالي الطلبات" 
                stroke="#FF003C" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorRequests)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
