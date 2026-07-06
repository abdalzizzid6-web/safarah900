import React from 'react';
import { Calendar, Users, Radio, Trophy } from 'lucide-react';

function StatGridCard({ icon, label, value, subtitle, glowColor, borderColor }: any) {
    return (
      <div className={`group bg-[#121214] border border-white/5 p-5 rounded-3xl flex items-start gap-4 transition-all duration-300 ${glowColor} ${borderColor}`}>
        <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5 transition-transform group-hover:scale-110">{icon}</div>
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</p>
          <h4 className="text-2xl font-black text-white mt-1 tracking-tighter font-mono">{value}</h4>
          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{subtitle}</p>
        </div>
      </div>
    );
  }

export default function StatisticsCards({ stats, status }: { stats: any, status: any }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatGridCard 
          icon={<Calendar className="text-amber-400 animate-pulse" size={20} />} 
          label="المباريات الرياضية الحية" 
          value={stats.matches} 
          subtitle="مجدولة وجاهزة" 
          glowColor="group-hover:shadow-[0_20px_50px_rgba(245,158,11,0.06)]"
          borderColor="group-hover:border-amber-500/20"
        />
        <StatGridCard 
          icon={<Trophy className="text-blue-400" size={20} />} 
          label="البطولات والمسابقات" 
          value={stats.leagues} 
          subtitle="دوريات نشطة ومفعلة" 
          glowColor="group-hover:shadow-[0_20px_50px_rgba(59,130,246,0.06)]"
          borderColor="group-hover:border-blue-500/20"
        />
        <StatGridCard 
          icon={<Users className="text-indigo-400" size={20} />} 
          label="الفرق والمنتخبات العالمية" 
          value={stats.teams} 
          subtitle="تعديل فوري من الـ CMS" 
          glowColor="group-hover:shadow-[0_20px_50px_rgba(99,102,241,0.06)]"
          borderColor="group-hover:border-indigo-500/20"
        />
        <StatGridCard 
          icon={<Radio className="text-rose-400" size={20} />} 
          label="قنوات وسيرفرات البث" 
          value={stats.channels} 
          subtitle={status.firebase === 'connected' ? "جميع الخطوط مستقرة" : "قيد الفحص والتدقيق"} 
          glowColor="group-hover:shadow-[0_20px_50px_rgba(244,63,94,0.06)]"
          borderColor="group-hover:border-rose-500/20"
        />
    </div>
  );
}
