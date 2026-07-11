import React, { useState, useMemo, useEffect } from 'react';
import { 
  useMatches, 
  useLiveMatches, 
  useFixtures, 
  useResults 
} from '../hooks/useMatchesV2';
import { useLeagues } from '../hooks/useLeagues';
import { 
  CalendarDays, 
  Search, 
  Trophy, 
  Tv, 
  RotateCw, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  Radio, 
  Flame, 
  Compass, 
  Sparkles,
  RefreshCw,
  LayoutGrid,
  List,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  BookmarkCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Match } from '../types';
import MatchCard from './MatchCard';
import AdBanner from './AdBanner';
import { filterMatchesByCustomLeagues } from '../utils/leagueFilter';
import { getLocalDateString } from '../utils/dateUtils';
import LiveMatchIndicator from './ui/LiveMatchIndicator';
import { useNotifications } from '../context/NotificationContext';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useError } from '../context/ErrorContext';
import { cn, formatTime } from '../lib/utils';
import { handleImageError } from '../utils/teamUtils';
import { createSlugPath } from '../utils/slugify';
import { MatchCardSkeleton, EmptyState } from './ui/StatusStates';
import ImageResolver from './ui/ImageResolver';

const MAJOR_LEAGUES_CONFIG = [
  {
    key: 'Premier League',
    nameAr: 'الدوري الإنجليزي',
    nameEn: 'Premier League',
    aliases: ['Premier League', 'الدوري الإنجليزي الممتاز', 'الدوري الإنجليزي', 'EPL'],
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    color: 'from-purple-900 via-purple-950 to-indigo-950',
  },
  {
    key: 'La Liga',
    nameAr: 'الدوري الإسباني',
    nameEn: 'La Liga',
    aliases: ['La Liga', 'Primera División', 'الدوري الإسباني', 'LaLiga'],
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    color: 'from-red-900 via-red-950 to-amber-950',
  },
  {
    key: 'UEFA Champions League',
    nameAr: 'دوري أبطال أوروبا',
    nameEn: 'Champions League',
    aliases: ['UEFA Champions League', 'Champions League', 'دوري أبطال أوروبا', 'UCL'],
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    color: 'from-blue-900 via-blue-950 to-cyan-950',
  },
  {
    key: 'Serie A',
    nameAr: 'الدوري الإيطالي',
    nameEn: 'Serie A',
    aliases: ['Serie A', 'الدوري الإيطالي', 'الكالتشيو'],
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    color: 'from-blue-900 via-sky-950 to-slate-950',
  },
  {
    key: 'Bundesliga',
    nameAr: 'الدوري الألماني',
    nameEn: 'Bundesliga',
    aliases: ['Bundesliga', 'الدوري الألماني', 'البوندسليغا'],
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    color: 'from-red-900 via-rose-950 to-zinc-950',
  },
  {
    key: 'Saudi Pro League',
    nameAr: 'الدوري السعودي',
    nameEn: 'Saudi Pro League',
    aliases: ['Saudi Pro League', 'الدوري السعودي', 'دوري روشن', 'Saudi Professional League'],
    logo: 'https://media.api-sports.io/football/leagues/307.png',
    color: 'from-emerald-900 via-emerald-950 to-teal-950',
  },
  {
    key: 'Egyptian Premier League',
    nameAr: 'الدوري المصري',
    nameEn: 'Egyptian Premier League',
    aliases: ['Egyptian Premier League', 'الدوري المصري', 'الدوري المصري الممتاز'],
    logo: 'https://media.api-sports.io/football/leagues/233.png',
    color: 'from-red-900 via-slate-950 to-zinc-950',
  },
  {
    key: 'World Cup',
    nameAr: 'كأس العالم',
    nameEn: 'World Cup',
    aliases: ['World Cup', 'كأس العالم', 'FIFA World Cup'],
    logo: 'https://media.api-sports.io/football/leagues/1.png',
    color: 'from-amber-800 via-amber-950 to-stone-950',
  }
];

type TabType = 'LIVE' | 'TODAY' | 'UPCOMING' | 'FINISHED';
type ViewMode = 'COMPACT' | 'CARDS';

