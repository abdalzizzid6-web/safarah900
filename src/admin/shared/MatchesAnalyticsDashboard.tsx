import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Trophy, Calendar, Clock, Activity, Target } from 'lucide-react';
import { Match } from '../../types';

const COLORS = ['#f43f5e', '#d4af37', '#4ade80', '#3b82f6', '#a855f7'];

interface MatchesAnalyticsDashboardProps {
  stats: any; // Now passed as pre-aggregated stats object from AnalyticsCenter
}

export default function MatchesAnalyticsDashboard({ stats }: MatchesAnalyticsDashboardProps) {
  const statusData = [
    { name: 'مباشر', value: stats.live || 0, color: '#f43f5e' },
    { name: 'قادم', value: stats.upcoming || 0, color: '#d4af37' },
    { name: 'منتهي', value: stats.finished || 0, color: '#4ade80' },
    { name: 'ملغي/مؤجل', value: stats.cancelled || 0, color: '#6b7280' }
  ].filter(i => i.value > 0);

  const totalMatches = (stats.live || 0) + (stats.upcoming || 0) + (stats.finished || 0) + (stats.cancelled || 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          icon={<Activity className="text-rose-500" />} 
          label="جارية الآن" 
          value={stats.live} 
          color="border-rose-500/20"
          valueColor="text-rose-500" 
        />
        <SummaryCard 
          icon={<Calendar className="text-amber-500" />} 
          label="مباريات قادمة" 
          value={stats.upcoming} 
          color="border-amber-500/20"
          valueColor="text-amber-500" 
        />
        <SummaryCard 
          icon={<Trophy className="text-emerald-500" />} 
          label="تمت بنجاح" 
          value={stats.finished} 
          color="border-emerald-500/20"
          valueColor="text-emerald-500" 
        />
        <SummaryCard 
          icon={<Clock className="text-blue-500" />} 
          label="إجمالي المباريات" 
          value={totalMatches} 
          color="border-blue-500/20"
          valueColor="text-blue-500" 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-lg">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
            <Target className="text-primary w-5 h-5" />
            توزيع حالات المباريات
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#070c16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', textAlign: 'right' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* League Distribution */}
        <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-lg">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
            <Trophy className="text-amber-400 w-5 h-5" />
            توزيع المباريات حسب البطولات
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.leagueData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={10} width={80} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#070c16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', textAlign: 'right' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {stats.leagueData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Schedule Pattern */}
        <div className="lg:col-span-2 bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-lg">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
            <Calendar className="text-blue-400 w-5 h-5" />
            نمط كثافة المباريات خلال الأسبوع
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#070c16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', textAlign: 'right' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, valueColor }: any) {
  return (
    <div className={`bg-black/40 p-5 rounded-2xl border ${color} shadow-lg flex items-center gap-4`}>
      <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <h4 className={`text-2xl font-black ${valueColor} tracking-tight`}>{value}</h4>
      </div>
    </div>
  );
}
