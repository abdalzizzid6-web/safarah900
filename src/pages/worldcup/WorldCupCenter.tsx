import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ImageResolver from '../../components/ui/ImageResolver';
import { 
  Trophy, Calendar, Users, Award, BarChart3, Clock, Compass, Activity, 
  Search, RefreshCw, AlertTriangle, AlertCircle, Play, Globe, Flame, Shield, MapPin, Sparkles, Settings, CheckCircle, Zap
} from 'lucide-react';

import { 
  worldCupService, 
  WCMatch, 
  StandingGroup, 
  WCTeam, 
  ScorerEntry,
  registerMetricsListener,
  unregisterMetricsListener,
  setForceBackupMode
} from '../../services/worldCupService';
import { UserRole } from '../../types';

// Child Overlays
import WorldCupMatches from '../../components/WorldCupMatches';
import WCMatchDetail from './WCMatchDetail';
import WCTeamDetail from './WCTeamDetail';
import WCPlayerDetail from './WCPlayerDetail';

// Child Pages/Sections
import { useAuth } from '../../context/AuthContext';
import WcNews from '../../components/worldcup/WcNews';
import WcBracket from '../../components/worldcup/WcBracket';
import WcStats from '../../components/worldcup/WcStats';
import WcAdmin from '../../components/worldcup/WcAdmin';
import SEO from '../../components/SEO';

