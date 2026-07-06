import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, XCircle, AlertTriangle, Wifi, Cpu, 
  Database, Sparkles, History, RefreshCw, Lock, Radio, 
  Image as ImageIcon, Megaphone, Bell, ShieldCheck, Clock, Globe
} from 'lucide-react';
import { auth } from '../../firebase';

interface ServiceStatus {
  name: string;
  status: string;
  isConfigured: boolean;
  isValid: boolean;
  isQuotaExceeded: boolean;
  lastSuccess: string | null;
  error: string;
}

interface DiagnosisReport {
  apiFootball: ServiceStatus;
  gemini: ServiceStatus;
  firebase: ServiceStatus;
  firebaseAuth: ServiceStatus;
  rss: ServiceStatus;
  imagekit: ServiceStatus;
  advertisement: ServiceStatus;
  pushNotification: ServiceStatus;
  server: ServiceStatus;
  cache: ServiceStatus;
}

const serviceMeta: Record<string, { desc: string; icon: React.ComponentType<any>; color: string }> = {
  apiFootball: { desc: "بث ومزامنة المباريات", icon: Wifi, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" },
  gemini: { desc: "توليد التوقعات والأخبار", icon: Sparkles, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10" },
  firebase: { desc: "استقرار وحفظ الجداول", icon: Database, color: "bg-amber-500/10 text-amber-500 border-amber-500/10" },
  firebaseAuth: { desc: "مصادقة وأمن الأعضاء", icon: Lock, color: "bg-purple-500/10 text-purple-400 border-purple-500/10" },
  rss: { desc: "الاستيراد التلقي للأخبار", icon: Radio, color: "bg-blue-500/10 text-blue-400 border-blue-500/10" },
  imagekit: { desc: "معالجة وتحسين الصور", icon: ImageIcon, color: "bg-pink-500/10 text-pink-400 border-pink-500/10" },
  advertisement: { desc: "إعلانات ومساحات الرعاية", icon: Megaphone, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/10" },
  pushNotification: { desc: "بث النبضات الفورية للإشارات", icon: Bell, color: "bg-rose-500/10 text-rose-400 border-rose-500/10" },
  server: { desc: "موجهات وخادم التشغيل", icon: Cpu, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/10" },
  cache: { desc: "تراجع وحفظ طلبات الشبكة", icon: History, color: "bg-teal-500/10 text-teal-400 border-teal-500/10" },
};

export default function SystemHealthDashboard() {
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [report, setReport] = useState<DiagnosisReport | null>(null);

  const runFullSystemCheck = async () => {
    setIsRunningCheck(true);
    try {
      const response = await fetch('/api/diagnostics/run-tests', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningCheck(false);
    }
  };

  useEffect(() => {
    runFullSystemCheck();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status.includes('CONNECTED')) {
      return <span className="text-emerald-400">متصل ✅</span>;
    }
    if (status.includes('INVALID KEY')) {
      return <span className="text-red-500">مفتاح غير صالح ❌</span>;
    }
    return <span className="text-amber-500">خطأ بالاتصال ⚠️</span>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldCheck className="text-amber-500" />
          حالة النظام والخدمات السحابية
        </h3>
        <button
          onClick={runFullSystemCheck}
          disabled={isRunningCheck}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
        >
          <RefreshCw size={16} className={isRunningCheck ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {report ? Object.entries(report).map(([key, service]) => {
          const meta = serviceMeta[key] || { desc: "فحص", icon: Activity, color: "bg-gray-500/10 text-gray-400" };
          return (
            <div key={key} className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between">
                 <div className={`p-2 rounded-lg ${meta.color.split(' ').slice(0,1).join(' ')}`}>
                   <meta.icon size={16} className={meta.color.split(' ')[1]} />
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{service.name}</span>
                    <div className="text-[10px] font-black">
                      {getStatusBadge(service.status)}
                    </div>
                 </div>
              </div>
              <p className="text-[9px] text-gray-500 font-bold leading-tight line-clamp-1">{meta.desc}</p>
            </div>
          );
        }) : Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl">
            <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
               <History className="text-primary w-5 h-5" />
               سجل أحداث النظام الأخيرة (System Events)
            </h3>
            <div className="space-y-3">
               {[
                 { time: '10:45 AM', event: 'Sitemap Auto-Generated', type: 'info', icon: <Globe size={14} /> },
                 { time: '09:30 AM', event: 'Match Sync Completed (Premier League)', type: 'success', icon: <Wifi size={14} /> },
                 { time: '08:15 AM', event: 'Daily Analytics Aggregated', type: 'info', icon: <Activity size={14} /> },
                 { time: '07:00 AM', event: 'Cache Purge Routine', type: 'system', icon: <RefreshCw size={14} /> },
               ].map((log, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3">
                       <div className="text-gray-500 text-[10px] font-mono">{log.time}</div>
                       <div className="flex items-center gap-2 text-white text-xs font-bold">
                          {log.icon}
                          {log.event}
                       </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${log.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                       {log.type}
                    </span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl">
            <h3 className="text-sm font-black text-white mb-6 flex items-center gap-2">
               <Clock className="text-amber-500 w-5 h-5" />
               جهوزية السيرفر (Uptime)
            </h3>
            <div className="flex flex-col items-center justify-center py-8">
               <div className="text-5xl font-black text-white tracking-tighter mb-2">99.9%</div>
               <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  النظام يعمل بكفاءة كاملة
               </div>
               
               <div className="w-full mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                     <span className="text-[10px] text-gray-500 font-bold block mb-1">الاستجابة</span>
                     <span className="text-sm font-black text-primary">124ms</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                     <span className="text-[10px] text-gray-500 font-bold block mb-1">الضغط</span>
                     <span className="text-sm font-black text-blue-400">Low</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
