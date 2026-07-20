import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Clock, Tv, Volume2, Play } from 'lucide-react';
import { useMatches } from '../../hooks/useMatchesV2';
import { Match } from '../../types';
import ImageResolver from '../ui/ImageResolver';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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

// Inline ticking countdown component for real-time excitement
function InlineCountdown({ startTime }: { startTime?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isNear, setIsNear] = useState<boolean>(false);

  useEffect(() => {
    if (!startTime) return;
    const target = new Date(startTime).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('تبدأ الآن');
        setIsNear(false);
        return;
      }

      const diffSecs = Math.floor(diff / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);

      if (diffHours >= 24) {
        // More than 24 hours: show normal date
        try {
          setTimeLeft(format(new Date(startTime), 'd MMMM', { locale: ar }));
          setIsNear(false);
        } catch {
          setTimeLeft('');
        }
      } else {
        // Less than 24 hours: live ticking HH:MM:SS
        const h = String(diffHours).padStart(2, '0');
        const m = String(diffMins % 60).padStart(2, '0');
        const s = String(diffSecs % 60).padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
        // Highlight if starting in less than 2 hours
        setIsNear(diffHours < 2);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  if (!timeLeft) return null;

  const isTicking = timeLeft.includes(':');

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black flex items-center gap-1 transition-all duration-300 ${
      isTicking
        ? isNear
          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.08)]'
        : 'bg-white/5 text-gray-400 border border-white/5'
    }`}>
      {isTicking && (
        <span className={`w-1 h-1 rounded-full ${isNear ? 'bg-rose-500' : 'bg-amber-500'} animate-ping`} />
      )}
      <span className="font-mono tracking-wide">
        {isTicking ? `متبقي ${timeLeft}` : timeLeft}
      </span>
    </span>
  );
}

export default function MatchCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Fetch today's matches
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: rawTodayMatches, isLoading, error } = useMatches({ date: todayStr });
  const todayMatches = Array.isArray(rawTodayMatches) ? rawTodayMatches : [];

  // Filter for upcoming matches (not live and not finished)
  const upcomingMatches = todayMatches
    .filter((m: Match) => {
      const isLive = m.isLive || ['LIVE', 'IN_PLAY', 'PAUSED', 'HT', '1H', '2H', 'ET'].includes(m.status || '');
      const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(m.status || '');
      return !isLive && !isFinished && !m.isHidden;
    })
    .sort((a: Match, b: Match) => {
      const timeA = new Date(a.startTime || a.utcDate || 0).getTime();
      const timeB = new Date(b.startTime || b.utcDate || 0).getTime();
      return timeA - timeB;
    });

  // Handle scroll buttons visibility
  const updateArrowVisibility = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const absScrollLeft = Math.abs(scrollLeft);
      const isScrollable = scrollWidth > clientWidth;

      setShowRightArrow(isScrollable && absScrollLeft > 10);
      setShowLeftArrow(isScrollable && absScrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateArrowVisibility();
    window.addEventListener('resize', updateArrowVisibility);
    return () => window.removeEventListener('resize', updateArrowVisibility);
  }, [upcomingMatches.length]);

  const handleScroll = () => {
    updateArrowVisibility();
  };

  // Scroll in the given direction (adjusting for RTL)
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // width of one card + gap
      const multiplier = direction === 'left' ? -scrollAmount : scrollAmount;
      scrollContainerRef.current.scrollBy({
        left: multiplier,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[#0a0e17]/40 border border-white/5 rounded-2xl p-6 mb-6" dir="rtl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 bg-amber-500/20 rounded animate-pulse"></div>
          <div className="h-5 w-40 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-4 overflow-x-hidden">
          {[1, 2, 3].map((n) => (
            <div key={n} className="w-[280px] md:w-[320px] h-44 bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex-shrink-0 flex flex-col justify-between animate-pulse">
              <div className="flex justify-between">
                <div className="w-20 h-4 bg-white/10 rounded"></div>
                <div className="w-12 h-4 bg-white/10 rounded"></div>
              </div>
              <div className="flex justify-between items-center my-4">
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-10 h-10 rounded-full bg-white/10"></div>
                  <div className="w-12 h-3 bg-white/10 rounded"></div>
                </div>
                <div className="w-10 h-6 bg-white/10 rounded"></div>
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <div className="w-10 h-10 rounded-full bg-white/10"></div>
                  <div className="w-12 h-3 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="w-full h-3 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (upcomingMatches.length === 0) {
    return null;
  }

  return (
    <div className="w-full relative select-none" id="upcoming-matches-carousel-container" dir="rtl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
            <Clock size={16} className="text-amber-500" />
          </span>
          <div>
            <h3 className="text-sm md:text-base font-black text-white leading-none">مباريات اليوم القادمة</h3>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">توقيت انطلاق أبرز مواجهات اليوم حية ومباشرة</p>
          </div>
        </div>
        
        {/* Indicators of size */}
        <div className="text-[10px] md:text-xs text-gray-500 font-bold bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          {upcomingMatches.length} مواجهات
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Navigation Arrows (Visible on hover and desktop) */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/80 hover:bg-black text-amber-500 hover:text-white border border-white/10 hover:border-amber-500/30 backdrop-blur-md shadow-2xl transition-all duration-300 z-15 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/80 hover:bg-black text-amber-500 hover:text-white border border-white/10 hover:border-amber-500/30 backdrop-blur-md shadow-2xl transition-all duration-300 z-15 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Horizontal Scrollable Row */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-3 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {upcomingMatches.map((match: Match) => {
            const homeName = typeof match.homeTeam === 'object' ? match.homeTeam.name : (match.homeName || match.homeTeam || '');
            const homeLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : (match.homeLogo || '');
            const homeTla = typeof match.homeTeam === 'object' ? match.homeTeam.tla : '';

            const awayName = typeof match.awayTeam === 'object' ? match.awayTeam.name : (match.awayName || match.awayTeam || '');
            const awayLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : (match.awayLogo || '');
            const awayTla = typeof match.awayTeam === 'object' ? match.awayTeam.tla : '';

            const leagueName = typeof match.league === 'object' ? match.league.name : (match.league || '');
            const leagueLogo = typeof match.league === 'object' ? match.league.logo : (match.leagueLogo || '');

            const isStreamable = match.streamingLinks && match.streamingLinks.some(l => l.enabled);

            return (
              <motion.div
                key={match.id}
                className="w-[280px] md:w-[320px] flex-shrink-0 snap-center"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={`/match/${match.id}`}
                  className="block bg-gradient-to-b from-[#0e1320]/90 to-[#070b12]/95 hover:from-[#131a2b]/95 hover:to-[#090e18]/95 border border-white/5 hover:border-amber-500/20 p-4 rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden group/card"
                >
                  {/* Card Subtle Top Line Highlight */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                  
                  {/* Decorative Background Accent */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover/card:bg-amber-500/10 transition-all duration-300" />

                  {/* Header: League & Time status */}
                  <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/[0.03]">
                    {/* League Info */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      {leagueLogo ? (
                        <ImageResolver
                          src={leagueLogo}
                          alt={leagueName}
                          fallbackType="league"
                          className="w-4 h-4 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      )}
                      <span className="text-[10px] font-black text-gray-400 truncate max-w-[120px] md:max-w-[150px]">
                        {leagueName}
                      </span>
                    </div>

                    {/* Countdown/Status Badge */}
                    <div className="flex items-center gap-1">
                      <InlineCountdown startTime={match.startTime || match.utcDate} />
                      {isStreamable && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                          <Play size={8} fill="currentColor" />
                          بث
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Side-by-Side Versus Layout */}
                  <div className="grid grid-cols-7 items-center py-2.5 relative">
                    {/* Home Team */}
                    <div className="col-span-3 flex flex-col items-center text-center">
                      <div className="w-11 h-11 p-1.5 bg-white/[0.02] rounded-full border border-white/5 flex items-center justify-center shadow-md mb-1.5 group-hover/card:scale-105 transition-transform duration-300">
                        <ImageResolver
                          src={homeLogo}
                          alt={homeName}
                          fallbackType="team"
                          fallbackText={homeName}
                          tla={homeTla}
                          className="w-8 h-8 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-xs font-black text-white line-clamp-1 max-w-full">
                        {homeName}
                      </span>
                    </div>

                    {/* Central: VS and Clock */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-extrabold text-amber-500/50">VS</span>
                      <div className="flex items-center gap-0.5 mt-1 text-[11px] font-mono font-black text-amber-400 bg-amber-400/5 border border-amber-400/10 px-1.5 py-0.5 rounded-md">
                        {formatMatchTime(match.startTime || match.utcDate)}
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="col-span-3 flex flex-col items-center text-center">
                      <div className="w-11 h-11 p-1.5 bg-white/[0.02] rounded-full border border-white/5 flex items-center justify-center shadow-md mb-1.5 group-hover/card:scale-105 transition-transform duration-300">
                        <ImageResolver
                          src={awayLogo}
                          alt={awayName}
                          fallbackType="team"
                          fallbackText={awayName}
                          tla={awayTla}
                          className="w-8 h-8 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-xs font-black text-white line-clamp-1 max-w-full">
                        {awayName}
                      </span>
                    </div>
                  </div>

                  {/* Footer metadata: Channel/Commentator */}
                  {(match.channel || match.commentator) ? (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.02] text-[9px] text-gray-500 overflow-hidden truncate">
                      {match.channel && (
                        <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[120px]">
                          <Tv size={10} className="text-amber-500/70" />
                          <span className="font-bold truncate">{match.channel}</span>
                        </span>
                      )}
                      {match.commentator && (
                        <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[120px]">
                          <Volume2 size={10} className="text-emerald-500/70" />
                          <span className="font-medium truncate">{match.commentator}</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-4" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
