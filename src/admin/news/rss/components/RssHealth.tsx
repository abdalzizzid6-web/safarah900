import React from 'react';
import { RssProvider } from '../types';
import { RefreshCw, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { formatArabicDate } from '../utils';

interface Props {
  providers: RssProvider[];
  loading: boolean;
  syncingId: string | null;
  onSync: (id: string) => Promise<any>;
}

export function RssHealth({ providers, loading, syncingId, onSync }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          مراقبة صحة مصادر RSS
        </h2>
        <p className="text-xs text-gray-400 mt-1">حالة المصادر الحالية وسجل المزامنة</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {providers.map((p) => {
          const isSyncing = syncingId === p.id;
          return (
            <div key={p.id} className="bg-[#121214] border border-white/[0.05] rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div>
                  <h3 className="text-sm font-bold text-white">{p.name}</h3>
                  <p className="text-[10px] text-gray-500">{p.url}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-[10px] text-gray-500">آخر مزامنة</span>
                  <span className="text-xs font-bold text-gray-300">
                    {p.lastSync ? formatArabicDate(p.lastSync).split('في')[1] || 'مؤخراً' : 'لم يسبق'}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className="block text-[10px] text-gray-500">الحالة</span>
                  <span className={`text-xs font-bold ${p.status === 'ACTIVE' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {p.status === 'ACTIVE' ? 'نشط' : 'فشل'}
                  </span>
                </div>

                <button
                  onClick={() => onSync(p.id)}
                  disabled={isSyncing}
                  className={`p-2 rounded-xl border border-white/[0.05] transition-all ${
                    isSyncing ? 'bg-gray-800 text-gray-500' : 'bg-[#18181C] text-primary hover:bg-[#23232C]'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
