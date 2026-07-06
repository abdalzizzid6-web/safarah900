import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Users, Video, Newspaper, Calendar, History, ArrowUpRight, Flame, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createSlugPath } from '../../utils/slugify';

interface TeamKG {
  id: string;
  name: string;
  arabicName: string;
  latestNews: any[];
  upcomingMatches: any[];
  lastResults: any[];
  relatedPlayers: any[];
  topScorers: { name: string; goals: number; assists: number }[];
  relatedVideos: { title: string; url: string; thumbnail: string }[];
}

export default function TeamKnowledgeSection({ teamId }: { teamId: string }) {
  const [data, setData] = useState<TeamKG | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'squad' | 'videos'>('overview');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/knowledge/team/${encodeURIComponent(teamId)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load team knowledge graph:", err);
        setLoading(false);
      });
  }, [teamId]);

  if (loading) {
    return <div className="animate-pulse bg-white/5 rounded-[2rem] h-64 border border-white/5" />;
  }

  if (!data) return null;

  return (
    <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/80 rounded-[2.5rem] p-6 border border-white/5 space-y-6" style={{ direction: 'rtl' }}>
      {/* Header section with tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <BookOpen className="text-emerald-500 animate-pulse" size={20} />
          </div>
          <div>
            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider block">صافرة 90 المعرفية</span>
            <h3 className="text-base sm:text-lg font-black text-white">الشبكة المعرفية لنادي {data.arabicName}</h3>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none select-none">
          {[
            { id: 'overview', label: 'القمة والتهديف', icon: <Flame size={13} /> },
            { id: 'news', label: 'الأخبار المرتبطة', icon: <Newspaper size={13} /> },
            { id: 'squad', label: 'اللاعبين ذوي الصلة', icon: <Users size={13} /> },
            { id: 'videos', label: 'المرئيات والتحليلات', icon: <Video size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === tab.id ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[160px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Scorers */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <TrendingUp size={14} />
                <span>قائمة الهدافين وصناع اللعب</span>
              </h4>
              <div className="space-y-2.5">
                {data.topScorers && data.topScorers.length > 0 ? (
                  data.topScorers.map((sc, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-white/[0.02]">
                      <span className="text-xs font-black text-white">{sc.name}</span>
                      <div className="flex gap-4 text-[10px] font-mono text-gray-400 font-bold">
                        <span>⚽ {sc.goals} أهداف</span>
                        <span>👟 {sc.assists} حاسمة</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-4">قائمة الهدافين قيد التحديث.</p>
                )}
              </div>
            </div>

            {/* Results snapshot */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <History size={14} />
                <span>أحدث النتائج والمواجهات</span>
              </h4>
              <div className="space-y-2">
                {data.lastResults && data.lastResults.length > 0 ? (
                  data.lastResults.slice(0, 3).map((match, i) => {
                    const home = match.homeTeamName || match.homeTeam?.name || "الفريق الأول";
                    const away = match.awayTeamName || match.awayTeam?.name || "الفريق الثاني";
                    const hScore = match.homeScore !== undefined ? match.homeScore : "";
                    const aScore = match.awayScore !== undefined ? match.awayScore : "";

                    return (
                      <div key={i} className="flex justify-between items-center text-xs bg-slate-950/40 p-2.5 rounded-xl border border-white/[0.01]">
                        <span className="text-gray-300 font-bold truncate max-w-[140px]">{home} vs {away}</span>
                        <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                          {hScore} - {aScore}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 py-4">لا توجد نتائج سابقة مسجلة.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.latestNews && data.latestNews.length > 0 ? (
              data.latestNews.map((art, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-white/[0.02] p-4 rounded-2xl hover:border-emerald-500/20 transition-all group">
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">أخبار النادي</span>
                  <h4 className="text-xs font-black text-white mt-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                    {art.excerpt || art.summary || "تغطية تكتيكية شاملة لكافة تطورات ومستجدات النادي محلياً وقارياً."}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center col-span-2">لم نجد مقالات أو تقارير إخبارية مرتبطة بهذا النادي حالياً.</p>
            )}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.relatedPlayers && data.relatedPlayers.length > 0 ? (
              data.relatedPlayers.map((pl, idx) => (
                <Link
                  key={idx}
                  to={`/player/${createSlugPath(pl.name, pl.id)}`}
                  className="bg-slate-950/50 border border-white/[0.02] p-3.5 rounded-2xl text-center hover:border-emerald-500/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 mx-auto flex items-center justify-center font-bold text-emerald-500 group-hover:scale-105 transition-transform">
                    👤
                  </div>
                  <h4 className="text-xs font-black text-white mt-2 group-hover:text-emerald-400 transition-colors truncate">
                    {pl.arabicName || pl.name}
                  </h4>
                  <span className="text-[9px] text-gray-500 font-black block mt-0.5">{pl.position || "لاعب"}</span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center col-span-4">قائمة اللاعبين المرتبطين قيد التجهيز.</p>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.relatedVideos && data.relatedVideos.length > 0 ? (
              data.relatedVideos.map((vid, idx) => (
                <a
                  key={idx}
                  href={vid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-950/40 border border-white/[0.02] rounded-2xl overflow-hidden group hover:border-emerald-500/25 transition-all flex flex-col"
                >
                  <div className="aspect-video bg-slate-900 relative overflow-hidden">
                    <img src={vid.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/10 transition-all">
                      <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <Video size={16} className="text-black" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-black text-gray-200 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">{vid.title}</span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-8 text-center col-span-3">لا توجد مرئيات مرتبطة حالياً.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
