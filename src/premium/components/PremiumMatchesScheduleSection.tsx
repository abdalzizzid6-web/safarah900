import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useMatches, useFixtures, useResults } from '../../hooks/useMatchesV2';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, Timer } from 'lucide-react';
import { BlockType, Match } from '../../types';
import { ScoreFlash } from './shared';

function MatchCountdown({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const targetDate = new Date(startTime).getTime();
    if (isNaN(targetDate)) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft('تبدأ الآن');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`بعد ${days} يوم و ${hours} ساعة`);
      } else if (hours > 0) {
        setTimeLeft(`بعد ${hours} ساعة و ${minutes} دقيقة`);
      } else if (minutes > 0) {
        setTimeLeft(`بعد ${minutes} دقيقة و ${seconds} ثانية`);
      } else {
        setTimeLeft(`بعد ${seconds} ثانية`);
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 mt-2.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 w-fit mx-auto justify-center">
      <Timer size={12} className="text-amber-500" />
      <span className="text-[10px] font-bold text-amber-500 tracking-wide" dir="rtl">{timeLeft}</span>
    </div>
  );
}

interface Props {
  title?: string;
  type?: BlockType;
  maxItems?: number;
  excludeLive?: boolean;
}

export default function PremiumMatchesScheduleSection({ title = "جدول المباريات", type = BlockType.TODAY_MATCHES, maxItems = 4, excludeLive = false }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  // Choose hook based on block type
  const todayRes = useMatches({ date: today });
  const tomorrowRes = useFixtures({ date: tomorrow });
  const resultsRes = useResults();

  let matches: Match[] = [];
  let loading = false;

  if (type === BlockType.TODAY_MATCHES) {
    matches = todayRes.data || [];
    loading = todayRes.isLoading;
  } else if (type === BlockType.TOMORROW_MATCHES) {
    matches = tomorrowRes.data || [];
    loading = tomorrowRes.isLoading;
  } else if (type === BlockType.FINISHED_MATCHES) {
    matches = resultsRes.data || [];
    loading = resultsRes.isLoading;
  } else {
    matches = todayRes.data || [];
    loading = todayRes.isLoading;
  }

  if (!loading && matches.length > 0) {
    // Filter very old matches (older than 3 days)
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    
    matches = [...matches].filter(m => {
      const mTime = new Date(m.startTime || m.utcDate || 0).getTime();
      if (mTime < threeDaysAgo) return false;
      
      if (excludeLive) {
        const isLive = m.isLive || ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status);
        if (isLive) return false;
      }
      return true;
    }).sort((a, b) => {
      // Priority 1: LIVE
      // Priority 2: SCHEDULED / UPCOMING
      // Priority 3: FINISHED
      const getStatusPriority = (m: Match) => {
        if (m.isLive || ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status)) return 3;
        if (['NS', 'SCHEDULED', 'TIMED'].includes(m.status)) return 2;
        if (['FT', 'AET', 'PEN', 'FINISHED'].includes(m.status)) return 1;
        return 0;
      };
      
      const pA = getStatusPriority(a);
      const pB = getStatusPriority(b);
      
      if (pA !== pB) return pB - pA;
      
      // If same priority, sort by time
      const timeA = new Date(a.startTime || a.utcDate || 0).getTime();
      const timeB = new Date(b.startTime || b.utcDate || 0).getTime();
      
      if (pA === 1) {
        // Finished matches: newest first
        return timeB - timeA;
      }
      
      // Live / Upcoming matches: soonest first
      return timeA - timeB;
    });
  }

  if (loading || matches.length === 0) return null;

  const displayMatches = matches.slice(0, maxItems || 4);

  return (
    <section className="space-y-4">
      {title && title.trim() !== "" && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <Link to="/matches" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Calendar size={16} className="text-white" />
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {displayMatches.map((match, index) => {
          const homeTeamName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
          const homeTeamLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : '';
          const awayTeamName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
          const awayTeamLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : '';
          const leagueName = typeof match.league === 'object' ? match.league.name : match.league;
          const leagueLogo = typeof match.league === 'object' ? match.league.logo : '';

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                to={`/match/${match.id}`}
                className="flex flex-col p-4 bg-[#0a0f18] rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-lg"
              >
                {/* League Header & Status Badge */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                  <span className="text-[10px] font-bold text-white/50">{leagueName}</span>
                  
                  {/* Status Badge */}
                  {(() => {
                    const isLive = match.isLive || ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status);
                    const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);
                    
                    if (isLive) {
                      return (
                        <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          <span className="text-[9px] font-bold text-green-500">جارية الآن</span>
                        </div>
                      );
                    }
                    if (isFinished) {
                      return (
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          <span className="text-[9px] font-bold text-white/40">انتهت</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <span className="text-[9px] font-bold text-amber-500">قادمة</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 w-1/3">
                    {homeTeamLogo ? (
                      <img src={homeTeamLogo} alt={homeTeamName} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                    )}
                    <span className="font-bold text-sm text-white truncate">{homeTeamName}</span>
                  </div>

                  {/* Score / Time */}
                  <div className="flex flex-col items-center justify-center w-1/3">
                    {match.status === 'FINISHED' || match.status === 'LIVE' || match.isLive ? (
                      <ScoreFlash homeScore={match.homeScore} awayScore={match.awayScore} size="lg" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-white/60 bg-white/5 px-3 py-1 rounded-full">
                          {match.startTime ? format(new Date(match.startTime), 'hh:mm a', { locale: ar }) : '10:00 PM'}
                        </span>
                        {match.startTime && (
                          <MatchCountdown startTime={match.startTime} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-end gap-3 w-1/3">
                    <span className="font-bold text-sm text-white truncate text-right">{awayTeamName}</span>
                    {awayTeamLogo ? (
                      <img src={awayTeamLogo} alt={awayTeamName} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
