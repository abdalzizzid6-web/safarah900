import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Users, Trophy, Loader2, Compass, Sparkles, Newspaper, Video, Calendar, ArrowRight, Play, Award } from 'lucide-react';
import { teamService } from '../services/teamService';
import { getStoredFilterSettings } from '../utils/leagueFilter';
import { createSlugPath } from '../utils/slugify';
import ImageResolver from './ui/ImageResolver';

interface SemanticResult {
  resolvedEntity: {
    type: 'player' | 'team' | 'league' | 'unknown';
    canonicalId: string;
    canonicalName: string;
    canonicalArabicName: string;
  };
  playerProfile: any;
  teamProfile: any;
  news: any[];
  matches: any[];
  videos: any[];
  competitions: any[];
}

export default function SearchModal() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<SemanticResult | null>(null);
  const [fallbackResults, setFallbackResults] = useState<{ teams: any[]; leagues: any[] }>({ teams: [], leagues: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global event listener to trigger search overlay
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    };
    window.addEventListener('open-search-modal', handleOpen);
    return () => window.removeEventListener('open-search-modal', handleOpen);
  }, []);

  // Hotkey Esc to close search
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Debounced semantic & fallback search query
  useEffect(() => {
    if (!query.trim()) {
      setSemanticResults(null);
      setFallbackResults({ teams: [], leagues: [] });
      return;
    }

    setLoading(true);
    const delayTimer = setTimeout(async () => {
      try {
        // 1. Call Premium AI Semantic Search route
        const semRes = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
        if (semRes.ok) {
          const semData = await semRes.json();
          setSemanticResults(semData);
        }

        // 2. Fetch standard fallback items in parallel
        const { leagues } = getStoredFilterSettings();
        let matchedLeagues = (Array.isArray(leagues) ? leagues : []).filter((l) =>
          (l?.name || '').toLowerCase().includes(query.toLowerCase()) ||
          (l?.country || '').toLowerCase().includes(query.toLowerCase())
        );

        if ("كأس العالم 2026 world cup wc".includes(query.toLowerCase())) {
          matchedLeagues = [{
            id: 'wc2026',
            apiId: 'wc2026',
            name: 'كأس العالم 2026',
            country: 'العالم',
            logo: 'https://media.api-sports.io/football/leagues/1.png',
            emoji: '🌍',
            enabled: true
          }, ...matchedLeagues as any];
        }

        let matchedTeams: any[] = [];
        try {
          matchedTeams = await teamService.searchTeams(query);
        } catch (err) {
          console.warn("API Team search error:", err);
        }

        setFallbackResults({
          leagues: matchedLeagues.slice(0, 4),
          teams: matchedTeams.slice(0, 5),
        });

      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayTimer);
  }, [query]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  const hasSemanticMatches = semanticResults && (
    semanticResults.resolvedEntity.type !== 'unknown' ||
    (semanticResults.news && semanticResults.news.length > 0) ||
    (semanticResults.matches && semanticResults.matches.length > 0) ||
    (semanticResults.videos && semanticResults.videos.length > 0)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#070c16]/95 backdrop-blur-xl p-4 md:p-8 flex flex-col justify-start select-none"
          dir="rtl"
        >
          {/* Top Control Bar */}
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Sparkles className="text-emerald-500 animate-pulse" size={18} />
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 rounded-full">محقق البحث الدلالي بالذكاء الاصطناعي</span>
            </div>
            
            <button
              onClick={handleClose}
              className="p-3 bg-white/5 border border-white/[0.03] text-gray-400 hover:text-white rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core Search Container */}
          <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-start pt-8 space-y-6 overflow-hidden">
            
            {/* Massive Search Input Belt */}
            <div className="relative shrink-0">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
              {loading && <Loader2 className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5 animate-spin" />}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث دلالياً عن رونالدو، ميسي، الريال، الهلال، أو الدوري الإسباني..."
                className="w-full pr-16 pl-14 py-4.5 text-base md:text-lg font-black text-white bg-slate-900 border border-emerald-500/30 rounded-3xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xl transition-all"
              />
            </div>

            {/* Results Display Area */}
            <div className="flex-grow overflow-y-auto pr-1 pb-16 scrollbar-none">
              {!query.trim() ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="p-5 rounded-full bg-slate-900 border border-white/5 text-gray-500 animate-pulse">
                    <Compass size={28} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">ابدأ كتابة أحرف البحث الآن</h3>
                    <p className="text-xs text-gray-400 font-bold max-w-sm mt-1 leading-relaxed">ابحث عن أنديتك المفضلة كـ "الهلال" أو "ريال مدريد" ومنافسات كأس العالم وجداول الدوريات الكبرى فوراً.</p>
                  </div>
                </div>
              ) : !hasSemanticMatches && fallbackResults.leagues.length === 0 && fallbackResults.teams.length === 0 && !loading ? (
                <div className="text-center py-20 space-y-3">
                  <p className="text-sm font-bold text-gray-500">لا توجد نتائج مطابقة للبحث حالياً.</p>
                  <p className="text-xs text-gray-650 max-w-xs mx-auto">تأكد من صحة إملاء الأحرف، أو راجع إعدادات شبكة الاتصال بالمزودين.</p>
                </div>
              ) : (
                <div className="space-y-8 text-right">
                  {/* AI Smart Insight Banner */}
                  {semanticResults && semanticResults.resolvedEntity.type !== 'unknown' && (
                    <motion.div 
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-slate-950/40 border border-emerald-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Award className="text-emerald-500" size={20} />
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-400 font-black block">محرك الاستبصار الرياضي</span>
                          <h4 className="text-sm font-black text-white mt-0.5">
                            تم التعرف على الكيان: {semanticResults.resolvedEntity.canonicalArabicName} ({semanticResults.resolvedEntity.canonicalName})
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const id = semanticResults.resolvedEntity.canonicalId;
                          const name = semanticResults.resolvedEntity.canonicalName;
                          if (semanticResults.resolvedEntity.type === 'player') {
                            handleNavigate(`/player/${createSlugPath(name, id)}`);
                          } else if (semanticResults.resolvedEntity.type === 'team') {
                            handleNavigate(`/team/${createSlugPath(name, id)}`);
                          } else if (semanticResults.resolvedEntity.type === 'league') {
                            if (id === '1') handleNavigate('/world-cup-2026');
                            else handleNavigate(`/league/${createSlugPath(name, id)}`);
                          }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                      >
                        <span>زيارة الصفحة الشخصية للكيان</span>
                        <ArrowRight size={14} className="rotate-180" />
                      </button>
                    </motion.div>
                  )}

                  {/* Multi-Column Grid Results */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* COL 1: NEWS & VIDEOS */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* News Results */}
                      {semanticResults && semanticResults.news && semanticResults.news.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-emerald-400 tracking-wider flex items-center gap-2">
                            <Newspaper size={14} />
                            <span>الأخبار والتقارير المرتبطة بالبحث ({semanticResults.news.length})</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {semanticResults.news.map((art, i) => (
                              <div key={i} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl space-y-2">
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">تغطية تكتيكية</span>
                                <h5 className="text-xs font-black text-white line-clamp-2 leading-snug">{art.title}</h5>
                                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed font-medium">{art.excerpt || art.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video Highlights */}
                      {semanticResults && semanticResults.videos && semanticResults.videos.length > 0 && (
                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-black text-emerald-400 tracking-wider flex items-center gap-2">
                            <Video size={14} />
                            <span>مقاطع الفيديو والأهداف المرتبطة ({semanticResults.videos.length})</span>
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {semanticResults.videos.map((vid, i) => (
                              <a
                                key={i}
                                href={vid.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-emerald-500/20 transition-all flex flex-col"
                              >
                                <div className="aspect-video bg-slate-950 relative overflow-hidden">
                                  <ImageResolver 
                                    src={vid.thumbnail} 
                                    alt={vid.title} 
                                    fallbackType="default"
                                    className="w-full h-full object-cover opacity-60" 
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/10 transition-all">
                                    <Play size={16} className="text-emerald-500" />
                                  </div>
                                </div>
                                <div className="p-2.5">
                                  <span className="text-[10px] font-black text-gray-200 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">{vid.title}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* COL 2: MATCHES, SQUAD & FALLBACKS */}
                    <div className="space-y-6">
                      {/* Live or Scheduled Matches */}
                      {semanticResults && semanticResults.matches && semanticResults.matches.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-amber-500 tracking-wider flex items-center gap-2">
                            <Calendar size={14} />
                            <span>المواجهات ذات الصلة ({semanticResults.matches.length})</span>
                          </h4>
                          <div className="space-y-2.5">
                            {semanticResults.matches.map((m, i) => {
                              const home = m.homeTeamName || m.homeTeam?.name || "الفريق الأول";
                              const away = m.awayTeamName || m.awayTeam?.name || "الفريق الثاني";
                              return (
                                <button
                                  key={i}
                                  onClick={() => handleNavigate(`/match/${m.id}`)}
                                  className="w-full p-3.5 bg-slate-900/40 border border-white/5 hover:border-amber-500/25 rounded-2xl text-right transition-all flex justify-between items-center group cursor-pointer"
                                >
                                  <span className="text-xs font-black text-white group-hover:text-amber-500 transition-colors truncate max-w-[150px]">{home} ضد {away}</span>
                                  <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">{m.status || 'مجدولة'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Standard Leagues Fallback */}
                      {fallbackResults.leagues.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-primary tracking-wider flex items-center gap-2">
                            <Trophy size={14} />
                            <span>البطولات والدوريات الكبرى</span>
                          </h4>
                          <div className="space-y-2">
                            {fallbackResults.leagues.map((league) => (
                              <button
                                key={league.id}
                                onClick={() => {
                                  if (league.id === 'wc2026') handleNavigate('/world-cup-2026');
                                  else handleNavigate(`/league/${createSlugPath(league.name, league.apiId)}`);
                                }}
                                className="w-full flex items-center gap-3 p-3 bg-slate-900/30 hover:bg-slate-900 border border-white/[0.03] rounded-2xl cursor-pointer text-right transition-all group"
                              >
                                {league.logo || league.id === 'wc2026' ? (
                                  <ImageResolver 
                                    src={league.logo} 
                                    alt={league.name} 
                                    fallbackType="league"
                                    fallbackText={league.name}
                                    className="w-7 h-7 object-contain" 
                                  />
                                ) : (
                                  <span className="text-base">{league.emoji}</span>
                                )}
                                <span className="text-xs font-black text-white group-hover:text-primary transition-colors">{league.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
