import React from 'react';
import { motion } from 'motion/react';
import { useLiveMatches } from '../../hooks/useMatchesV2';
import { Match } from '../../types';
import { ScoreFlash } from '../components/shared';

export default function PremiumLiveMatchesSlider() {
  const { data: liveMatches = [], isLoading } = useLiveMatches();

  if (isLoading || liveMatches.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-black text-white">المباريات المباشرة</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {liveMatches.map((match: Match) => (
          <motion.div 
            key={match.id}
            whileHover={{ scale: 1.02 }}
            className="shrink-0 w-64 bg-[#101010] p-4 rounded-2xl border border-white/5 shadow-2xl snap-center"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-white/60">{typeof match.league === 'object' ? match.league.name : match.league}</span>
              <span className="text-[10px] text-error font-bold animate-pulse">LIVE {match.minute}'</span>
            </div>
            <div className="flex justify-between items-center font-bold text-white gap-3">
              <span className="truncate">{typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam}</span>
              <ScoreFlash homeScore={match.homeScore} awayScore={match.awayScore} size="sm" />
              <span className="truncate">{typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
