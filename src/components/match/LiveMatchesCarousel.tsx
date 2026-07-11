import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Tv, Volume2, Flame, Calendar, Activity, Play } from 'lucide-react';
import { useLiveMatches, useMatches } from '../../hooks/useMatchesV2';
import { ScoreFlash } from '../../premium/components/shared/ScoreFlash';
import { Match } from '../../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function LiveMatchesCarousel() {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Live Matches
  const { data: rawLiveMatches, isLoading: isLiveLoading } = useLiveMatches();
  const liveMatches = Array.isArray(rawLiveMatches) ? rawLiveMatches : [];

  // Fetch Today's Matches (to extract upcoming matches)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: rawTodayMatches, isLoading: isTodayLoading } = useMatches({ date: todayStr });
  const todayMatches = Array.isArray(rawTodayMatches) ? rawTodayMatches : [];

  // Filter out upcoming matches (not live and scheduled for today or later)
  const upcomingMatches = todayMatches
    .filter((m: Match) => {
      const isLive = m.isLive || ['LIVE', 'IN_PLAY', 'PAUSED', 'HT', '1H', '2H', 'ET'].includes(m.status || '');
      const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(m.status || '');
      return !isLive && !isFinished;
    })
    .sort((a: Match, b: Match) => {
      const timeA = new Date(a.startTime || a.utcDate || 0).getTime();
      const timeB = new Date(b.startTime || b.utcDate || 0).getTime();
      return timeA - timeB;
    });

  // Automatically switch tab if there are no live matches but we have upcoming ones
  useEffect(() => {
    if (!isLiveLoading && liveMatches.length === 0 && upcomingMatches.length > 0) {
      setActiveTab('upcoming');
    }
  }, [liveMatches.length, upcomingMatches.length, isLiveLoading]);

  // Reset index when changing tabs
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  const currentList = activeTab === 'live' ? liveMatches : upcomingMatches;
  const isLoading = activeTab === 'live' ? isLiveLoading : isTodayLoading;

  const handleNext = () => {
    if (currentIndex < currentList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(currentList.length - 1); // Loop to end
    }
  };

  // Helper to format start time
  const formatMatchTime = (startTimeStr?: string) => {
    if (!startTimeStr) return '';
    try {
      const date = new Date(startTimeStr);
      return format(date, 'hh:mm a', { locale: ar });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full bg-[#0a0e17]/80 backdrop-blur-md rounded-2xl border border-white/5 p-4 md:p-6 mb-6 shadow-2xl relative overflow-hidden" id="live-matches-carousel">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-gradient-to-tr from-amber-500/20 to-amber-500/5 text-amber-500 rounded-xl border border-amber-500/10">
            <Activity size={18} className="animate-pulse text-amber-500" />
          </span>
          <div>
            <h3 className="text-sm md:text-base font-black text-white leading-tight">شريط مباريات اليوم المميزة</h3>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium">متابعة مباشرة لأبرز المواجهات والأحداث الرياضية</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all duration-300 ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-900/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            مباشر الآن ({liveMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all duration-300 ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/20 text-amber-500 shadow-md shadow-amber-900/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={13} />
            مباريات قادمة ({upcomingMatches.length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-bold">جاري تحميل المباريات وتحديث النتائج فورياً...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          <span className="text-3xl mb-2 block">⚽</span>
          <p className="text-sm font-black text-gray-300">
            {activeTab === 'live' 
              ? 'لا توجد مباريات جارية حالياً' 
              : 'لا توجد مباريات قادمة لليوم'}
          </p>
          <p className="text-xs text-gray-500 mt-1">تأكد من مراجعة جدول المباريات الكامل لمواعيد أخرى</p>
        </div>
      ) : (
        /* Carousel Display */
        <div className="relative group">
          {/* Main Slide Card */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {currentList.map((match: Match, idx) => {
                if (idx !== currentIndex) return null;

                const homeName = typeof match.homeTeam === 'object' ? match.homeTeam.name : (match.homeName || match.homeTeam || '');
                const homeLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : (match.homeLogo || '');
                const awayName = typeof match.awayTeam === 'object' ? match.awayTeam.name : (match.awayName || match.awayTeam || '');
                const awayLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : (match.awayLogo || '');
                const leagueName = typeof match.league === 'object' ? match.league.name : (match.league || '');
                const leagueLogo = typeof match.league === 'object' ? match.league.logo : (match.leagueLogo || '');

                const isLive = match.isLive || ['LIVE', 'IN_PLAY', 'PAUSED', 'HT', '1H', '2H', 'ET'].includes(match.status || '');
                const hasStreaming = match.streamingLinks && match.streamingLinks.some(l => l.enabled);

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: activeTab === 'live' ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: activeTab === 'live' ? -50 : 50 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="w-full"
                  >
                    <Link
                      to={`/match/${match.id}`}
                      className="block bg-white/[0.02] hover:bg-white/[0.04] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 relative group/card shadow-inner"
                    >
                      {/* Top Info Header */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.03]">
                        {/* League Info */}
                        <div className="flex items-center gap-2 text-right">
                          {leagueLogo && (
                            <img src={leagueLogo} alt={leagueName} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                          )}
                          <span className="text-[11px] font-black text-white/70 line-clamp-1">{leagueName}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5">
                          {isLive ? (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>مباشر • {match.minute ? `${match.minute}'` : 'الدقيقة ' + (match.status || 'جاري')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                              <Calendar size={11} />
                              <span>{formatMatchTime(match.startTime || match.utcDate)}</span>
                            </div>
                          )}

                          {hasStreaming && (
                            <div className="flex items-center gap-1 bg-red-600/10 border border-red-500/20 text-red-500 px-2 py-1 rounded-lg text-[10px] font-bold animate-pulse">
                              <Play size={10} fill="currentColor" />
                              <span>بث مباشر</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main Scoreboard Layout */}
                      <div className="flex items-center justify-between py-2 gap-4">
                        {/* Home Team */}
                        <div className="flex flex-col items-center text-center w-5/12 group-hover/card:scale-105 transition-transform duration-300">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/[0.03] p-2.5 border border-white/5 flex items-center justify-center shadow-lg mb-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
                            {homeLogo ? (
                              <img src={homeLogo} alt={homeName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white">{homeName?.slice(0, 2)}</div>
                            )}
                          </div>
                          <span className="text-xs md:text-sm font-black text-white line-clamp-1 max-w-full">{homeName}</span>
                        </div>

                        {/* Versus / Score Central Block */}
                        <div className="flex flex-col items-center justify-center w-2/12">
                          {isLive ? (
                            <ScoreFlash
                              homeScore={match.homeScore ?? match.score?.home ?? 0}
                              awayScore={match.awayScore ?? match.score?.away ?? 0}
                              size="lg"
                              className="text-white"
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">VS</span>
                              <div className="text-lg md:text-xl font-bold text-white/30 font-mono">0 - 0</div>
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center text-center w-5/12 group-hover/card:scale-105 transition-transform duration-300">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/[0.03] p-2.5 border border-white/5 flex items-center justify-center shadow-lg mb-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
                            {awayLogo ? (
                              <img src={awayLogo} alt={awayName} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white">{awayName?.slice(0, 2)}</div>
                            )}
                          </div>
                          <span className="text-xs md:text-sm font-black text-white line-clamp-1 max-w-full">{awayName}</span>
                        </div>
                      </div>

                      {/* Footer Info Line (Channel/Commentator etc) */}
                      {(match.channel || match.commentator) && (
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-white/[0.02] text-[10px] text-gray-400">
                          {match.channel && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                              <Tv size={11} className="text-amber-500" />
                              <span className="font-bold">{match.channel}</span>
                            </div>
                          )}
                          {match.commentator && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                              <Volume2 size={11} className="text-emerald-500" />
                              <span className="font-medium">بصوت: {match.commentator}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          {currentList.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/5 hover:border-white/15 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/5 hover:border-white/15 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
              >
                <ChevronRight size={16} />
              </button>

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {currentList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-5 bg-amber-500' : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
