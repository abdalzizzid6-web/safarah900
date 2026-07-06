import React, { useState, useEffect } from 'react';
import { 
  Trophy, Star, Calendar, MapPin, Users, 
  Settings, RefreshCw, Activity, Database, 
  Search, Filter, CheckCircle2, AlertCircle, 
  Zap, Globe, ChevronLeft, ChevronRight, Layout
} from 'lucide-react';

interface WCEvent {
  id: string;
  type: 'stadium' | 'team' | 'match' | 'news';
  title: string;
  status: 'ready' | 'incomplete' | 'syncing';
  lastUpdated: string;
}

export default function WorldCupManager() {
  const [events, setEvents] = useState<WCEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Simulating fetching World Cup specific data
    const mockEvents: WCEvent[] = [
      { id: 'st1', type: 'stadium', title: 'Azteca Stadium - Mexico City', status: 'ready', lastUpdated: new Date().toISOString() },
      { id: 'st2', type: 'stadium', title: 'MetLife Stadium - New York', status: 'ready', lastUpdated: new Date().toISOString() },
      { id: 'tm1', type: 'team', title: 'Saudi Arabia National Team', status: 'incomplete', lastUpdated: new Date().toISOString() },
      { id: 'mt1', type: 'match', title: 'Opening Match (TBD vs TBD)', status: 'syncing', lastUpdated: new Date().toISOString() }
    ];
    setEvents(mockEvents);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/admin/worldcup/sync', { method: 'POST' });
      // Simulate completion
      setTimeout(() => setIsSyncing(false), 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-l from-amber-600 to-amber-900 rounded-3xl p-8 border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-right space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="bg-white/20 text-white text-[10px] font-black px-2 py-1 rounded-full border border-white/20 uppercase tracking-widest">
                OFFICIAL 2026 ROADMAP
              </span>
              <div className="flex items-center gap-1 text-white/80">
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
                <Star size={12} fill="currentColor" />
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white">تحكم كأس العالم 2026</h1>
            <p className="text-amber-100 text-sm max-w-xl font-bold leading-relaxed opacity-90">
              إدارة المحتوى المخصص لمونديال أمريكا، المكسيك وكندا. مراقبة الملاعب، تجهيز قوائم المنتخبات، وضبط جداول المباريات والمجموعات.
            </p>
          </div>
          
          <div className="shrink-0 flex flex-col items-center gap-4">
             <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl backdrop-blur-sm">
                <Trophy size={48} className="text-white" />
             </div>
             <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className="bg-white text-amber-900 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-amber-50 transition-all flex items-center gap-2"
             >
               <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
               {isSyncing ? 'جاري التحديث...' : 'تحديث شامل للبيانات'}
             </button>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
           <Trophy size={400} className="absolute -top-20 -left-20 rotate-12" />
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Components List */}
          <div className="bg-[#111112] border border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Activity size={16} className="text-amber-500" />
                مكونات القسم النشطة
              </h3>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-500" />
                <span className="text-xs text-gray-400 font-bold">تصفية</span>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {events.map((event) => (
                <div key={event.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-all group-hover:scale-105 ${
                      event.type === 'stadium' ? 'bg-emerald-500/10 text-emerald-500' :
                      event.type === 'team' ? 'bg-blue-500/10 text-blue-500' :
                      event.type === 'match' ? 'bg-amber-500/10 text-amber-500' : 'bg-pink-500/10 text-pink-500'
                    }`}>
                      {event.type === 'stadium' ? <MapPin size={24} /> :
                       event.type === 'team' ? <Users size={24} /> :
                       event.type === 'match' ? <Calendar size={24} /> : <Layout size={24} />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{event.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                         <span className="uppercase font-mono tracking-wider">{event.type}</span>
                         <span>•</span>
                         <span>آخر تحديث: {new Date(event.lastUpdated).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2">
                       {event.status === 'ready' ? (
                         <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                           <CheckCircle2 size={12} />
                           <span>جاهز</span>
                         </div>
                       ) : event.status === 'syncing' ? (
                         <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                           <RefreshCw size={12} className="animate-spin" />
                           <span>جاري المزامنة</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                           <AlertCircle size={12} />
                           <span>بيانات ناقصة</span>
                         </div>
                       )}
                    </div>
                    
                    <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Settings size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="bg-[#111112] border border-white/5 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-black text-white">إحصائيات المونديال</h3>
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">عدد الملاعب</span>
                <div className="flex items-center justify-between">
                   <span className="text-xl font-black text-white">16</span>
                   <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">3 دول</span>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">المنتخبات المسجلة</span>
                <div className="flex items-center justify-between">
                   <span className="text-xl font-black text-white">48</span>
                   <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">نظام جديد</span>
                </div>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">إجمالي المباريات المتوقعة</span>
                <div className="flex items-center justify-between">
                   <span className="text-xl font-black text-white">104</span>
                   <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">تحميل تلقائي</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Settings Card */}
          <div className="bg-[#111112] border border-white/5 p-6 rounded-3xl space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-white">المزامنة التلقائية لـ WC 2026</h3>
             </div>
             <p className="text-[10px] text-gray-400 leading-relaxed">
               يتم تحديث بيانات كأس العالم كل 12 ساعة من المصادر الرسمية للفيفا لضمان دقة مواعيد المباريات وتشكيلات الفرق.
             </p>
             <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-bold text-gray-300">مزامنة البيانات الحية</span>
                <div className="w-10 h-5 bg-emerald-600 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full translate-x-5 transition-all" />
                </div>
             </div>
             <button className="w-full mt-4 bg-white/5 border border-white/10 text-white text-[11px] font-black py-2.5 rounded-xl hover:bg-white/10 transition-all">
                فتح سجلات المزامنة التفصيلية
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
