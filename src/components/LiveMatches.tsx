import React, { useMemo } from 'react';
import { useLiveMatches } from '../hooks/useFootballApi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { filterMatchesByCustomLeagues } from '../utils/leagueFilter';
import ImageResolver from './ui/ImageResolver';

import LivePulse from './ui/LivePulse';

export default function LiveMatches({ searchQuery = '' }: { searchQuery?: string }) {
  const navigate = useNavigate();
  const { data: qLiveMatches, isLoading, error } = useLiveMatches();

  const liveMatches = useMemo(() => {
    const list = Array.isArray(qLiveMatches) ? qLiveMatches : [];
    let baseList = filterMatchesByCustomLeagues(list).filter(m => m.showInLive !== false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      baseList = baseList.filter(m => {
        const hName = typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam;
        const aName = typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam;
        const lName = typeof m.league === 'object' ? m.league?.name : m.league;
        return (hName || '').toLowerCase().includes(q) || (aName || '').toLowerCase().includes(q) || (lName || '').toLowerCase().includes(q);
      });
    }
    return baseList;
  }, [qLiveMatches, searchQuery]);

  if (isLoading) {
    return <div className="p-4 text-center text-xs text-gray-400">جاري تحميل المباريات المباشرة...</div>;
  }

  if (error || liveMatches.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {liveMatches.slice(0, 6).map(match => {
        const homeLogo = (typeof match.homeTeam === 'object' ? match.homeTeam?.logo : undefined) || match.homeLogo || 'https://media.api-sports.io/football/teams/unknown.png';
        const awayLogo = (typeof match.awayTeam === 'object' ? match.awayTeam?.logo : undefined) || match.awayLogo || 'https://media.api-sports.io/football/teams/unknown.png';
        const homeName = typeof match.homeTeam === 'object' ? match.homeTeam?.name : match.homeTeam;
        const awayName = typeof match.awayTeam === 'object' ? match.awayTeam?.name : match.awayTeam;

        return (
          <div key={match.id} onClick={() => navigate(`/match/${match.id}`)} className="bg-surface border border-white/[0.05] rounded-3xl p-5 hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 w-[40%]">
                <ImageResolver 
                  src={homeLogo} 
                  alt={homeName}
                  fallbackType="team"
                  fallbackText={homeName}
                  className="w-10 h-10 object-contain drop-shadow" 
                />
                <span className="font-bold text-sm text-white truncate">{homeName}</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-2 w-[20%] text-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <LivePulse size="sm" color="bg-red-500" />
                  <span className="bg-error text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(255,45,85,0.4)]">LIVE</span>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(0,223,130,0.12)] animate-pulse inline-flex items-center justify-center">
                  <span className="text-base sm:text-lg font-black font-mono text-success leading-none">
                    {(match.score?.home ?? (match.homeScore ?? 0))} - {(match.score?.away ?? (match.awayScore ?? 0))}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold mt-0.5">{match.minute ? `${match.minute}'` : ''}</span>
              </div>
              <div className="flex items-center gap-3 flex-row-reverse w-[40%]">
                <ImageResolver 
                  src={awayLogo} 
                  alt={awayName}
                  fallbackType="team"
                  fallbackText={awayName}
                  className="w-10 h-10 object-contain drop-shadow" 
                />
                <span className="font-bold text-sm text-white truncate text-left">{awayName}</span>
              </div>
            </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></div> جودة عالية</span>
            <button className="bg-error hover:bg-error/90 text-white font-bold text-[11px] px-6 py-2 rounded-full transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,45,85,0.3)]">
              مشاهدة مباشرة
            </button>
          </div>
          </div>
        );
      })}
    </div>
  );
}
