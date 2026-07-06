import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, ChevronLeft, TrendingUp, Radio, Activity, Award, 
  Info, Calendar, Flame, Shield, ArrowUp, ArrowDown, Sparkles
} from 'lucide-react';
import { worldCupService } from '../services/worldCupService';
import { Link } from 'react-router-dom';
import ImageResolver from '../components/ui/ImageResolver';

interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface TableRow {
  position: number;
  team: Team;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface Standing {
  stage: string;
  type: string;
  group: string | null;
  table: TableRow[];
}

interface LeagueInfo {
  id: number;
  name: string;
  code: string;
  emblem: string;
}

interface StandingsResponse {
  competition: LeagueInfo;
  season: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
  };
  standings: Standing[];
}

const SUPPORTED_LEAGUES = [
  { code: 'PL', name: 'الدوري الإنجليزي الممتاز', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/pwtgq11421114674.png', color: '#3d195a' },
  { code: 'PD', name: 'الدوري الإسباني - لاليغا', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/wtvrmu1421114241.png', color: '#00529f' },
  { code: 'SA', name: 'الدوري الإيطالي - سيريا آ', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/q68vpe1533033502.png', color: '#00529f' },
  { code: 'BL1', name: 'الدوري الألماني - بوندسليغا', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/vqvru11421114211.png', color: '#d3010c' },
  { code: 'FL1', name: 'الدوري الفرنسي - ليغ 1', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/wvwtq11421114321.png', color: '#dae025' },
  { code: 'CL', name: 'دوري أبطال أوروبا', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/wtvrmu1421114241.png', color: '#001e50' },
  { code: 'WC', name: 'كأس العالم FIFA 2026', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/qwtvru1421114341.png', color: '#d4af37' },
  { code: 'DED', name: 'الدوري الهولندي الممتاز', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/qwvsq11421114231.png', color: '#f06621' },
  { code: 'PPL', name: 'الدوري البرتغالي الممتاز', emblem: 'https://crests.thesportsdb.com/images/media/league/badge/vwtqu11421114511.png', color: '#01643c' },
];

export default function StandingsPage() {
  const [selectedLeague, setSelectedLeague] = useState<string>('PL');
  const [activeTab, setActiveTab] = useState<'total' | 'home' | 'away'>('total');

  const { data: data, isLoading: loading, error } = useQuery<StandingsResponse>({
    queryKey: ['standings', selectedLeague],
    queryFn: async () => {
      if (selectedLeague === 'WC') {
        const wcStandings = await worldCupService.getWorldCupStandings(2026);
        return {
          competition: { 
            id: 2000, 
            name: 'كأس العالم FIFA 2026', 
            code: 'WC', 
            emblem: 'https://crests.thesportsdb.com/images/media/league/badge/qwtvru1421114341.png' 
          },
          season: { id: 2026, startDate: '2026-06-01', endDate: '2026-07-19', currentMatchday: 1 },
          standings: wcStandings
        } as any;
      }
      const response = await axios.get(`/api/football-data/competitions/${selectedLeague}/standings`);
      if (!response.data || !response.data.standings) {
         throw new Error('لم يتم العثور على بيانات الترتيب للدوري المحدد.');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  const errorString = error ? (error as any).response?.status === 403 
    ? 'البطولة المختارة غير متوفرة ضمن الباقة المجانية لمزود البيانات.'
    : 'حدث خطأ أثناء مزامنة جدول الترتيب من الخادم الرئيسي.' : null;

  // Translate team name efficiently
  const displayTeamName = (team: Team) => {
    return worldCupService.translateTeam(team.name) || team.shortName || team.name;
  };

  // Render form items as styled circles
  const renderFormCircle = (formStr: string | null) => {
    if (!formStr) return <span className="text-gray-500 font-black">-</span>;
    
    // Accept strings list separated by commas or no separator
    const items = formStr.includes(',') ? formStr.split(',') : formStr.split('');
    
    return (
      <div className="flex gap-1 justify-center max-w-[100px] mx-auto">
        {items.slice(0, 5).map((char, index) => {
          const letter = char.trim().toUpperCase();
          let bgClass = 'bg-neutral-800 text-gray-500 border-neutral-700';
          if (letter === 'W') bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          if (letter === 'D') bgClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          if (letter === 'L') bgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          
          return (
            <span 
              key={index} 
              className={`w-4 h-4 rounded-full border text-[8px] font-black flex items-center justify-center ${bgClass}`}
            >
              {letter === 'W' ? 'ف' : letter === 'D' ? 'ت' : letter === 'L' ? 'خ' : letter}
            </span>
          );
        })}
      </div>
    );
  };

  // Check if league is Cup/Tournament format
  const isCupFormat = data?.standings && data.standings.some(st => st.group !== null);

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-[#d4af37]/30 selection:text-white" style={{ direction: 'rtl' }}>
      
      {/* Decorative Brand Header Pattern */}
      <div className="relative pt-24 pb-12 overflow-hidden border-b border-white/5 bg-gradient-to-b from-[#18150f]/20 to-transparent">
        <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-[#d4af37]/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#f3c623] border border-[#d4af37]/20 text-[10px] font-black uppercase tracking-wider">
                <Trophy size={11} className="animate-spin" style={{ animationDuration: '3s' }} />
                <span>مركز ترتيب الدوريات</span>
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-l from-white via-amber-100 to-[#d4af37] bg-clip-text text-transparent">
                جدول ترتيب البطولات الكبرى
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-medium max-w-xl">
                متابعة حية وشاملة لمراكز الأندية والمنتخبات في الدوريات والبطولات العالمية المحدثة مباشرة عبر خوادم صافرة 90.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex gap-4 p-4 rounded-3xl bg-neutral-900/40 border border-white/5 backdrop-blur-md">
              <div className="text-center px-4 border-l border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block">مزامنة البيانات</span>
                <span className="text-xs font-black text-[#f3c623] flex items-center gap-1 justify-center">
                  <Activity size={12} className="text-emerald-400 animate-pulse" />
                  <span>تلقائي 100%</span>
                </span>
              </div>
              <div className="text-center px-2 space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block">مصدر البيانات</span>
                <span className="text-xs font-black text-white font-sans uppercase">Football-Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
        
        {/* League Selector Grid */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#f3c623]" />
            <span>اختر البطولة المطلوبة:</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
            {SUPPORTED_LEAGUES.map((league) => {
              const isSelected = selectedLeague === league.code;
              return (
                <button
                  key={league.code}
                  onClick={() => setSelectedLeague(league.code)}
                  className={`relative p-3 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${
                    isSelected 
                      ? 'bg-neutral-900 border-[#d4af37] shadow-[0_5px_15px_rgba(212,175,55,0.15)]' 
                      : 'bg-neutral-900/30 border-white/5 hover:border-white/10 hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="relative w-10 h-10 flex items-center justify-center p-1 rounded-xl bg-black/40 overflow-hidden border border-white/5">
                    <ImageResolver 
                      src={league.emblem} 
                      alt={league.name} 
                      fallbackType="league"
                      className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110" 
                    />
                  </div>
                  <span className={`text-[10px] font-black leading-snug line-clamp-1 transition-colors ${
                    isSelected ? 'text-[#f3c623]' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    {league.name}
                  </span>
                  
                  {isSelected && (
                    <motion.div 
                      layoutId="leagueIndicator" 
                      className="absolute -bottom-1 left-4 right-4 h-0.5 bg-[#d4af37] rounded-full" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Warning Message */}
        {errorString && (
          <div className="mb-8 p-4 rounded-2xl bg-[#18150f] border border-[#d4af37]/20 text-[#f3c623] flex items-center gap-3">
            <Info size={16} className="shrink-0 text-[#f3c623]" />
            <div className="text-[11px] font-bold leading-relaxed">
              <span>{errorString}</span>
            </div>
          </div>
        )}

        {/* LOADING SHIMMER */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="space-y-4 py-12 animate-pulse">
              <div className="h-10 w-48 bg-neutral-900 rounded-xl" />
              <div className="h-[400px] bg-neutral-900 rounded-3xl border border-white/5" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Season Metadata Header */}
              {data && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-900/30 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 p-1.5 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-center">
                      <ImageResolver 
                        src={data.competition.emblem} 
                        alt={data.competition.name} 
                        fallbackType="league"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-md font-black text-white">{data.competition.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-bold">
                        <span>موسم الكبار: {data.season.startDate.split('-')[0]} - {data.season.endDate.split('-')[0]}</span>
                        <span>•</span>
                        <span className="text-[#f3c623]">الجولة الحالية: #{data.season.currentMatchday || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Home/Away Filters (Available ONLY for standard leagues) */}
                  {!isCupFormat && (
                    <div className="flex gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5">
                      {(['total', 'home', 'away'] as const).map((tab) => {
                        const labels = { total: 'الترتيب العام', home: 'داخل الأرض', away: 'خارج الأرض' };
                        const isActive = activeTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => {
                              setActiveTab(tab);
                              // Simple query simulation
                              const indexMap = { total: 0, home: 1, away: 2 };
                              const standingIndex = indexMap[tab] || 0;
                              // If api doesn't supply home/away entries, warn gracefully
                              if (data?.standings && !data.standings[standingIndex]) {
                                alert("المستعرض يعرض الترتيب الإجمالي نيابة عن الترتيب الفرعي المختار لعدم دعم خادم الباقة المجانية لتجزئة ملاعب الأرض حالياً.");
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                              isActive 
                                ? 'bg-[#d4af37] text-black border border-amber-300' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STANDINGS RENDER CONTAINER */}
              {data?.standings && data.standings.length > 0 ? (
                <div className="space-y-6">
                  {/* If Cup format, we have multiple group stages */}
                  {isCupFormat ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.isArray(data.standings) && data.standings.map((groupStanding, gIdx) => {
                        const groupLabel = groupStanding.group
                          ? groupStanding.group.replace('GROUP_', 'المجموعة ').replace('_', ' ')
                          : `المجموعة ${gIdx + 1}`;
                          
                        return (
                          <div 
                            key={gIdx} 
                            className="bg-neutral-900/40 p-5 rounded-3xl border border-[#d4af37]/10 space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <h4 className="text-xs font-black text-[#f3c623] flex items-center gap-1.5">
                                <Award size={14} className="text-[#f3c623]" />
                                <span>{groupLabel}</span>
                              </h4>
                              <span className="text-[9px] text-gray-500 font-bold">مجموع الترتيب لعام 2026</span>
                            </div>

                            <div className="overflow-x-auto scrollbar-thin">
                              <table className="w-full text-right border-collapse text-[10px] font-bold">
                                <thead>
                                  <tr className="text-gray-500 border-b border-white/5 pb-2">
                                    <th className="py-2 text-center w-10">المركز</th>
                                    <th className="py-2">المنتخب / الفريق</th>
                                    <th className="py-2 text-center">لعب</th>
                                    <th className="py-2 text-center">فوز</th>
                                    <th className="py-2 text-center">تعادل</th>
                                    <th className="py-2 text-center">خسارة</th>
                                    <th className="py-2 text-center">نقاط</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(groupStanding.table) && groupStanding.table.map((row, rIdx) => {
                                    // Highlight top two positions for tournaments usually progressing
                                    const progressHighlight = row.position <= 2;
                                    return (
                                      <tr 
                                        key={row.team.id || rIdx}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                                      >
                                        <td className="py-3 text-center">
                                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${
                                            progressHighlight 
                                              ? 'bg-amber-500/15 text-[#f3c623] border border-amber-500/20' 
                                              : 'bg-neutral-800 text-gray-400'
                                          }`}>
                                            {row.position}
                                          </span>
                                        </td>
                                        <td className="py-3">
                                          <Link 
                                            to={`/team/${row.team.id}`}
                                            className="flex items-center gap-2 group/team"
                                          >
                                            <ImageResolver 
                                              src={row.team.crest} 
                                              alt={row.team.name} 
                                              fallbackType="team"
                                              fallbackText={row.team.name}
                                              tla={row.team.tla}
                                              className="w-4.5 h-4.5 object-contain"
                                            />
                                            <span className="group-hover/team:text-[#f3c623] transition-colors leading-none">
                                              {displayTeamName(row.team)}
                                            </span>
                                          </Link>
                                        </td>
                                        <td className="py-3 text-center font-mono">{row.playedGames}</td>
                                        <td className="py-3 text-center font-mono text-gray-300">{row.won}</td>
                                        <td className="py-3 text-center font-mono text-gray-300">{row.draw}</td>
                                        <td className="py-3 text-center font-mono text-gray-300">{row.lost}</td>
                                        <td className="py-3 text-center text-[#f3c623] font-black font-mono">{row.points}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* If Standard League format, single main continuous table */
                    <div className="bg-neutral-900/40 rounded-3xl border border-[#d4af37]/15 overflow-hidden shadow-2xl">
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-right border-collapse text-[10.5px] font-bold">
                          <thead>
                            <tr className="text-gray-500 border-b border-white/5 bg-neutral-950/40 text-xs">
                              <th className="p-4 text-center w-12">#</th>
                              <th className="p-4">الفريق</th>
                              <th className="p-4 text-center">لعب</th>
                              <th className="p-4 text-center">فاز</th>
                              <th className="p-4 text-center">تعادل</th>
                              <th className="p-4 text-center">خسر</th>
                              <th className="p-4 text-center hidden md:table-cell">له</th>
                              <th className="p-4 text-center hidden md:table-cell">عليه</th>
                              <th className="p-4 text-center">الفارق</th>
                              <th className="p-4 text-center">النقاط</th>
                              <th className="p-4 text-center">آخر ٥ نتائج</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(data.standings[0]?.table) && data.standings[0].table.map((row, rIdx) => {
                              // Classification badges for top teams
                              const position = row.position;
                              
                              let positionBadgeClass = 'bg-neutral-800 text-gray-400';
                              if (position === 1) positionBadgeClass = 'bg-[#d4af37]/15 text-[#f3c623] border border-[#d4af37]/20';
                              else if (position <= 3) positionBadgeClass = 'bg-amber-500/10 text-amber-300 border border-amber-500/10';
                              else if (position === 4) positionBadgeClass = 'bg-amber-500/10 text-amber-300/80 border border-amber-500/10';
                              else if (position >= (data.standings[0].table.length - 2)) positionBadgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/10';

                              return (
                                <tr 
                                  key={row.team.id || rIdx}
                                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                                >
                                  <td className="p-4 text-center">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${positionBadgeClass}`}>
                                      {position}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <Link 
                                      to={`/team/${row.team.id}`}
                                      className="flex items-center gap-3.5 group/team"
                                    >
                                      <ImageResolver 
                                        src={row.team.crest} 
                                        alt={row.team.name} 
                                        fallbackType="team"
                                        fallbackText={row.team.name}
                                        tla={row.team.tla}
                                        className="w-5.5 h-5.5 object-contain"
                                      />
                                      <div className="flex flex-col">
                                        <span className="group-hover/team:text-[#f3c623] transition-colors text-white font-heavy text-xs">
                                          {displayTeamName(row.team)}
                                        </span>
                                        <span className="text-[8.5px] text-gray-500 uppercase tracking-widest font-mono font-bold mt-0.5">{row.team.tla}</span>
                                      </div>
                                    </Link>
                                  </td>
                                  <td className="p-4 text-center font-mono text-gray-200">{row.playedGames}</td>
                                  <td className="p-4 text-center font-mono text-gray-300">{row.won}</td>
                                  <td className="p-4 text-center font-mono text-gray-300">{row.draw}</td>
                                  <td className="p-4 text-center font-mono text-gray-300">{row.lost}</td>
                                  <td className="p-4 text-center font-mono text-gray-400 hidden md:table-cell">{row.goalsFor}</td>
                                  <td className="p-4 text-center font-mono text-gray-400 hidden md:table-cell">{row.goalsAgainst}</td>
                                  <td className="p-4 text-center font-mono text-gray-300">
                                    <span className={row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-rose-400' : ''}>
                                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center text-lg text-[#f3c623] font-black font-mono">
                                    {row.points}
                                  </td>
                                  <td className="p-4 text-center">
                                    {renderFormCircle(row.form)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Descriptive Footer Legends */}
                      <div className="bg-neutral-950/40 p-4 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-[9px] text-gray-500">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]/25 border border-[#d4af37]/35 inline-block" />
                            <span>بطل المسابقة + المركز الأول</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block" />
                            <span>المراكز المؤهلة للمشاركة القارية (دوري أبطال أوروبا)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 inline-block" />
                            <span>مراكز الهبوط والتهديد</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar size={10} />
                          <span>تحديث مستمر للنتائج 2026/06</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-white/5 space-y-4">
                  <Trophy size={48} className="mx-auto text-gray-600 animate-pulse" />
                  <h3 className="text-sm font-black">لا تتواجد بيانات ترتيب لهذه البطولة حالياً</h3>
                  <p className="text-xs text-gray-400">عذراً، لم يتمكن خادم الرياضة من قراءة الجدول. يرجى تجربة بطولة أخرى.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
