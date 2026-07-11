import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Match } from '../../types';
import { Link } from 'react-router-dom';
import { ScoreFlash } from '../components/shared';

interface PremiumHeroSectionProps {
  match: Match;
}

export default function PremiumHeroSection({ match }: PremiumHeroSectionProps) {
  const homeTeam = typeof match.homeTeam === 'object' ? match.homeTeam : { name: match.homeTeam, logo: '' };
  const awayTeam = typeof match.awayTeam === 'object' ? match.awayTeam : { name: match.awayTeam, logo: '' };
  const league = typeof match.league === 'object' ? match.league : { name: match.league, logo: '' };
  
  // RTL means left is generally right and right is left, but the design shows:
  // Spain on the left (maybe away?) and France on the right (maybe home?).
  // We'll just render Home on the right and Away on the left, consistent with RTL.

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-[#0a0f18] group"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#111927] to-[#0a0f18] z-0" />

      {/* Grid Pattern or Stadium background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-25 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80')` }}
      />
      
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full z-0 pointer-events-none" />

      <div className="relative z-20 p-6 flex flex-col items-center">
        {/* League Title */}
        <h3 className="text-xs font-medium text-white/80 mb-6">{league.name}</h3>

        <div className="flex justify-between items-center w-full px-4 mb-8">
          
          {/* Home Team (Right Side in RTL) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {homeTeam.logo ? (
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
            <span className="text-sm font-bold text-white">{homeTeam.name}</span>
          </div>

          {/* Score & Status */}
          <div className="flex flex-col items-center">
            <ScoreFlash homeScore={match.homeScore ?? 0} awayScore={match.awayScore ?? 0} size="xl" className="mb-2" />
            
            <div className="flex items-center gap-2">
              {match.minute && (
                <div className="bg-green-600/20 border border-green-500/30 px-3 py-0.5 rounded-full">
                  <span className="text-[11px] font-bold text-green-500">{match.minute}'</span>
                </div>
              )}
              {match.status === 'LIVE' && (
                <div className="bg-red-600 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  <span className="text-[11px] font-bold text-white">مباشر</span>
                </div>
              )}
            </div>
          </div>

          {/* Away Team (Left Side in RTL) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {awayTeam.logo ? (
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
            <span className="text-sm font-bold text-white">{awayTeam.name}</span>
          </div>
        </div>

        {/* Watch Button */}
        <Link 
          to={`/match/${match.id}`}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black px-8 py-3 rounded-2xl w-3/4 max-w-xs font-black transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5"
        >
          <Play size={16} className="fill-black" />
          <span>مشاهدة المباراة</span>
        </Link>
      </div>
    </motion.section>
  );
}
