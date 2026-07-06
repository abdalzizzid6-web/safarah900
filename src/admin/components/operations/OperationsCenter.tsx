import React from 'react';
import { Database, Activity, Server, Radio, AlertTriangle, ShieldCheck } from 'lucide-react';

export function OperationsCenter() {
  const stats = [
    { name: 'RSS Health', value: '98%', icon: Radio, color: 'text-emerald-500' },
    { name: 'API Latency', value: '42ms', icon: Activity, color: 'text-amber-500' },
    { name: 'Firestore Ops', value: '1,204', icon: Database, color: 'text-blue-500' },
    { name: 'Alerts', value: '3', icon: AlertTriangle, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-[#111112] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.name}</p>
            <p className="text-xl font-black text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
