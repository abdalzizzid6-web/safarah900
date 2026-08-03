import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useMatches, useFixtures, useResults } from '../../hooks/useMatchesV2';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { BlockType, Match } from '../../types';
import { ScoreFlash } from './shared';
import MatchCountdown from '../../components/MatchCountdown';
import { normalizeMatchDate, getMatchTimestamp } from '../../core/utils/matchNormalization';

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

  let activeRes = todayRes;
  if (type === BlockType.TOMORROW_MATCHES) activeRes = tomorrowRes;
  else if (type === BlockType.FINISHED_MATCHES) activeRes = resultsRes;

  const loading = activeRes.isLoading;
  const isError = activeRes.isError;
  const rawMatches: Match[] = Array.isArray(activeRes.data) ? activeRes.data : [];

  let matches: Match[] = [];

  if (!loading && rawMatches.length > 0) {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    matches = [...rawMatches].filter(m => {
      const mTime = getMatchTimestamp(m.startTime || m.utcDate);
      if (mTime > 0 && mTime < threeDaysAgo) return false;
      
      if (excludeLive) {
        const isLive = m.isLive || ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status);
        if (isLive) return false;
      }
      return true;
    }).sort((a, b) => {
      const getStatusPriority = (m: Match) => {
        if (m.isLive || ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status)) return 3;
        if (['NS', 'SCHEDULED', 'TIMED'].includes(m.status)) return 2;
        if (['FT', 'AET', 'PEN', 'FINISHED'].includes(m.status)) return 1;
        return 0;
      };
      
      const pA = getStatusPriority(a);
      const pB = getStatusPriority(b);
      
      if (pA !== pB) return pB - pA;
      
      const timeA = getMatchTimestamp(a.startTime || a.utcDate);
      const timeB = getMatchTimestamp(b.startTime || b.utcDate);
      
      if (pA === 1) {
        return timeB - timeA;
      }
      
      return timeA - timeB;
    });
  }

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

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#0a0f18] rounded-2xl border border-white/5 p-4 flex justify-between items-center">
              <div className="w-1/3 h-8 bg-white/5 rounded-lg" />
              <div className="w-1/4 h-8 bg-white/10 rounded-lg" />
              <div className="w-1/3 h-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-[#0a0f18] rounded-2xl border border-red-500/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-xs text-gray-400 font-medium">تعذر تحميل جدول المباريات حالياً</p>
          <button 
            onClick={() => activeRes.refetch()} 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw size={14} /> إعادة المحاولة
          </button>
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="p-8 bg-[#0a0f18] rounded-2xl border border-white/5 text-center space-y-3">
          <Calendar className="w-8 h-8 text-white/20 mx-auto" />
          <p className="text-xs text-gray-400 font-medium">لا توجد مباريات مبرمجة في هذا القسم اليوم</p>
        </div>
      ) : (
        <motion.div 
          key={type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-3"
        >
          {displayMatches.map((match, index) => {
            const homeTeamName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
            const homeTeamLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : '';
            const awayTeamName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
            const awayTeamLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : '';
            const leagueName = typeof match.league === 'object' ? match.league.name : match.league;
            const matchDate = normalizeMatchDate(match.startTime || match.utcDate);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
                        <img src={homeTeamLogo} alt={homeTeamName} className="w-8 h-8 object-contain" loading="lazy" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                      )}
                      <span className="font-bold text-sm text-white truncate">{homeTeamName}</span>
                    </div>

                    {/* Score / Time */}
                    <div className="flex flex-col items-center justify-center w-1/3">
                      {match.status === 'FINISHED' || match.status === 'LIVE' || match.isLive ? (
                        <ScoreFlash homeScore={match.homeScore ?? 0} awayScore={match.awayScore ?? 0} size="lg" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-white/60 bg-white/5 px-3 py-1 rounded-full">
                            {matchDate ? format(matchDate, 'hh:mm a', { locale: ar }) : '10:00 PM'}
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
                        <img src={awayTeamLogo} alt={awayTeamName} className="w-8 h-8 object-contain" loading="lazy" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
}
