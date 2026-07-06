import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { useLiveMatches } from '../../hooks/useMatchesV2';
import { Match } from '../../types';
import { Link } from 'react-router-dom';
import { ScoreFlash } from '../components/shared';

interface Props {
  title?: string;
  maxItems?: number;
}

export default function PremiumLiveMatchesList({ title = "مباريات مباشرة", maxItems = 3 }: Props) {
  const { data: liveMatchesData = [], isLoading } = useLiveMatches();

  if (isLoading || !Array.isArray(liveMatchesData) || liveMatchesData.length === 0) return null;

  // Ensure live matches are also sorted by time and filtered for old matches just in case
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const liveMatches = [...liveMatchesData]
    .filter(m => {
      const mTime = new Date(m.startTime || m.utcDate || 0).getTime();
      return mTime >= threeDaysAgo;
    })
    .sort((a, b) => {
      const timeA = new Date(a.startTime || a.utcDate || 0).getTime();
      const timeB = new Date(b.startTime || b.utcDate || 0).getTime();
      return timeA - timeB;
    });

  if (liveMatches.length === 0) return null;

  return (
    <section className="space-y-4">
      {title && title.trim() !== "" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            <h2 className="text-lg font-black text-white">{title}</h2>
          </div>
          <Link to="/matches" className="text-xs text-amber-500 font-bold hover:text-amber-400 transition-colors">
            عرض الكل
          </Link>
        </div>
      )}
      
      <div className="space-y-3">
        {liveMatches.slice(0, maxItems).map((match: Match) => {
          const homeTeamName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
          const homeTeamLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : '';
          const awayTeamName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
          const awayTeamLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : '';

          return (
            <Link key={match.id} to={`/match/${match.id}`}>
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between bg-[#0e0e0e] p-4 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors"
              >
                {/* Home Team */}
                <div className="flex items-center gap-3 w-1/3">
                  {homeTeamLogo ? (
                    <img src={homeTeamLogo} alt={homeTeamName} className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                  )}
                  <span className="font-bold text-sm text-white truncate">{homeTeamName}</span>
                </div>

                {/* Score & Minute */}
                <div className="flex flex-col items-center justify-center w-1/3">
                  <ScoreFlash homeScore={match.homeScore} awayScore={match.awayScore} size="md" />
                  {(() => {
                    const isLive = match.isLive || ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status);
                    const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);
                    
                    if (isLive) {
                      return (
                        <div className="flex items-center gap-1 bg-green-600/20 px-2 py-0.5 rounded-full mt-1 border border-green-500/20">
                          <span className="relative flex h-1 w-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1 w-1 bg-green-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-green-500">{match.minute ? `${match.minute}'` : 'جارية الآن'}</span>
                        </div>
                      );
                    }
                    if (isFinished) {
                      return (
                        <div className="bg-white/5 px-2 py-0.5 rounded-full border border-white/10 mt-1">
                          <span className="text-[10px] font-bold text-white/40">انتهت</span>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mt-1">
                        <span className="text-[10px] font-bold text-amber-500">قادمة</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-end gap-3 w-1/3">
                  <span className="font-bold text-sm text-white truncate text-right">{awayTeamName}</span>
                  {awayTeamLogo ? (
                    <img src={awayTeamLogo} alt={awayTeamName} className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                  )}
                  <ChevronLeft className="w-4 h-4 text-white/20 group-hover:text-amber-500 transition-colors" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
