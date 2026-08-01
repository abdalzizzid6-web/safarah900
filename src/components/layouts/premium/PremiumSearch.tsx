import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, Trophy, Shield, Calendar, Sparkles, ArrowRight, Compass } from 'lucide-react';
import ImageResolver from '../../ui/ImageResolver';
import { createSlugPath } from '../../../utils/slugify';
import { getStoredFilterSettings } from '../../../utils/leagueFilter';
import { teamService } from '../../../services/teamService';
import { matchService } from '../../../services/matchService';
import { worldCupService } from '../../../services/worldCupService';

interface TeamSearchResult {
  id: string | number;
  name: string;
  englishName?: string;
  logo: string;
  country?: string;
}

interface LeagueSearchResult {
  id: string;
  apiId?: string | number;
  name: string;
  englishName?: string;
  logo: string;
  country?: string;
  emoji?: string;
}

interface MatchSearchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  league?: string;
}

// Pre-defined popular teams for instant zero-latency client matching
const POPULAR_TEAMS: TeamSearchResult[] = [
  { id: '541', name: 'ريال مدريد', englishName: 'Real Madrid', country: 'إسبانيا', logo: 'https://media.api-sports.io/football/teams/541.png' },
  { id: '529', name: 'برشلونة', englishName: 'FC Barcelona', country: 'إسبانيا', logo: 'https://media.api-sports.io/football/teams/529.png' },
  { id: '530', name: 'أتلتيكو مدريد', englishName: 'Atletico Madrid', country: 'إسبانيا', logo: 'https://media.api-sports.io/football/teams/530.png' },
  { id: '33', name: 'مانشستر سيتي', englishName: 'Manchester City', country: 'إنجلترا', logo: 'https://media.api-sports.io/football/teams/33.png' },
  { id: '40', name: 'ليفربول', englishName: 'Liverpool', country: 'إنجلترا', logo: 'https://media.api-sports.io/football/teams/40.png' },
  { id: '42', name: 'أرسنال', englishName: 'Arsenal', country: 'إنجلترا', logo: 'https://media.api-sports.io/football/teams/42.png' },
  { id: '33', name: 'مانشستر يونايتد', englishName: 'Manchester United', country: 'إنجلترا', logo: 'https://media.api-sports.io/football/teams/33.png' },
  { id: '49', name: 'تشيلسي', englishName: 'Chelsea', country: 'إنجلترا', logo: 'https://media.api-sports.io/football/teams/49.png' },
  { id: '157', name: 'بايرن ميونخ', englishName: 'Bayern Munich', country: 'ألمانيا', logo: 'https://media.api-sports.io/football/teams/157.png' },
  { id: '85', name: 'باريس سان جيرمان', englishName: 'Paris Saint-Germain', country: 'فرنسا', logo: 'https://media.api-sports.io/football/teams/85.png' },
  { id: '505', name: 'إنتر ميلان', englishName: 'Inter Milan', country: 'إيطاليا', logo: 'https://media.api-sports.io/football/teams/505.png' },
  { id: '489', name: 'إيه سي ميلان', englishName: 'AC Milan', country: 'إيطاليا', logo: 'https://media.api-sports.io/football/teams/489.png' },
  { id: '496', name: 'يوفنتوس', englishName: 'Juventus', country: 'إيطاليا', logo: 'https://media.api-sports.io/football/teams/496.png' },
  { id: '2939', name: 'الهلال السعودي', englishName: 'Al Hilal', country: 'السعودية', logo: 'https://media.api-sports.io/football/teams/2939.png' },
  { id: '2940', name: 'النصر السعودي', englishName: 'Al Nassr', country: 'السعودية', logo: 'https://media.api-sports.io/football/teams/2940.png' },
  { id: '2938', name: 'الاتحاد السعودي', englishName: 'Al Ittihad', country: 'السعودية', logo: 'https://media.api-sports.io/football/teams/2938.png' },
  { id: '2934', name: 'الأهلي السعودي', englishName: 'Al Ahli Saudi', country: 'السعودية', logo: 'https://media.api-sports.io/football/teams/2934.png' },
  { id: '1029', name: 'الأهلي المصري', englishName: 'Al Ahly', country: 'مصر', logo: 'https://media.api-sports.io/football/teams/1029.png' },
  { id: '1028', name: 'الزمالك', englishName: 'Zamalek', country: 'مصر', logo: 'https://media.api-sports.io/football/teams/1028.png' },
  { id: '3932', name: 'الوداد الرياضي', englishName: 'Wydad AC', country: 'المغرب', logo: 'https://media.api-sports.io/football/teams/3932.png' },
  { id: '3931', name: 'الرجاء الرياضي', englishName: 'Raja CA', country: 'المغرب', logo: 'https://media.api-sports.io/football/teams/3931.png' }
];