export default function WorldCupCenter() {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary active tab
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Modal / overlay identifiers from query parameters
  const activeMatchId = searchParams.get('matchId') || null;
  const activeTeamId = searchParams.get('teamId') || null;
  const activePlayerId = searchParams.get('playerId') || null;

  // Selected World Cup Year representation (defaults to 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // React state for real API data
  const [matches, setMatches] = useState<WCMatch[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingGroup[]>([]);
  const [teams, setTeams] = useState<WCTeam[]>([]);
  const [scorers, setScorers] = useState<ScorerEntry[]>([]);
  
  // Loader states
  const [loading, setLoading] = useState<boolean>(true);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filters & searches
  const [matchFilter, setMatchFilter] = useState<'all' | 'today' | 'live' | 'upcoming' | 'finished'>('all');
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Countdown clock state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ready: false });

  // Fetch all real data from openfootball & Firestore overrides
  const fetchAllData = async (silent = false, ignoreCache = false) => {
    if (!silent) setLoading(true);
    setErrorString(null);
    try {
      const [matchesRes, standingsRes, teamsRes, scorersRes] = await Promise.all([
        worldCupService.getWorldCupMatches(selectedYear, ignoreCache),
        worldCupService.getWorldCupStandings(selectedYear),
        worldCupService.getWorldCupTeams(selectedYear),
        worldCupService.getWorldCupScorers(selectedYear)
      ]);

      setMatches(Array.isArray(matchesRes) ? matchesRes : []);
      console.log("Matches loaded:", matchesRes);
      setStandings(Array.isArray(standingsRes) ? standingsRes : []);
      setTeams(Array.isArray(teamsRes) ? teamsRes : []);
      setScorers(Array.isArray(scorersRes) ? scorersRes : []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Error loading Football data:", err);
      setErrorString("لا توجد بيانات متاحة حالياً. جاري تحديث بيانات كأس العالم.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedYear]);

  // System Health Telemetry state synchronizer
  useEffect(() => {
    registerMetricsListener((updatedMetrics) => {
      setMetrics(updatedMetrics);
    });
    return () => {
      unregisterMetricsListener();
    };
  }, []);

  const runDiagnosticTest = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticFeedback(null);
    try {
      const success = await worldCupService.runConnectionDiagnostic();
      if (success) {
        setDiagnosticFeedback("🟢 الاتصال بالخادم الرئيسي سليم تماماً! استجابة سريعة للقنوات.");
      } else {
        setDiagnosticFeedback("⚠️ تم كشف قصور في الاستجابة. جرى تفعيل وضع البيانات الاحتياطية (Offline Fallback) تلقائياً بنجاح.");
      }
    } catch (err: any) {
      setDiagnosticFeedback("🔴 عجز في الاتصال: خطأ غير متوقع بالشبكة.");
    } finally {
      setIsDiagnosticRunning(false);
      fetchAllData(true, true);
    }
  };

  // Real-time live update loop
  useEffect(() => {
    const liveUpdateInterval = setInterval(() => {
      const hasLiveMatches = matches.some(m => ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status));
      if (hasLiveMatches) {
        fetchAllData(true, true);
      }
    }, 30000); // 30 seconds
    return () => clearInterval(liveUpdateInterval);
  }, [matches]);

  // Countdown calculations
  useEffect(() => {
    const openingDate = new Date('2026-06-11T20:00:00Z').getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = openingDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, ready: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, ready: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const updateTab = (tabName: string) => {
    setSearchParams(prev => {
      prev.set('tab', tabName);
      return prev;
    });
  };

  const openMatchDetail = (id: string | number) => {
    setSearchParams(prev => {
      prev.set('matchId', String(id));
      return prev;
    });
  };

  const openTeamDetail = (id: string | number) => {
    setSearchParams(prev => {
      prev.set('teamId', String(id));
      return prev;
    });
  };

  const openPlayerDetail = (id: string | number) => {
    setSearchParams(prev => {
      prev.set('playerId', String(id));
      return prev;
    });
  };

  const closeOverlays = () => {
    setSearchParams(prev => {
      prev.delete('matchId');
      prev.delete('teamId');
      prev.delete('playerId');
      return prev;
    });
  };

  // Filter matches based on search & category
  const filteredMatches = matches;

  // Filter teams based on search query
  const filteredTeamsList = useMemo(() => {
    return teams.filter(t => {
      if (!t?.name) return false;
      const arabicName = worldCupService.translateTeam(t.name);
      return arabicName.includes(teamSearchQuery) || 
             (t.name || '').toLowerCase().includes(teamSearchQuery.toLowerCase());
    });
  }, [teams, teamSearchQuery]);

  // General metrics calculations
  const tournamentStatsSummary = useMemo(() => {
    const total = matches.length;
    const played = matches.filter(m => ['FINISHED', 'FT'].includes(m.status)).length;
    let totalGoals = 0;
    matches.forEach(m => {
      if (m.score?.fullTime?.home !== null && m.score?.fullTime?.home !== undefined) {
        totalGoals += m.score.fullTime.home;
      }
      if (m.score?.fullTime?.away !== null && m.score?.fullTime?.away !== undefined) {
        totalGoals += m.score.fullTime.away;
      }
    });
    const avgGoals = played > 0 ? (totalGoals / played).toFixed(2) : "0.00";

    return { total, played, goals: totalGoals, avg: avgGoals };
  }, [matches]);

  const renderSkeleton = () => (
    <div className="space-y-8 pt-6" dir="rtl">
      {/* 3 Columns Top Stats Summary Badges Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "إجمالي المباريات المتوقعة", icon: Trophy, color: "from-[#d4af37]/10" },
          { label: "المباريات المكتملة", icon: Activity, color: "from-[#10b981]/10" },
          { label: "معدل التهديف العام", icon: Flame, color: "from-[#ef4444]/10" }
        ].map((item, i) => (
          <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${item.color} to-transparent border border-white/5 p-4.5 rounded-2xl flex items-center justify-between animate-pulse`}>
            <div className="space-y-2 text-right">
              <span className="text-[10px] font-black text-gray-500 block">{item.label}</span>
              <div className="h-6 w-16 bg-white/10 rounded-md" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <item.icon className="text-gray-400 opacity-60" size={18} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area: Tab Simulated Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main big featured card layout placeholder */}
          <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/20 bg-gradient-to-br from-[#0c0c0e] to-[#15120c] p-6 flex flex-col justify-between min-h-[180px] space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-white/10 rounded-lg" />
              <div className="h-4.5 bg-[#d4af37]/20 w-20 rounded-full" />
            </div>
            
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/10 rounded-full border border-white/5" />
                <div className="h-3.5 w-20 bg-white/10 rounded" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-4 w-12 bg-white/5 rounded" />
                <div className="h-7 w-20 bg-[#d4af37]/10 rounded-lg" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/10 rounded-full border border-white/5" />
                <div className="h-3.5 w-20 bg-white/10 rounded" />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-3.5 text-[10px] text-gray-500">
              <div className="h-3 h-3 w-28 bg-white/5 rounded" />
              <div className="h-3 h-3 w-28 bg-white/5 rounded" />
            </div>
          </div>

          {/* Sub Matches Grid Simulation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-2.5 h-5 bg-[#d4af37] rounded-full" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-black/40 border border-white/5 rounded-[22px] p-4.5 space-y-4 animate-pulse hover:border-[#d4af37]/10 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 bg-white/15 rounded" />
                    <div className="h-3 w-12 bg-white/5 rounded" />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white/10 rounded-full" />
                      <div className="h-3 w-16 bg-white/10 rounded" />
                    </div>
                    <div className="h-5 w-12 bg-white/10 rounded-lg text-center" />
                    <div className="flex items-center gap-2 justify-end">
                      <div className="h-3 w-16 bg-white/10 rounded" />
                      <div className="w-6 h-6 bg-white/10 rounded-full" />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[9px]">
                    <div className="h-3 w-14 bg-white/5 rounded" />
                    <div className="h-3 w-16 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets Area: Simulated standings & top teams */}
        <div className="space-y-6">
          <div className="bg-[#0b0b0d] border border-white/5 p-5 rounded-[28px] space-y-4.5 animate-pulse">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="h-4 w-28 bg-white/10 rounded-md" />
              <div className="h-3 w-14 bg-white/5 rounded" />
            </div>

            <div className="space-y-3.5">
              {[1, 2, 3, 4, 5].map((teamIdx) => (
                <div key={teamIdx} className="flex items-center justify-between pb-2.5 border-b border-white/[0.03] last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-white/15 rounded flex items-center justify-center" />
                    <div className="w-7 h-7 bg-white/10 rounded-lg" />
                    <div className="h-3.5 w-20 bg-white/10 rounded" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <div className="w-6 h-4 bg-white/5 rounded" />
                    <div className="w-4 h-4 bg-[#d4af37]/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0b0b0d] border border-white/5 p-5 rounded-[22px] text-center space-y-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/10 mx-auto" />
            <div className="h-3.5 w-32 bg-white/10 mx-auto rounded" />
            <div className="h-3 w-48 bg-white/5 mx-auto rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans pb-28 pt-8 select-none" dir="rtl">
      <SEO 
        title={selectedYear === 2026 ? "مركز كأس العالم 2026 | تغطية حصرية" : `أرشيف كأس العالم ${selectedYear} | صافرة 90`}
        description={`التغطية الأكثر شمولاً لمونديال ${selectedYear}. جداول المباريات، نتائج حية، ترتيب المجموعات، وإحصائيات المنتخبات لحظة بلحظة.`}
        ogType="website"
        ogImage="/og-worldcup.jpg"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        
        {/* PREMIUM GOLD & BLACK BRAND HERO BANNER */}
        <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-2 border-[#d4af37]/20 bg-gradient-to-tr from-[#0a0a0c] via-[#15120c] to-[#0a0a0e] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Subtle gold lights background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-4 text-right md:w-2/3 z-10">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#f3c623] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f3c623] bg-[#d4af37]/15 border border-[#d4af37]/35 px-2.5 py-1 rounded-full">
                البيانات الحصرية والموثقة - wcup2026.org
              </span>
            </div>
            
            <h1 className="text-3xl md:text-6xl font-black tracking-tight leading-tight text-white">
              مونديال كأس العالم <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#d4af37] via-[#f3c623] to-[#e5c158] font-black drop-shadow-[0_2px_15px_rgba(243,198,35,0.4)]">{selectedYear}</span>
            </h1>
            
            <p className="text-xs md:text-sm text-gray-400 font-bold max-w-xl leading-relaxed">
              تغطية مباشرة، وجداول تفصيلية وقنوات بث مباشر على مدار الساعة لباقة الـ 104 مباريات بمشاركة 48 منتخباً من قلب أمريكا والمكسيك وكندا.
            </p>

            {/* Live Countdown Clock */}
            {selectedYear !== 2026 ? (
              <div className="flex items-center gap-2 text-[#f3c623] bg-[#d4af37]/10 border border-[#d4af37]/20 px-4 py-2 rounded-2xl text-xs font-black w-max">
                <Trophy size={14} className="text-[#f3c623]" />
                <span>أرشيف كأس العالم الكامل والنتائج الموثقة تاريخياً من OpenFootball</span>
              </div>
            ) : countdown.ready ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-2xl text-xs font-black w-max border border-emerald-500/20">
                <Flame size={14} className="animate-pulse" />
                <span>انطلقت الإثارة والمباريات الحية لكأس العالم 2026 حالياً! تصفح طيران الأهداف</span>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-black block">العد التنازلي لركلة البداية التاريخية لمونديال 2026:</span>
                <div className="flex gap-2">
                  {[
                    { val: countdown.days, label: "يوم" },
                    { val: countdown.hours, label: "ساعة" },
                    { val: countdown.minutes, label: "دقيقة" },
                    { val: countdown.seconds, label: "ثانية" }
                  ].map((unit, uIdx) => (
                    <div key={uIdx} className="p-3 bg-black/60 border border-[#d4af37]/20 rounded-2xl min-w-[65px] text-center">
                      <strong className="text-lg font-black font-mono text-[#f3c623] block leading-none">{unit.val}</strong>
                      <span className="text-[8px] text-gray-500 font-bold">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative md:w-1/3 flex justify-center items-center z-10">
            <div className="w-44 h-44 bg-gradient-to-br from-[#d4af37]/30 to-transparent border border-[#d4af37]/40 rounded-full flex items-center justify-center p-3 animate-pulse">
              <Trophy size={96} className="text-[#f3c623] drop-shadow-[0_4px_25px_rgba(243,198,35,0.6)]" />
            </div>
          </div>
        </div>

        {/* YEAR SELECTION CONTROL AND MANUAL SYNC */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d0d0f] border border-white/5 p-4 rounded-3xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400">تصفح تاريخ البطولة:</span>
            <div className="flex gap-1.5 overflow-x-auto p-1.5 scrollbar-none">
              {[2026, 2022, 2018, 2014].map(yr => (
                <button
                  key={yr}
                  onClick={() => { setSelectedYear(yr); updateTab('overview'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    selectedYear === yr 
                      ? 'bg-[#d4af37] text-black font-extrabold border border-amber-300'
                      : 'bg-black text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {yr} {yr === 2026 ? '(حالي)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
              <span>آخر مزامنة: {lastRefreshed.toLocaleTimeString('ar-SA')}</span>
            </span>
            <button 
              onClick={() => fetchAllData(false)}
              className="px-3 py-1.5 bg-black hover:bg-neutral-900 border border-[#d4af37]/20 rounded-xl text-xs font-black text-[#f3c623] flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>تحديث البيانات الثابتة</span>
            </button>
          </div>
        </div>

        {/* PRIMARY WC NAVIGATION TABS */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#d4af37]/10" dir="rtl">
          {[
            { id: 'overview', icon: Trophy, label: 'الرئيسية wcup' },
            { id: 'matches', icon: Calendar, label: 'المباريات' },
            { id: 'groups', icon: Users, label: 'المجموعات' },
            { id: 'teams', icon: Shield, label: 'المنتخبات' },
            { id: 'bracket', icon: Compass, label: 'شجرة البطولة' },
            { id: 'statistics', icon: BarChart3, label: 'الإحصائيات' },
            { id: 'news', icon: Award, label: 'الأخبار الحصرية' },
            (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) ? { id: 'admin', icon: Settings, label: 'لوحة التحكم' } : null
          ].filter(Boolean).map((tab: any) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateTab(tab.id)}
                className={`flex items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                  isActive 
                    ? 'bg-[#d4af37] text-black border-amber-300 shadow-xl font-extrabold transform scale-102'
                    : 'bg-[#0d0d0f] text-gray-400 hover:text-white hover:bg-[#121215] border-white/5'
                }`}
              >
                <tab.icon size={13} className={isActive ? 'text-black' : 'text-[#f3c623]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ERROR STATUS HANDLER */}
        {errorString && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-start gap-3 shadow-lg">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <strong className="block font-black">خطأ في جلب البيانات:</strong>
              <p className="text-[11px] text-gray-300 leading-normal font-bold">{errorString}</p>
            </div>
          </div>
        )}

        {/* DYNAMIC TRANSITION BODY WITH ANIMATION */}
        <div className="min-h-[450px]">
          {loading ? renderSkeleton() : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                key={activeTab}
              >
                {/* 1. OVERVIEW (HOME) */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Matches quick list & metrics */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex justify-between items-center bg-black/40 border-b border-white/5 pb-2">
                        <h3 className="text-sm font-black text-[#f3c623] flex items-center gap-1.5">
                          <Clock size={15} />
                          مباريات وقصص جارية أو قريبة
                        </h3>
                        <button onClick={() => updateTab('matches')} className="text-[10px] text-[#f3c623] font-bold">عرض الجدول الكلي</button>
                      </div>

                      {matches.length === 0 ? (
                        <div className="text-center py-12 rounded-3xl border border-dashed border-white/5 bg-black/40">
                          <AlertCircle size={32} className="mx-auto text-gray-600 mb-2" />
                          <p className="text-xs text-gray-400 font-bold">لا يوجد مباريات مسجلة حالياً لعام {selectedYear}.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3.5">
                          {matches.slice(0, 5).map(m => {
                            const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status);
                            const isFinished = ['FINISHED', 'FT'].includes(m.status);
                            return (
                              <div
                                key={m.id}
                                onClick={() => openMatchDetail(m.id)}
                                className="group p-4 bg-[#0d0d0f] hover:bg-[#121215] border border-white/5 hover:border-[#d4af37]/30 rounded-3xl flex items-center justify-between gap-4 transition-all cursor-pointer shadow-md"
                              >
                                <div className="flex items-center gap-3 w-1/3">
                                  <ImageResolver 
                                    src={m.homeTeam.crest} 
                                    fallbackType="team"
                                    fallbackText={m.homeTeam.name}
                                    className="w-8 h-8 object-contain rounded bg-black border border-white/5 p-1" 
                                    alt="" 
                                  />
                                  <span className="text-xs font-black text-white group-hover:text-[#f3c623] transition-colors truncate">{worldCupService.translateTeam(m.homeTeam.name)}</span>
                                </div>

                                <div className="flex flex-col items-center justify-center w-1/3 text-center">
                                  {isLive || isFinished ? (
                                    <div className="space-y-1">
                                      <div className="text-base font-black font-mono text-[#f3c623] bg-[#d4af37]/10 border border-[#d4af37]/20 px-3.5 py-0.5 rounded-xl">
                                        {m.score.fullTime.home} - {m.score.fullTime.away}
                                      </div>
                                      <span className={`text-[8px] flex items-center gap-1 px-1.5 py-0.5 rounded-full font-black w-max mx-auto ${
                                        isLive ? 'bg-red-500/15 text-red-500 animate-pulse' : 'bg-white/5 text-gray-400'
                                      }`}>
                                        <Clock size={8} />
                                        <span>{worldCupService.translateStatus(m.status)}</span>
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <span className="font-mono font-black text-white text-xs bg-white/5 rounded-lg px-2 py-0.5">
                                        {new Date(m.utcDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <span className="text-[8px] text-gray-500 font-bold block">
                                        {new Date(m.utcDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-end gap-3 w-1/3">
                                  <span className="text-xs font-black text-white group-hover:text-[#f3c623] transition-colors truncate">{worldCupService.translateTeam(m.awayTeam.name)}</span>
                                  <ImageResolver 
                                    src={m.awayTeam.crest} 
                                    fallbackType="team"
                                    fallbackText={m.awayTeam.name}
                                    className="w-8 h-8 object-contain rounded bg-black border border-white/5 p-1" 
                                    alt="" 
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Stats Overview Bento box */}
                      <div className="p-5 rounded-3xl border border-white/5 bg-[#0d0d0f] space-y-4 shadow-xl">
                        <div className="flex items-center gap-2 text-[#f3c623]">
                          <Sparkles size={16} />
                          <h4 className="text-xs font-black uppercase text-white">إحصائيات الدورة الاستثنائية</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-black border border-white/5 rounded-2xl">
                            <span className="text-[9px] text-gray-500 font-bold block">المباريات المقررة</span>
                            <strong className="text-lg font-black text-white font-mono">{tournamentStatsSummary.total}</strong>
                          </div>
                          <div className="p-4 bg-black border border-white/5 rounded-2xl">
                            <span className="text-[9px] text-gray-500 font-bold block">المكتملة حياً</span>
                            <strong className="text-lg font-black text-white font-mono">{tournamentStatsSummary.played}</strong>
                          </div>
                          <div className="p-4 bg-black border border-[#d4af37]/20 rounded-2xl">
                            <span className="text-[9px] text-gray-500 font-bold block text-[#f3c623]">إجمالي أهداف الدورة</span>
                            <strong className="text-lg font-black text-[#f3c623] font-mono">{tournamentStatsSummary.goals}</strong>
                          </div>
                          <div className="p-4 bg-black border border-white/5 rounded-2xl">
                            <span className="text-[9px] text-gray-500 font-bold block">معدل التهديف</span>
                            <strong className="text-lg font-black text-emerald-400 font-mono">{tournamentStatsSummary.avg}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Branding profile, links and fast facts */}
                    <div className="space-y-6">
                      <div className="p-6 rounded-[32px] border border-[#d4af37]/20 bg-gradient-to-b from-[#18150f] to-transparent space-y-4 shadow-xl">
                        <h4 className="text-sm font-black text-white">بوابة وورلد كاب 2026</h4>
                        <p className="text-xs text-gray-400 font-bold leading-normal">
                          موقع wcup2026.org يؤمن أفضل المخططات والأحكام للأعضاء الموالين لمستجدات المونديال الأغلى.
                        </p>
                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400">نظام المنافسة:</span>
                            <span className="text-white">48 منتخباً (12 مجموعة)</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400">إجمالي اللقاءات:</span>
                            <span className="text-[#f3c623]">104 لقاء كروي</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-400">بلاد الاستضافة:</span>
                            <span className="text-white">كندا - المكسيك - أمريكا</span>
                          </div>
                        </div>
                      </div>

                      {/* SYSTEM HEALTH MONITOR - STABLE EDITION */}
                      <div className="p-6 rounded-[32px] border border-emerald-500/25 bg-emerald-950/20 space-y-4 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none blur-2xl opacity-10 bg-emerald-400" />

                        <div className="flex items-center justify-between z-10 relative">
                          <div className="flex items-center gap-3">
                            {metrics?.activeSource === 'PRIMARY_API' ? (
                              <Activity className="text-emerald-400" size={17} />
                            ) : (
                              <Shield className="text-[#f3c623]" size={17} />
                            )}
                            <h4 className="text-xs font-black uppercase text-white font-sans">حالة مصدر البيانات</h4>
                          </div>
                          
                          <span className={`text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            metrics?.activeSource === 'PRIMARY_API' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {metrics?.activeSource === 'PRIMARY_API' ? 'بيانات حية مباشرة' : 'نسخة احتياطية مستقرة'}
                          </span>
                        </div>

                        <div className="space-y-2 text-[10px] font-bold z-10 relative">
                          <div className="flex justify-between items-center text-gray-400">
                            <span>القناة النشطة:</span>
                            <span className={`font-black ${metrics?.activeSource === 'PRIMARY_API' ? 'text-emerald-400' : 'text-[#f3c623]'}`}>
                              {metrics?.activeSource === 'PRIMARY_API' 
                                ? 'Football-Data Real-time Sync' 
                                : (metrics?.forceBackupMode ? 'المصدر الحصري الثابت (Force Backup)' : 'خادم احتياطي ثابت (CDN Fallback)')}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-gray-400">
                            <span>سرعة الاستجابة:</span>
                            <span className="font-mono text-white text-right" dir="ltr">
                              {metrics?.lastLatencyMs || 0}ms {metrics?.lastLatencyMs < 50 ? '(Ultra Fast)' : ''}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-gray-400">
                            <span>حالة الخدمة:</span>
                            <span className={metrics?.currentStatus === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}>
                              {metrics?.currentStatus === 'HEALTHY' ? 'نشط وصحي ✓' : 'أداء منخفض (Fallback Active)'}
                            </span>
                          </div>
                        </div>

                          <div className="p-3 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between gap-2 z-10 relative">
                            <div className="space-y-1 text-right w-full">
                              <span className="text-[9px] font-black text-white block">وضع التزامن والبيانات الحقيقية</span>
                              <button 
                                onClick={runDiagnosticTest}
                                disabled={isDiagnosticRunning}
                                className="w-full mt-1.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] text-gray-300 font-black transition-all flex items-center justify-center gap-2"
                              >
                                {isDiagnosticRunning ? (
                                  <RefreshCw size={10} className="animate-spin" />
                                ) : (
                                  <Activity size={10} />
                                )}
                                {isDiagnosticRunning ? 'جاري فحص القنوات...' : 'فحص جودة الاتصال وتحديث المصادر'}
                              </button>
                              {diagnosticFeedback && (
                                <span className="text-[8px] text-emerald-400 font-bold block mt-1 animate-pulse">{diagnosticFeedback}</span>
                              )}
                            </div>
                          </div>
                      </div>

                      {/* Fast Live Stream banner */}
                      <div className="p-5 rounded-3xl bg-black border border-[#d4af37]/30 text-center space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-full pointer-events-none blur-xl" />
                        <span className="text-[8px] bg-red-500 text-white font-black px-2 py-0.5 rounded uppercase block w-max mx-auto animate-pulse">مباشر الآن ⬤</span>
                        <h5 className="text-xs font-black text-white">البث المباشر وبوابة الاستوديو الرقمي مجاناً</h5>
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed">تابع كل مباراة مع سيرفر قنوات البث الحصرية التابعة لإشراف المنصة.</p>
                        <button onClick={() => updateTab('news')} className="w-full py-2 bg-[#d4af37] hover:bg-[#f3c623] text-black text-xs font-black rounded-xl transition-all">الأخبار والتحليلات</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MATCHES SCHEDULE */}
                {activeTab === 'matches' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-4">
                      {/* Search box */}
                      <div className="relative w-full md:w-96">
                        <input
                          type="text"
                          placeholder="ابحث عن منتخب: السعودية، مصر..."
                          value={matchSearchQuery}
                          onChange={e => setMatchSearchQuery(e.target.value)}
                          className="w-full bg-[#0d0d0f] border border-white/5 rounded-2xl py-2 px-4 pr-10 text-xs text-white focus:border-[#d4af37]/40 outline-none"
                        />
                        <Search size={15} className="absolute left-3.5 top-3 text-gray-500" />
                      </div>

                      {/* Filters */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'all', label: 'الكل' },
                          { id: 'live', label: 'مباشر ⬤' },
                          { id: 'upcoming', label: 'قادمة' },
                          { id: 'finished', label: 'انتهت' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setMatchFilter(f.id as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                              matchFilter === f.id 
                                ? 'bg-[#d4af37] text-black border border-amber-300'
                                : 'bg-[#0d0d0f] text-gray-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredMatches.length === 0 ? (
                      <div className="text-center py-12 rounded-3xl border border-dashed border-white/5 bg-black/40">
                        <AlertCircle className="mx-auto text-gray-600 mb-2" size={32} />
                        <p className="text-xs text-gray-400 font-bold">لم يسفر البحث عن أية مباريات مطابقة للفلتر.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredMatches.map(m => {
                          const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status);
                          const isFinished = ['FINISHED', 'FT'].includes(m.status);
                          return (
                            <motion.div
                              layout
                              key={m.id}
                              onClick={() => openMatchDetail(m.id)}
                              className="group p-5 bg-[#0a0a0c] hover:bg-[#121215] border border-white/5 hover:border-[#d4af37]/30 rounded-[28px] space-y-4 cursor-pointer transition-all shadow-md flex flex-col justify-between"
                            >
                              <div className="flex justify-between items-center text-[10px] text-gray-500 font-black">
                                <span className="bg-white/5 text-gray-400 px-3 py-0.5 rounded-full">{worldCupService.translateStage(m.stage)}</span>
                                {m.group && <span className="text-[#f3c623]">{m.group.replace('GROUP_', 'المجموعة ')}</span>}
                              </div>

                              <div className="flex justify-between items-center py-2.5">
                                <div className="flex items-center gap-3 w-5/12">
                                  <ImageResolver 
                                    src={m.homeTeam.crest} 
                                    fallbackType="team"
                                    fallbackText={m.homeTeam.name}
                                    className="w-8 h-8 object-contain rounded bg-black border border-white/5 p-1" 
                                    alt="" 
                                  />
                                  <span className="text-xs font-extrabold text-white truncate max-w-[130px] group-hover:text-[#f3c623] transition-colors">{worldCupService.translateTeam(m.homeTeam.name)}</span>
                                </div>

                                <div className="w-2/12 text-center text-sm font-black font-mono">
                                  {isLive || isFinished ? (
                                    <span className="text-[#f3c623] text-lg bg-[#d4af37]/10 p-2 rounded-xl border border-[#d4af37]/20">
                                      {m.score.fullTime.home} - {m.score.fullTime.away}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs px-2 py-1 bg-white/5 rounded-lg whitespace-nowrap">
                                      {new Date(m.utcDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-end gap-3 w-5/12">
                                  <span className="text-xs font-extrabold text-white truncate max-w-[130px] group-hover:text-[#f3c623] transition-colors leading-none">{worldCupService.translateTeam(m.awayTeam.name)}</span>
                                  <ImageResolver 
                                    src={m.awayTeam.crest} 
                                    fallbackType="team"
                                    fallbackText={m.awayTeam.name}
                                    className="w-8 h-8 object-contain rounded bg-black border border-white/5 p-1" 
                                    alt="" 
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[9px] text-gray-400 font-bold">
                                <div className="flex items-center gap-1">
                                  <MapPin size={11} className="text-[#d4af37]" />
                                  <span>{m.venue || ''}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={11} className="text-[#d4af37]" />
                                  <span>{new Date(m.utcDate).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. GROUPS & STANDINGS */}
                {activeTab === 'groups' && (
                  <div className="space-y-6">
                    {selectedYear === 2026 && (
                      <div className="p-4 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20 text-[10.5px] text-[#f3c623] font-bold">
                        💡 يضم مونديال 2026 الاستثنائي 12 مجموعة (من أ إلى ل) - 4 فرق في كل مجموعة. يتأهل بطل المجموعات والوصيف بالإضافة لتأهل أفضل 8 ثوالث للأدوار الإقصائية الجديدة.
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {standings.map((grpObj) => (
                        <div key={grpObj.group} className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-4 shadow-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-xs font-black text-[#f3c623] uppercase">
                              {grpObj.group.replace('GROUP_', 'المجموعة ')}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold">نقاط كأس العالم</span>
                          </div>

                          <table className="w-full text-right text-[11px]">
                            <thead>
                              <tr className="text-gray-500 font-black border-b border-white/5">
                                <th className="pb-2 text-right">المنتخب</th>
                                <th className="pb-2 text-center">لعب</th>
                                <th className="pb-2 text-center">أهداف</th>
                                <th className="pb-2 text-center text-[#f3c623]">نقاط</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grpObj.table?.map((entry) => (
                                <tr key={entry.team.id} className="hover:bg-white/[0.02] border-b border-white/[0.02] last:border-0 transition-colors">
                                  <td className="py-2 flex items-center gap-2 font-extrabold text-white cursor-pointer hover:text-[#f3c623]" onClick={() => openTeamDetail(entry.team.id)}>
                                    <ImageResolver 
                                      src={entry.team.crest} 
                                      fallbackType="team"
                                      fallbackText={entry.team.name}
                                      className="w-5 h-5 object-contain" 
                                      alt="" 
                                    />
                                    <span className="truncate max-w-[100px]">{worldCupService.translateTeam(entry.team.name)}</span>
                                  </td>
                                  <td className="py-2 text-center font-mono text-gray-400 font-bold">{entry.playedGames}</td>
                                  <td className="py-2 text-center font-mono text-gray-400 font-bold">{entry.goalsFor}:{entry.goalsAgainst}</td>
                                  <td className="py-2 text-center font-mono font-black text-[#f3c623] text-sm">{entry.points}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. TEAMS LIST */}
                {activeTab === 'teams' && (
                  <div className="space-y-6">
                    <div className="relative w-full md:w-96 border-b border-white/5 pb-4">
                      <input
                        type="text"
                        placeholder="ابحث عن منتخب كروي..."
                        value={teamSearchQuery}
                        onChange={e => setTeamSearchQuery(e.target.value)}
                        className="w-full bg-[#0d0d0f] border border-white/5 rounded-2xl py-2 px-4 pr-10 text-xs text-white focus:border-[#d4af37]/40 outline-none"
                      />
                      <Search size={15} className="absolute left-3.5 top-3 text-gray-500" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredTeamsList.map(t => (
                        <div
                          key={t.id}
                          onClick={() => openTeamDetail(t.id)}
                          className="group p-4 bg-[#0a0a0c] hover:bg-[#121215] border border-white/5 hover:border-[#d4af37]/30 rounded-2xl flex flex-col justify-between items-center text-center gap-3 cursor-pointer transition-all shadow-md transform hover:-translate-y-1"
                        >
                          <div className="relative">
                            <ImageResolver 
                              src={t.crest} 
                              fallbackType="team"
                              fallbackText={t.name}
                              className="w-14 h-14 object-contain rounded-xl bg-black border border-white/5 p-1.5 transition-transform group-hover:scale-105" 
                              alt="" 
                            />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white group-hover:text-[#f3c623] transition-colors leading-tight truncate max-w-[105px]">{worldCupService.translateTeam(t.name)}</h4>
                            {t.clubColors && <p className="text-[8px] text-gray-500 font-bold block mt-0.5">{t.clubColors}</p>}
                          </div>
                          <span className="text-[9px] bg-[#d4af37]/10 text-[#f3c623] border border-[#d4af37]/20 px-2.5 py-0.5 rounded-full font-black">تفاصيل المنتخب</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. NEWS ARCHIVE */}
                {activeTab === 'news' && <WcNews />}

                {/* 6. BRACKET TREE */}
                {activeTab === 'bracket' && <WcBracket matches={matches} onOpenMatch={openMatchDetail} />}

                {/* 7. STATISTICS DASHBOARD */}
                {activeTab === 'statistics' && <WcStats matches={matches} scorers={scorers} />}

                {/* 8. GOLD-PLATED ADMIN PANEL */}
                {activeTab === 'admin' && <WcAdmin onRefreshAllData={() => fetchAllData(true)} />}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* FOOTER METRICS IN OUTER CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 mt-12 text-center text-[10px] text-gray-600 border-t border-white/5 pt-6 font-bold" dir="rtl">
        <p>© كأس العالم 2026 - بوابة wcup2026.org مجلة حرة وتحليلية غير رسمية.</p>
        <p className="mt-1">تدار وتتم المزامنة عبر Firestore وبنية OpenFootball وقاعدة السورس كود المذهب بالكامل.</p>
      </div>

      {/* FLOATING WC OVERLAYS / MODALS */}
      <AnimatePresence>
        {activeMatchId && (
          <WCMatchDetail 
            matchId={activeMatchId}
            onClose={closeOverlays}
            onOpenTeam={openTeamDetail}
            onOpenPlayer={openPlayerDetail}
            isDark={true}
          />
        )}

        {activeTeamId && (
          <WCTeamDetail 
            teamId={activeTeamId}
            onClose={closeOverlays}
            onOpenPlayer={openPlayerDetail}
            onOpenMatch={openMatchDetail}
            isDark={true}
          />
        )}

        {activePlayerId && (
          <WCPlayerDetail 
            playerId={activePlayerId}
            onClose={closeOverlays}
            isDark={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
