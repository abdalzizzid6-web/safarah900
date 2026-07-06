import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { Users, UserCheck, Heart, MessageSquare, Star, Activity } from 'lucide-react';

interface UserBehaviorAnalyticsProps {
  stats: any; // Now passed as pre-aggregated stats object from AnalyticsCenter
}

export default function UserBehaviorAnalytics({ stats }: UserBehaviorAnalyticsProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="إجمالي المستخدمين" value={stats.total || 0} icon={<Users className="text-blue-500" />} />
        <MetricCard title="أعضاء VIP" value={stats.vips || 0} icon={<Star className="text-amber-500" />} />
        <MetricCard title="الفريق الإداري" value={stats.admins || 0} icon={<UserCheck className="text-emerald-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-lg">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
            <Activity className="text-primary w-5 h-5" />
            نمو قاعدة المستخدمين (سنوي)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.regData || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#070c16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', textAlign: 'right' }}
                />
                <Area type="monotone" dataKey="value" name="مستخدمون جدد" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-lg">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
            <Activity className="text-emerald-400 w-5 h-5" />
            نشاط المستخدمين المباشر
          </h3>
          <div className="space-y-6">
            <ActivityBar label="نشطون اليوم (DAU)" value={stats.activeLast24h || 0} total={stats.total || 0} color="bg-emerald-500" />
            <ActivityBar label="نشطون هذا الأسبوع (WAU)" value={stats.activeLast7d || 0} total={stats.total || 0} color="bg-blue-500" />
            <div className="pt-6 border-t border-white/5 text-[11px] text-gray-500 font-bold leading-relaxed">
              * يتم احتساب النشاط بناءً على تاريخ آخر تسجيل دخول (Last Login). يتم تحديث البيانات فورياً عند تفاعل المستخدم مع الموقع.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: any) {
  return (
    <div className="bg-black/40 p-6 rounded-3xl border border-white/5 shadow-lg flex items-center gap-6">
      <div className="p-4 bg-white/5 rounded-2xl">{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
      </div>
    </div>
  );
}

function ActivityBar({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-bold">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