// Pre-defined popular leagues
const POPULAR_LEAGUES: LeagueSearchResult[] = [
  { id: 'wc2026', apiId: 'wc2026', name: 'كأس العالم 2026', englishName: 'FIFA World Cup 2026', country: 'العالم', logo: 'https://media.api-sports.io/football/leagues/1.png', emoji: '🌍' },
  { id: '2', apiId: '2', name: 'دوري أبطال أوروبا', englishName: 'UEFA Champions League', country: 'أوروبا', logo: 'https://media.api-sports.io/football/leagues/2.png', emoji: '🇪🇺' },
  { id: '39', apiId: '39', name: 'الدوري الإنجليزي الممتاز', englishName: 'Premier League', country: 'إنجلترا', logo: 'https://media.api-sports.io/football/leagues/39.png', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: '140', apiId: '140', name: 'الدوري الإسباني', englishName: 'La Liga', country: 'إسبانيا', logo: 'https://media.api-sports.io/football/leagues/140.png', emoji: '🇪🇸' },
  { id: '135', apiId: '135', name: 'الدوري الإيطالي', englishName: 'Serie A', country: 'إيطاليا', logo: 'https://media.api-sports.io/football/leagues/135.png', emoji: '🇮🇹' },
  { id: '78', apiId: '78', name: 'الدوري الألماني', englishName: 'Bundesliga', country: 'ألمانيا', logo: 'https://media.api-sports.io/football/leagues/78.png', emoji: '🇩🇪' },
  { id: '61', apiId: '61', name: 'الدوري الفرنسي', englishName: 'Ligue 1', country: 'فرنسا', logo: 'https://media.api-sports.io/football/leagues/61.png', emoji: '🇫🇷' },
  { id: '307', apiId: '307', name: 'الدوري السعودي للمحترفين', englishName: 'Saudi Pro League', country: 'السعودية', logo: 'https://media.api-sports.io/football/leagues/307.png', emoji: '🇸🇦' },
  { id: '233', apiId: '233', name: 'الدوري المصري الممتاز', englishName: 'Egyptian Premier League', country: 'مصر', logo: 'https://media.api-sports.io/football/leagues/233.png', emoji: '🇪🇬' },
  { id: '12', apiId: '12', name: 'دوري أبطال أفريقيا', englishName: 'CAF Champions League', country: 'أفريقيا', logo: 'https://media.api-sports.io/football/leagues/12.png', emoji: '🌍' },
  { id: '18', apiId: '18', name: 'دوري أبطال آسيا للنخبة', englishName: 'AFC Champions League Elite', country: 'آسيا', logo: 'https://media.api-sports.io/football/leagues/18.png', emoji: '🌏' },
  { id: '3', apiId: '3', name: 'الدوري الأوروبي', englishName: 'UEFA Europa League', country: 'أوروبا', logo: 'https://media.api-sports.io/football/leagues/3.png', emoji: '🇪🇺' }
];

// Normalize text helper for soft Arabic & English matching
function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, ''); // Remove tashkeel
}

