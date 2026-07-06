import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trophy, TrendingUp, UserMinus, Flame, Play, Image, Video, FileText, Loader2, Award, ArrowUpRight } from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

interface PlayerKG {
  id: string;
  name: string;
  arabicName: string;
  careerTimeline: TimelineEvent[];
  newsTimeline: TimelineEvent[];
  transferTimeline: TimelineEvent[];
  injuryTimeline: TimelineEvent[];
  goalsTimeline: TimelineEvent[];
  photos: string[];
  videos: { title: string; url: string; thumbnail: string }[];
  updatedAt: string;
}

export default function PlayerKnowledgeGraph({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [data, setData] = useState<PlayerKG | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'media'>('timeline');
  const [timelineType, setTimelineType] = useState<'career' | 'news' | 'transfer' | 'injury' | 'goals'>('career');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/knowledge/player/${encodeURIComponent(playerId)}?name=${encodeURIComponent(playerName)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load player knowledge graph:", err);
        setLoading(false);
      });
  }, [playerId, playerName]);

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 animate-pulse min-h-[400px]" style={{ direction: 'rtl' }}>
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-gray-400 font-extrabold text-sm">جاري رسم وتوليد الشبكة المعرفية للاعب...</span>
        <span className="text-xs text-gray-500">مزامنة الانتقالات، الإصابات، الخط الزمني والأهداف التاريخية</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900/60 border border-white/5 p-12 rounded-[2.5rem] text-center text-gray-400 font-bold" style={{ direction: 'rtl' }}>
        لا تتوفر شبكة معرفية مفصلة لهذا اللاعب حالياً. يرجى المزامنة لاحقاً.
      </div>
    );
  }

  // Get active timeline list
  const getActiveTimeline = () => {
    switch (timelineType) {
      case 'career': return data.careerTimeline || [];
      case 'news': return data.newsTimeline || [];
      case 'transfer': return data.transferTimeline || [];
      case 'injury': return data.injuryTimeline || [];
      case 'goals': return data.goalsTimeline || [];
      default: return [];
    }
  };

  const activeEvents = getActiveTimeline();

  const timelineTabs = [
    { id: 'career', label: 'المسيرة الكروية', icon: <Trophy size={14} className="text-amber-500" /> },
    { id: 'news', label: 'الجدول الإخباري', icon: <FileText size={14} className="text-sky-500" /> },
    { id: 'transfer', label: 'الانتقالات', icon: <TrendingUp size={14} className="text-emerald-500" /> },
    { id: 'injury', label: 'سجل الإصابات', icon: <UserMinus size={14} className="text-red-500" /> },
    { id: 'goals', label: 'الأهداف الحاسمة', icon: <Flame size={14} className="text-orange-500" /> }
  ];

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Knowledge Graph Header Capsule */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-slate-950/40 border border-emerald-500/10 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <Award className="text-emerald-500 animate-pulse" size={24} />
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">الذكاء المعرفي الرياضي</span>
            <h3 className="text-lg font-black text-white mt-1">الشبكة المعرفية للاعب {data.arabicName}</h3>
          </div>
        </div>

        {/* View togglers */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 self-start md:self-auto shrink-0 select-none">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'timeline' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={13} />
            <span>الحقائب الزمنية المتكاملة</span>
          </button>
          <button
            onClick={() => setActiveSubTab('media')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'media' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video size={13} />
            <span>المرئيات والصور</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Content Area */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'timeline' ? (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Timeline selector tabs */}
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none select-none">
              {timelineTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimelineType(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    timelineType === tab.id 
                      ? 'bg-slate-900 border-emerald-500/30 text-white shadow-md' 
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Timeline Vertical Track */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 relative">
              {activeEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-bold text-xs">
                  لا توجد أحداث مسجلة في هذا السجل الزمني حالياً.
                </div>
              ) : (
                <div className="relative border-r border-white/10 pr-6 space-y-8 mr-2">
                  {activeEvents.map((ev, index) => (
                    <div key={index} className="relative group">
                      {/* Timeline Dot Indicator */}
                      <div className="absolute -right-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-slate-950 group-hover:scale-125 transition-transform" />
                      
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {ev.date}
                        </span>
                        <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors pt-1">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                          {ev.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Videos Panel */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Video className="text-emerald-500" size={16} />
                <span>فيديوهات وتحليلات مرئية</span>
              </h4>
              <div className="space-y-3">
                {data.videos && data.videos.length > 0 ? (
                  data.videos.map((vid, idx) => (
                    <a
                      key={idx}
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 bg-slate-950/50 hover:bg-slate-950 border border-white/[0.02] rounded-2xl group transition-all"
                    >
                      <div className="w-20 h-14 rounded-lg bg-slate-900 relative overflow-hidden shrink-0">
                        <img src={vid.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                          <Play size={16} className="text-emerald-500" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-gray-200 group-hover:text-emerald-400 transition-colors line-clamp-1">{vid.title}</span>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-1">
                          <span>مشاهدة الفيديو</span>
                          <ArrowUpRight size={10} />
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8">لا تتوفر فيديوهات حالياً.</p>
                )}
              </div>
            </div>

            {/* Photos Panel */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Image className="text-emerald-500" size={16} />
                <span>معرض الصور واللقطات حية</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {data.photos && data.photos.length > 0 ? (
                  data.photos.map((ph, idx) => (
                    <div key={idx} className="aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-white/[0.04] relative group">
                      <img src={ph} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-2.5">
                        <span className="text-[10px] text-white font-bold">لقطة حية ومباشرة</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8 col-span-2">لا تتوفر صور لقطات حالياً.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