const Schedule = React.memo(function Schedule() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user] = useAuthState(auth);
  const { 
    favoriteLeagues, 
    notifiedMatches, 
    toggleFavoriteLeague, 
    toggleMatchNotification 
  } = useNotifications();
  const { showToast, showError } = useError();

  // Active Tab determined by URL Search Param or fallback to TODAY
  const activeTab = (searchParams.get('tab') as TabType) || 'TODAY';

  // State Management
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString()); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('COMPACT');
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

  // 1. Data Fetching via React Query Hooks
  const { data: leagues = [] } = useLeagues();
  
  // Dynamic query selection based on tab
  const todayMatchesQuery = useMatches({ date: selectedDate });
  const liveMatchesQuery = useLiveMatches();
  const fixturesQuery = useFixtures({ date: selectedDate });
  const resultsQuery = useResults();

  const currentQuery = useMemo(() => {
    switch (activeTab) {
      case 'LIVE': return liveMatchesQuery;
      case 'UPCOMING': return fixturesQuery;
      case 'FINISHED': return resultsQuery;
      default: return todayMatchesQuery;
    }
  }, [activeTab, todayMatchesQuery, liveMatchesQuery, fixturesQuery, resultsQuery]);

  const matches = Array.isArray(currentQuery.data) ? currentQuery.data : [];
  useEffect(() => {
    console.log(`[Schedule Debug] activeTab: ${activeTab}, selectedDate: ${selectedDate}, matches count: ${matches.length}`);
    if (matches.length > 0) {
      console.log("[Schedule Debug] First match:", matches[0]);
    }
  }, [matches, activeTab, selectedDate]);
  const isCurrentlyLoading = currentQuery.isLoading;
  const isRefreshing = currentQuery.isFetching;

  // Reset filter when tab changes
  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleRefresh = () => {
    currentQuery.refetch();
    showToast('يتم الآن تحديث النتائج المباشرة...', 'info');
  };

  const handleToggleLeagueFav = (e: React.MouseEvent, leagueName: string) => {
    e.stopPropagation();
    toggleFavoriteLeague(leagueName);
    const isFav = favoriteLeagues.includes(leagueName);
    showToast(isFav ? `تمت إزالة ${leagueName} من المفضلة` : `تمت إضافة ${leagueName} للمفضلة`, isFav ? 'info' : 'success');
  };

  const handleToggleNotification = (e: React.MouseEvent, matchId: string | number) => {
    e.stopPropagation();
    toggleMatchNotification(String(matchId));
    const isNotified = notifiedMatches.includes(String(matchId));
    showToast(isNotified ? 'تم إلغاء تنبيه المباراة' : 'سيتم تنبيهك عند بدء المباراة', 'success');
  };

  // 2. Logic: Process and Filter matches
  const processedMatches = useMemo(() => {
    let result = [...matches];
    console.log(`[Schedule Debug] Before filtering: ${result.length} matches.`);

    // Filter by Tab (if not already filtered by API)
    if (activeTab === 'LIVE') {
      result = result.filter(m => m.status === 'LIVE' || m.isLive);
    }
    console.log(`[Schedule Debug] After tab filter: ${result.length} matches.`);

    // Filter by Selected League (supports both major leagues config aliases and exact matches)
    if (selectedLeague !== 'ALL') {
      const majorLeague = MAJOR_LEAGUES_CONFIG.find(ml => ml.key === selectedLeague);
      result = result.filter(m => {
        const mLeagueName = typeof m.league === 'object' ? m.league?.name : m.league;
        if (!mLeagueName) return false;
        
        if (majorLeague) {
          // Check if match league matches any alias of the selected major league
          const normalizedName = String(mLeagueName).toLowerCase().trim();
          return majorLeague.aliases.some(alias => 
            alias.toLowerCase().trim() === normalizedName
          );
        }
        
        return String(mLeagueName).toLowerCase().trim() === String(selectedLeague).toLowerCase().trim();
      });
    }
    console.log(`[Schedule Debug] After league filter: ${result.length} matches.`);

    // Filter by Search Query (Team names or League names)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => {
        const home = (typeof m.homeTeam === 'object' ? (m.homeTeam as any).name : m.homeTeam || '').toLowerCase();
        const away = (typeof m.awayTeam === 'object' ? (m.awayTeam as any).name : m.awayTeam || '').toLowerCase();
        const league = (typeof m.league === 'object' ? m.league?.name : m.league || '').toLowerCase();
        return home.includes(q) || away.includes(q) || league.includes(q);
      });
    }
    console.log(`[Schedule Debug] After search filter: ${result.length} matches.`);

    // Sorting: Favorites first, then by time
    return result.sort((a, b) => {
      const aLeagueName = typeof a.league === 'object' ? a.league?.name : a.league;
      const bLeagueName = typeof b.league === 'object' ? b.league?.name : b.league;
      const aFav = favoriteLeagues.includes(aLeagueName) ? 1 : 0;
      const bFav = favoriteLeagues.includes(bLeagueName) ? 1 : 0;
      
      if (aFav !== bFav) return bFav - aFav;
      const aTime = new Date(a.utcDate || a.startTime || 0).getTime();
      const bTime = new Date(b.utcDate || b.startTime || 0).getTime();
      return aTime - bTime;
    });
  }, [matches, activeTab, selectedLeague, searchQuery, favoriteLeagues]);

  // Grouped Matches by League
  const groupedMatches = useMemo(() => {
    const groups: Record<string, { matches: Match[]; logo: string; id?: string }> = {};
    
    processedMatches.forEach(match => {
      const leagueName = typeof match.league === 'object' ? match.league?.name : match.league;
      const leagueLogo = match.leagueLogo || '';
      
      if (!groups[leagueName]) {
        groups[leagueName] = {
          matches: [],
          logo: leagueLogo
        };
      }
      groups[leagueName].matches.push(match);
    });
    
    return groups;
  }, [processedMatches]);

  const uniqueLeagueNames = useMemo(() => Object.keys(groupedMatches), [groupedMatches]);

  // Counts for pills
  const dynamicLeagueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    matches.forEach(m => {
      const name = typeof m.league === 'object' ? m.league?.name : m.league;
      counts[name] = (counts[name] || 0) + 1;
    });
    return {
      total: matches.length,
      counts
    };
  }, [matches]);

  // Dynamic match count for major leagues based on current tab/date
  const majorLeagueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize counters
    MAJOR_LEAGUES_CONFIG.forEach(ml => {
      counts[ml.key] = 0;
    });

    matches.forEach(m => {
      const mLeagueName = typeof m.league === 'object' ? m.league?.name : m.league;
      if (!mLeagueName) return;

      const normalized = String(mLeagueName).toLowerCase().trim();
      
      // Find which major league this belongs to
      const matchedMl = MAJOR_LEAGUES_CONFIG.find(ml => 
        ml.aliases.some(alias => alias.toLowerCase().trim() === normalized)
      );

      if (matchedMl) {
        counts[matchedMl.key] = (counts[matchedMl.key] || 0) + 1;
      }
    });

    return counts;
  }, [matches]);

  // 3. UI Helpers
  const toggleLeagueCollapse = (leagueName: string) => {
    setCollapsedLeagues(prev => ({
      ...prev,
      [leagueName]: !prev[leagueName]
    }));
  };

  const expandAllLeagues = (names: string[]) => {
    const newState: Record<string, boolean> = {};
    names.forEach(name => newState[name] = false);
    setCollapsedLeagues(newState);
  };

  const collapseAllLeagues = (names: string[]) => {
    const newState: Record<string, boolean> = {};
    names.forEach(name => newState[name] = true);
    setCollapsedLeagues(newState);
  };

  const activeProvider = currentQuery.data ? 'Cloud Store v2' : 'Loading...';
  const todayStr = getLocalDateString();
  
  // Date slider helpers
  const dateSliderDays = useMemo(() => {
    const days = [];
    const base = new Date();
    // Show 3 days before and 7 days after
    for (let i = -3; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push({
        dateStr: getLocalDateString(d),
        dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('ar-EG', { month: 'short' })
      });
    }
    return days;
  }, []);

  return (
    <div 
      className="max-w-5xl mx-auto px-4 pt-20 md:pt-28 pb-16 space-y-6 font-sans select-none"
      style={{ direction: 'rtl' }}
      id="schedule-root-container"
    >
      {/* 1. COMPACT PAGE HEADER WITH LIVE SYNC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <CalendarDays size={22} className="text-primary animate-pulse" />
            <span>جدول المباريات التفاعلي</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 font-bold mt-1">
            تابع تفاصيل وجداول مباريات البطولات الكبرى والنتائج لحظة بلحظة بتصميم مدمج واحترافي.
          </p>
        </div>

        {/* Real-time status + reload button */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-emerald-400 font-black tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              خدمة المزامنة نشطة ({activeProvider})
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-white/5 bg-surface hover:border-primary/20 transition-all cursor-pointer flex items-center justify-center"
            title="تحديث البيانات يدوياً"
            id="refresh-schedule-btn"
          >
            <RotateCw size={14} className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. TAB CONTROLLER */}
      <div className="bg-surface p-1 rounded-2xl border border-white/5 flex items-center w-full shadow-inner shadow-black/40">
        {(['TODAY', 'LIVE', 'UPCOMING', 'FINISHED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 text-center py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 relative cursor-pointer ${
              activeTab === tab 
                ? 'text-black bg-primary shadow-md font-black scale-[1.01]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            id={`tab-button-${tab}`}
          >
            {tab === 'TODAY' && 'جدول المباريات'}
            {tab === 'LIVE' && (
              <span className="flex items-center justify-center gap-1.5">
                <span>مباشر الآن</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </span>
            )}
            {tab === 'UPCOMING' && 'القادمة'}
            {tab === 'FINISHED' && 'المنتهية'}
          </button>
        ))}
      </div>

      {/* 3. INTERACTIVE HORIZONTAL DATE SLIDER (FOTMOB DESIGN) */}
      {activeTab !== 'LIVE' && (
        <div className="bg-surface p-3 rounded-2xl border border-white/5 space-y-3 shadow-md" id="date-slider-container">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300">
            <span className="flex items-center gap-1">
              <Calendar size={14} className="text-primary" />
              <span>اختر تاريخ المباريات:</span>
            </span>
            {selectedDate && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono">
                {selectedDate}
              </span>
            )}
          </div>
          
          <div className="overflow-x-auto scrollbar-none flex items-center gap-2 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
            {dateSliderDays.map((sd) => {
              const worksAsActive = selectedDate === sd.dateStr;
              return (
                <button
                  key={sd.dateStr}
                  onClick={() => {
                    setSelectedDate(sd.dateStr);
                    setSelectedLeague('ALL'); // Reset league selection when swapping dates to avoid blank screens
                  }}
                  className={`flex-1 min-w-[76px] sm:min-w-[90px] py-2 px-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer snap-start ${
                    worksAsActive 
                      ? 'bg-primary text-black font-black shadow-lg scale-102' 
                      : 'bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  id={`date-slide-${sd.dateStr}`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-75">{sd.dayName}</span>
                  <span className="text-sm font-extrabold mt-0.5">{sd.dayNum}</span>
                  <span className="text-[9px] font-medium opacity-80">{sd.monthName}</span>
                </button>
              );
            })}

            {/* Custom Input Date Picker Trigger */}
            <div className="relative min-w-[76px] sm:min-w-[90px] h-[52px] bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setSelectedLeague('ALL');
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
              />
              <CalendarDays size={18} className="text-primary mb-0.5" />
              <span className="text-[10px] font-bold text-gray-300">تاريخ مخصص</span>
            </div>
          </div>
        </div>
      )}

      {/* MAJOR LEAGUES FEATURED FILTER CAROUSEL (FOTMOB STYLE) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface p-4 rounded-2xl border border-white/5 space-y-3.5 shadow-md relative overflow-hidden" 
        id="major-leagues-filter-container"
      >
        <div className="flex items-center justify-between text-xs font-black text-gray-300">
          <span className="flex items-center gap-1.5">
            <Trophy size={14} className="text-yellow-400 animate-pulse" />
            <span>فلترة سريعة حسب الدوريات الكبرى:</span>
          </span>
          {selectedLeague !== 'ALL' && (
            <button
              onClick={() => setSelectedLeague('ALL')}
              className="text-[10px] text-primary hover:underline font-bold cursor-pointer transition-all"
            >
              عرض الكل (إلغاء الفلتر)
            </button>
          )}
        </div>

        <div className="overflow-x-auto scrollbar-none flex items-center gap-3 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
          {/* "ALL" option in the Carousel too for easy reset with icon */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedLeague('ALL')}
            className={`flex-shrink-0 min-w-[105px] p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer snap-start relative ${
              selectedLeague === 'ALL'
                ? 'bg-primary border-primary text-black font-black shadow-lg shadow-primary/10'
                : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${selectedLeague === 'ALL' ? 'bg-black/10 text-black' : 'bg-white/5 text-primary'}`}>
              🏆
            </div>
            <span className="text-[10px] font-black">جميع البطولات</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${selectedLeague === 'ALL' ? 'bg-black/10 text-black' : 'bg-white/5 text-gray-400'}`}>
              {dynamicLeagueCounts.total}
            </span>
          </motion.button>

          {MAJOR_LEAGUES_CONFIG.map((ml) => {
            const isActive = selectedLeague === ml.key;
            const count = majorLeagueCounts[ml.key] || 0;
            
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={ml.key}
                onClick={() => setSelectedLeague(isActive ? 'ALL' : ml.key)}
                className={`flex-shrink-0 min-w-[115px] p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer snap-start group relative overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-br ${ml.color} border-transparent text-white font-black shadow-lg shadow-black/40`
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                {/* Glowing subtle background dot when active */}
                {isActive && (
                  <span className="absolute -top-6 -right-6 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                )}

                <div className={`w-10 h-10 rounded-full bg-white/10 p-1 flex items-center justify-center transition-all group-hover:scale-105 ${isActive ? 'ring-2 ring-white/50' : 'group-hover:ring-1 group-hover:ring-white/20'}`}>
                  <ImageResolver
                    src={ml.logo}
                    alt={ml.nameAr}
                    fallbackType="league"
                    className="w-8 h-8 object-contain rounded-full bg-white/5"
                  />
                </div>

                <span className="text-[10px] font-black text-center truncate w-full">
                  {ml.nameAr}
                </span>

                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : count > 0 
                      ? 'bg-primary/20 text-primary animate-pulse' 
                      : 'bg-white/5 text-gray-500'
                }`}>
                  {count > 0 ? `${count} ${count === 1 ? 'مباراة' : 'مباريات'}` : 'لا مباريات'}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* 4. DYNAMIC QUICK LEAGUE PILLS & VIEW togglers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-3 rounded-2xl border border-white/5" id="filters-panel-wrapper">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1">
          <SlidersHorizontal size={14} className="text-gray-400 hidden sm:inline-block md:ml-1 shrink-0" />
          
          <button
            onClick={() => setSelectedLeague('ALL')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap cursor-pointer transition-all ${
              selectedLeague === 'ALL'
                ? 'bg-primary text-black shadow-md shadow-primary/10'
                : 'bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            الكل ({dynamicLeagueCounts.total})
          </button>
          
          {Object.entries(dynamicLeagueCounts.counts).map(([leagueName, count]) => (
            <button
              key={leagueName}
              onClick={() => setSelectedLeague(leagueName)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedLeague === leagueName
                  ? 'bg-primary text-black shadow-md'
                  : 'bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              {leagueName} ({count})
            </button>
          ))}
        </div>

        {/* Text search + View Switches */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="البحث باسم الفريق أو البطولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 text-right bg-white/5 border border-white/5 p-2 pr-9 pl-3 rounded-xl text-xs font-bold text-gray-200 outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="bg-white/5 p-0.5 rounded-xl border border-white/5 flex items-center shrink-0">
            <button
              onClick={() => setViewMode('COMPACT')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'COMPACT' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
              title="عرض مدمج (نمط جدول الدوري)"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'CARDS' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
              title="عرض مفصل (بطاقات)"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* NATIVE BANNER ADS */}
      <div className="w-full" id="schedule-ad-banner">
        <AdBanner slot="Schedule_Middle" />
      </div>

      {/* Global Collapsible action bar (Shown if grouped leagues exist) */}
      {uniqueLeagueNames.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-gray-400 font-bold">
            عدد البطولات النشطة: <span className="text-secondary font-extrabold">{uniqueLeagueNames.length}</span> بطولة
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => expandAllLeagues(uniqueLeagueNames)}
              className="text-[9px] font-black bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-1 rounded"
            >
              تفصيل الكل
            </button>
            <button
              onClick={() => collapseAllLeagues(uniqueLeagueNames)}
              className="text-[9px] font-black bg-white/5 hover:bg-white/10 text-gray-300 px-2.5 py-1 rounded"
            >
              طي الكل
            </button>
          </div>
        </div>
      )}

      {/* 5. MATCH LISTINGS */}
      <div className="space-y-6 pt-1">
        {currentQuery.isError ? (
          <EmptyState 
            title="حدث خطأ في تحميل البيانات"
            description="فشل جلب بيانات المباريات. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
            icon={<AlertTriangle size={40} className="text-red-500" />}
            onRetry={() => currentQuery.refetch()}
          />
        ) : isCurrentlyLoading ? (
          // Skeletons
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : uniqueLeagueNames.length > 0 ? (
          <div className="space-y-4">
            {uniqueLeagueNames.map(leagueName => {
              const leagueGroup = groupedMatches[leagueName];
              const isCollapsed = collapsedLeagues[leagueName] || false;
              const matchesCount = leagueGroup.matches.length;
              
              return (
                <div key={leagueName} className="space-y-2" id={`league-group-${encodeURIComponent(leagueName)}`}>
                  
                  {/* League Header / Collapsible trigger */}
                  <div
                    onClick={() => toggleLeagueCollapse(leagueName)}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/5 hover:border-primary/20 cursor-pointer transition-all shadow-sm select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      {leagueGroup.logo ? (
                        <ImageResolver 
                          src={leagueGroup.logo} 
                          alt="" 
                          fallbackType="league"
                          className="w-6 h-6 object-contain rounded-full bg-white/10 p-0.5" 
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-primary font-black">🏆</div>
                      )}
                      <div>
                        <span className="text-xs font-black text-white hover:text-primary transition-colors">
                          {leagueName}
                        </span>
                        <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded-full mr-1.5 select-none text-center">
                          {matchesCount} {matchesCount === 1 ? 'مباراة' : 'مباريات'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleLeagueFav(e, leagueName)}
                        className={`p-1.5 rounded-full transition-all hover:bg-white/10 ${
                          favoriteLeagues.includes(leagueName) ? 'text-yellow-400' : 'text-gray-500'
                        }`}
                        title="تفضيل البطولة"
                      >
                        <Star size={12} fill={favoriteLeagues.includes(leagueName) ? 'currentColor' : 'none'} />
                      </button>
                      
                      {isCollapsed ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronUp size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* League Matches Rows/Cards list with Animations */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        {viewMode === 'COMPACT' ? (
                          // 5a. Professional Compact Row View (FotMob Style Table list)
                          <div className="border border-white/5 rounded-2xl bg-surface divide-y divide-white/5 overflow-hidden">
                            {leagueGroup.matches.map(match => {
                              const isMatchLive = match.status === 'LIVE' || match.isLive;
                              const isMatchNotified = notifiedMatches.includes(match.id);
                              
                              return (
                                <div
                                  key={match.id}
                                  onClick={() => navigate(`/match/${createSlugPath(`${match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam) : ''} vs ${match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam) : ''}`, match.id)}`)}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-white/[0.01] transition-all cursor-pointer relative group/row gap-3"
                                  id={`compact-row-${match.id}`}
                                >
                                  {/* Left or Header section: Timing, Live status */}
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="min-w-[80px]">
                                      <LiveMatchIndicator 
                                        status={match.status} 
                                        isLiveProp={isMatchLive}
                                        minute={match.minute}
                                        startTime={match.startTime || match.utcDate}
                                        size="xs"
                                        showIcon={true}
                                      />
                                    </div>

                                    {/* Action indicators like channels, commentary */}
                                    <div className="flex items-center gap-2">
                                      {match.channel && (
                                        <span className="flex items-center gap-1 text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                                          <Tv size={10} className="text-secondary" />
                                          <span className="max-w-[70px] truncate">{match.channel}</span>
                                        </span>
                                      )}
                                      {match.commentator && (
                                        <span className="hidden md:flex items-center gap-1 text-[9px] text-[#869ab8] max-w-[80px] truncate" title={match.commentator}>
                                          <Radio size={10} className="text-secondary" />
                                          <span>{match.commentator}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Middle section: Teams and Score (Balanced flex columns) */}
                                  <div className="flex-1 flex items-center justify-between sm:justify-center md:gap-8 gap-4 py-1.5 px-2">
                                    
                                    {/* Home Team (Right alignment in RTL) */}
                                    <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0">
                                      <span className="text-xs font-black text-gray-200 group-hover/row:text-primary transition-colors text-right truncate">
                                        {typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam}
                                      </span>
                                      <ImageResolver 
                                        src={match.homeLogo || undefined} 
                                        alt="" 
                                        fallbackType="team"
                                        fallbackText={typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam}
                                        tla={typeof match.homeTeam === 'object' ? (match.homeTeam as any).tla : undefined}
                                        className="w-6 h-6 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                                      />
                                    </div>

                                    {/* Central Scores panel */}
                                    <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px]">
                                      {match.status === 'UPCOMING' ? (
                                        <span className="text-[11px] font-black bg-white/5 border border-white/5 text-gray-300 px-3 py-1 rounded-lg">
                                          VS
                                        </span>
                                      ) : (
                                        <div className={cn(
                                          "flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all duration-300",
                                          isMatchLive 
                                            ? "bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse" 
                                            : "bg-black/45 border-white/5"
                                        )}>
                                          <span className={cn(
                                            "text-sm font-black tabular-nums tracking-tighter transition-all",
                                            isMatchLive ? "text-emerald-400 font-black animate-pulse" : "text-white"
                                          )}>
                                            {match.homeScore ?? 0}
                                          </span>
                                          <span className="text-gray-500 font-bold">:</span>
                                          <span className={cn(
                                            "text-sm font-black tabular-nums tracking-tighter transition-all",
                                            isMatchLive ? "text-emerald-400 font-black animate-pulse" : "text-white"
                                          )}>
                                            {match.awayScore ?? 0}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Away Team (Left alignment in RTL) */}
                                    <div className="flex items-center justify-start gap-2.5 flex-1 min-w-0">
                                      <ImageResolver 
                                        src={match.awayLogo || undefined} 
                                        alt="" 
                                        fallbackType="team"
                                        fallbackText={typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam}
                                        tla={typeof match.awayTeam === 'object' ? (match.awayTeam as any).tla : undefined}
                                        className="w-6 h-6 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                                      />
                                      <span className="text-xs font-black text-gray-200 group-hover/row:text-primary transition-colors text-left truncate">
                                        {typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam}
                                      </span>
                                    </div>

                                  </div>

                                  {/* Right side: quick notifications & details */}
                                  <div className="flex items-center gap-2 justify-end shrink-0 select-none">
                                    <button
                                      onClick={(e) => handleToggleNotification(e, match.id)}
                                      className={`p-1.5 rounded-full hover:bg-white/5 transition-all text-center flex items-center justify-center ${
                                        isMatchNotified ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
                                      }`}
                                      title={isMatchNotified ? "إلغاء التنبيه" : "تفعيل تنبيهات المباراة"}
                                    >
                                      <Bell size={12} fill={isMatchNotified ? 'currentColor' : 'none'} />
                                    </button>

                                    <div className="opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0 translate-x-1.5 transition-all flex items-center gap-0.5 text-primary">
                                      <span className="text-[10px] font-black hidden sm:inline-block">تحليل</span>
                                      <ChevronLeft size={14} />
                                    </div>
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // 5b. Card Grid view (original detailed MatchCard listing)
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {leagueGroup.matches.map(match => (
                              <div key={match.id} className="relative">
                                <MatchCard match={match} />
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            title="لا توجد مباريات مطابقة حالياً"
            description="لم نعثر على أي لقاءات مجدولة تتطابق مع المرشحات الحالية في هذا النطاق."
            onRetry={() => {
              setSelectedLeague('ALL');
              setSelectedDate(getLocalDateString());
              setSearchQuery('');
              setSearchParams({ tab: 'TODAY' });
              showToast('تمت إعادة تهيئة الفلاتر بالكامل', 'info');
            }}
          />
        )}
      </div>
    </div>
  );
});

export default Schedule;