export default function PremiumSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [customTeams, setCustomTeams] = useState<TeamSearchResult[]>([]);
  const [liveMatches, setLiveMatches] = useState<MatchSearchResult[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load active matches and custom teams on mount or open
  useEffect(() => {
    let isMounted = true;
    async function loadSearchIndexes() {
      try {
        // Fetch active/live matches
        const [fetchedMatches, wcMatches] = await Promise.all([
          matchService.getLiveMatches().catch(() => []),
          worldCupService.getWorldCupMatches().catch(() => [])
        ]);

        if (!isMounted) return;

        const mappedMatches: MatchSearchResult[] = [
          ...(fetchedMatches || []).map((m: any) => ({
            id: String(m.id),
            homeTeam: typeof m.homeTeam === 'object' ? m.homeTeam.name : (m.homeTeam || m.homeTeamName || 'الفريق الأول'),
            awayTeam: typeof m.awayTeam === 'object' ? m.awayTeam.name : (m.awayTeam || m.awayTeamName || 'الفريق الثاني'),
            homeLogo: typeof m.homeTeam === 'object' ? m.homeTeam.logo : (m.homeLogo || ''),
            awayLogo: typeof m.awayTeam === 'object' ? m.awayTeam.logo : (m.awayLogo || ''),
            homeScore: m.score?.home ?? m.homeGoals ?? null,
            awayScore: m.score?.away ?? m.awayGoals ?? null,
            status: m.status?.short || m.status || 'مجدولة',
            league: typeof m.league === 'object' ? m.league.name : (m.league || 'بطولة عالمية')
          })),
          ...(wcMatches || []).map((m: any) => ({
            id: String(m.id),
            homeTeam: m.homeTeamName || m.homeTeam?.name || 'الفريق الأول',
            awayTeam: m.awayTeamName || m.awayTeam?.name || 'الفريق الثاني',
            homeLogo: m.homeTeamLogo || m.homeTeam?.logo || '',
            awayLogo: m.awayTeamLogo || m.awayTeam?.logo || '',
            homeScore: m.homeScore ?? m.score?.home ?? null,
            awayScore: m.awayScore ?? m.score?.away ?? null,
            status: m.status || 'كأس العالم 2026',
            league: 'كأس العالم 2026'
          }))
        ];

        setLiveMatches(mappedMatches);

        // Fetch custom teams from repository
        const cTeams = await teamService.getCustomTeams().catch(() => []);
        if (isMounted && Array.isArray(cTeams) && cTeams.length > 0) {
          setCustomTeams(cTeams.map(t => ({
            id: String(t.id),
            name: t.name,
            englishName: t.venueCity || '',
            logo: t.logo,
            country: t.country
          })));
        }
      } catch (err) {
        console.warn('Failed to pre-cache search matches/teams:', err);
      }
    }

    loadSearchIndexes();
    return () => { isMounted = false; };
  }, []);

  // Global hotkeys (CTRL+K / CMD+K and ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute filtered search results
  const filteredResults = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) {
      return { teams: [], leagues: [], matches: [] };
    }

    // 1. Teams
    const allTeams = [...POPULAR_TEAMS, ...customTeams];
    const uniqueTeamsMap = new Map<string, TeamSearchResult>();
    allTeams.forEach(t => uniqueTeamsMap.set(String(t.id), t));
    
    const matchedTeams = Array.from(uniqueTeamsMap.values()).filter(t => {
      const nameAr = normalizeSearchText(t.name);
      const nameEn = normalizeSearchText(t.englishName || '');
      const country = normalizeSearchText(t.country || '');
      return nameAr.includes(q) || nameEn.includes(q) || country.includes(q);
    }).slice(0, 5);

    // 2. Leagues
    const { leagues: storedLeagues } = getStoredFilterSettings();
    const dynamicLeagues: LeagueSearchResult[] = (Array.isArray(storedLeagues) ? storedLeagues : []).map(l => ({
      id: String(l.id || l.apiId),
      apiId: l.apiId,
      name: l.name,
      logo: l.logo,
      country: l.country,
      emoji: l.emoji
    }));

    const allLeagues = [...POPULAR_LEAGUES, ...dynamicLeagues];
    const uniqueLeaguesMap = new Map<string, LeagueSearchResult>();
    allLeagues.forEach(l => uniqueLeaguesMap.set(String(l.id), l));

    const matchedLeagues = Array.from(uniqueLeaguesMap.values()).filter(l => {
      const nameAr = normalizeSearchText(l.name);
      const nameEn = normalizeSearchText(l.englishName || '');
      const country = normalizeSearchText(l.country || '');
      return nameAr.includes(q) || nameEn.includes(q) || country.includes(q);
    }).slice(0, 4);

    // 3. Matches
    const matchedMatches = liveMatches.filter(m => {
      const home = normalizeSearchText(m.homeTeam);
      const away = normalizeSearchText(m.awayTeam);
      const league = normalizeSearchText(m.league || '');
      return home.includes(q) || away.includes(q) || league.includes(q);
    }).slice(0, 5);

    return {
      teams: matchedTeams,
      leagues: matchedLeagues,
      matches: matchedMatches
    };
  }, [query, customTeams, liveMatches]);

  const hasAnyResults = filteredResults.teams.length > 0 || filteredResults.leagues.length > 0 || filteredResults.matches.length > 0;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleOpenAiModal = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-search-modal'));
  };

  const handleQuickTagClick = (tag: string) => {
    setQuery(tag);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="hidden lg:flex flex-1 max-w-lg mx-6 relative" dir="rtl">
      
      {/* Primary Input Container */}
      <div className="relative w-full">
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary transition-colors pointer-events-none flex items-center justify-center">
          <Search size={18} className={query.trim() ? "text-primary animate-pulse" : "group-hover:text-primary"} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="ابحث عن مباراة، فريق، أو دوري..."
          className="w-full pr-10 pl-16 py-2.5 bg-surface/90 border border-border rounded-xl text-xs font-bold text-text placeholder:text-text-secondary/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 focus:bg-background transition-all shadow-inner"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-text-secondary hover:text-text transition-colors"
          >
            <X size={14} />
          </button>
        ) : (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/80 border border-border text-[9px] font-black text-text-secondary pointer-events-none">
            <span>CTRL</span>
            <span>+</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Floating Global Search Results Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 left-0 mt-2.5 bg-[#0b1329]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-right max-h-[80vh] flex flex-col"
          >
            {/* Header Status Bar inside Dropdown */}
            <div className="px-4 py-2.5 border-b border-white/5 bg-slate-900/40 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles size={13} className="animate-spin-slow" />
                <span>البحث المباشر السريع</span>
              </div>
              <button
                onClick={handleOpenAiModal}
                className="text-text-secondary hover:text-primary transition-colors font-bold text-[10px] flex items-center gap-1"
              >
                <span>البحث المتقدم بالذكاء الاصطناعي</span>
                <ArrowRight size={12} className="rotate-180" />
              </button>
            </div>

            {/* Content Scrollable Body */}
            <div className="p-3 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
              
              {!query.trim() ? (
                /* Empty state - Popular Tag Shortcuts */
                <div className="py-2 space-y-3">
                  <div className="flex items-center gap-2 text-text-secondary text-[11px] font-bold px-1">
                    <Compass size={14} className="text-primary" />
                    <span>عناوين بحث شائعة للمشاهدة السريعة:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'ريال مدريد', type: 'team' },
                      { name: 'الهلال', type: 'team' },
                      { name: 'برشلونة', type: 'team' },
                      { name: 'النصر', type: 'team' },
                      { name: 'الدوري الإنجليزي', type: 'league' },
                      { name: 'دوري أبطال أوروبا', type: 'league' },
                      { name: 'كأس العالم 2026', type: 'league' }
                    ].map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickTagClick(tag.name)}
                        className="px-2.5 py-1 bg-surface-hover/80 hover:bg-primary/20 border border-white/5 hover:border-primary/40 rounded-lg text-[11px] font-bold text-text-secondary hover:text-white transition-all cursor-pointer"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !hasAnyResults ? (
                /* No Results Found State */
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs font-bold text-text-secondary">لم يتم العثور على نتائج سريعة لـ "{query}"</p>
                  <button
                    onClick={handleOpenAiModal}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 hover:bg-primary text-primary hover:text-black rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>تفعيل المحقق الشامل بالذكاء الاصطناعي</span>
                  </button>
                </div>
              ) : (
                /* Active Search Results */
                <div className="space-y-4">
                  
                  {/* Category 1: Teams */}
                  {filteredResults.teams.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-2 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                        <Shield size={12} />
                        <span>الفرق والأندية ({filteredResults.teams.length})</span>
                      </div>
                      <div className="space-y-1">
                        {filteredResults.teams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => handleNavigate(`/team/${createSlugPath(team.name, team.id)}`)}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/30 hover:bg-primary/15 border border-white/[0.03] hover:border-primary/30 text-right transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-black/40 p-1 flex items-center justify-center border border-white/5 shrink-0">
                                <ImageResolver
                                  src={team.logo}
                                  alt={team.name}
                                  fallbackType="team"
                                  fallbackText={team.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-black text-white group-hover:text-primary transition-colors block truncate">
                                  {team.name}
                                </span>
                                {team.country && (
                                  <span className="text-[9px] text-text-secondary block font-bold">
                                    {team.country}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-primary/80 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              زيارة النادي
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Leagues & Tournaments */}
                  {filteredResults.leagues.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-2 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        <Trophy size={12} />
                        <span>البطولات والدوريات ({filteredResults.leagues.length})</span>
                      </div>
                      <div className="space-y-1">
                        {filteredResults.leagues.map((league) => (
                          <button
                            key={league.id}
                            onClick={() => {
                              if (league.id === 'wc2026') handleNavigate('/world-cup-2026');
                              else handleNavigate(`/league/${createSlugPath(league.name, league.apiId || league.id)}`);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/30 hover:bg-amber-500/15 border border-white/[0.03] hover:border-amber-500/30 text-right transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-black/40 p-1 flex items-center justify-center border border-white/5 shrink-0 text-sm">
                                {league.logo ? (
                                  <ImageResolver
                                    src={league.logo}
                                    alt={league.name}
                                    fallbackType="league"
                                    fallbackText={league.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <span>{league.emoji || '🏆'}</span>
                                )}
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-black text-white group-hover:text-amber-400 transition-colors block truncate">
                                  {league.name}
                                </span>
                                {league.country && (
                                  <span className="text-[9px] text-text-secondary block font-bold">
                                    {league.country}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              عرض الدوري
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Matches & Fixtures */}
                  {filteredResults.matches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-2 text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                        <Calendar size={12} />
                        <span>المواجهات المباشرة والجدول ({filteredResults.matches.length})</span>
                      </div>
                      <div className="space-y-1">
                        {filteredResults.matches.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleNavigate(`/match/${m.id}`)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/30 hover:bg-cyan-500/15 border border-white/[0.03] hover:border-cyan-500/30 text-right transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                              <span className="truncate">{m.homeTeam}</span>
                              <span className="text-[10px] text-text-secondary font-bold px-1">ضد</span>
                              <span className="truncate">{m.awayTeam}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined && (
                                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                  {m.homeScore} - {m.awayScore}
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                                {m.status || 'مباراة'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="p-2.5 border-t border-white/5 bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={handleOpenAiModal}
                className="w-full py-2 bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-primary/30 hover:from-emerald-500 hover:to-primary border border-emerald-500/40 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles size={14} className="text-emerald-400" />
                <span>إجراء بحث دلالي شامل بالذكاء الاصطناعي عن "{query || 'كل شيء'}"</span>
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
