import React from 'react';
import { motion } from 'motion/react';
import { Play, Tv, MapPin, Mic, Trophy, Sparkles } from 'lucide-react';
import { Match } from '../../types';
import { Link } from 'react-router-dom';
import { ScoreFlash } from '../components/shared';
import MatchCountdown from '../../components/MatchCountdown';
import { normalizeMatchDate } from '../../core/utils/matchNormalization';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PremiumHeroSectionProps {
  match: Match;
}

export default function PremiumHeroSection({ match }: PremiumHeroSectionProps) {
  const homeTeam = typeof match.homeTeam === 'object' ? match.homeTeam : { name: match.homeTeam || match.homeName || 'الرئيسي', logo: match.homeLogo || '' };
  const awayTeam = typeof match.awayTeam === 'object' ? match.awayTeam : { name: match.awayTeam || match.awayName || 'الضيف', logo: match.awayLogo || '' };
  const league = typeof match.league === 'object' ? match.league : { name: match.league || 'البطولة الرئيسية', logo: match.leagueLogo || '' };

  const isLive = match.isLive || ['LIVE', 'IN_PLAY', 'PAUSED', '1H', '2H', 'HT'].includes(match.status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status);

  const matchDate = normalizeMatchDate(match.startTime || match.utcDate);

  // Predictions calculation fallback
  const homeWinProb = match.predictions?.homeWinPercent || 52;
  const drawProb = match.predictions?.drawPercent || 26;
  const awayWinProb = match.predictions?.awayWinPercent || 22;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-[#080d16] group"
    >
      {/* Dynamic Background Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111c2e]/90 via-[#0a0f18]/95 to-[#080d16] z-0" />

      {/* Stadium / Grid Background overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-20 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80')` }}
      />

      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full z-0 pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-8 flex flex-col items-center">
        {/* Top Tag & Competition */}
        <div className="flex items-center gap-2 mb-6">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-wide">
            <Trophy size={13} />
            <span>قمة اليوم</span>
          </span>
          <span className="text-white/40 text-xs">•</span>
          <span className="text-xs font-bold text-white/80">{league.name}</span>
        </div>

        {/* Teams & Score Row */}
        <div className="grid grid-cols-3 items-center w-full max-w-3xl mb-6">
          
          {/* Home Team (Right Side in RTL) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 p-3 shadow-xl backdrop-blur-md flex items-center justify-center group-hover:border-amber-500/30 transition-all">
              {homeTeam.logo ? (
                <img src={homeTeam.logo} alt={homeTeam.name} className="w-full h-full object-contain" loading="lazy" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                  {homeTeam.name?.charAt(0) || 'H'}
                </div>
              )}
            </div>
            <span className="text-sm sm:text-base font-black text-white line-clamp-1">{homeTeam.name}</span>
          </div>

          {/* Center Info: Score or Time */}
          <div className="flex flex-col items-center justify-center text-center px-2">
            {isLive || isFinished ? (
              <div className="flex flex-col items-center">
                <ScoreFlash homeScore={match.homeScore ?? match.score?.home ?? 0} awayScore={match.awayScore ?? match.score?.away ?? 0} size="xl" />
                {isLive && (
                  <div className="mt-2 flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 px-3 py-0.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[11px] font-black text-red-400">مباشر {match.minute ? `'${match.minute}` : ''}</span>
                  </div>
                )}
                {isFinished && (
                  <span className="mt-2 text-[10px] font-bold text-white/40 bg-white/5 px-2.5 py-0.5 rounded-md">انتهت المباراة</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1.5">
                <div className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-white font-mono text-base font-bold">
                  {matchDate ? format(matchDate, 'hh:mm a', { locale: ar }) : '22:00'}
                </div>
                {match.startTime && (
                  <MatchCountdown startTime={match.startTime} />
                )}
              </div>
            )}
          </div>

          {/* Away Team (Left Side in RTL) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 p-3 shadow-xl backdrop-blur-md flex items-center justify-center group-hover:border-amber-500/30 transition-all">
              {awayTeam.logo ? (
                <img src={awayTeam.logo} alt={awayTeam.name} className="w-full h-full object-contain" loading="lazy" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                  {awayTeam.name?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <span className="text-sm sm:text-base font-black text-white line-clamp-1">{awayTeam.name}</span>
          </div>

        </div>

        {/* Stadium, Channel & Commentator Bar */}
        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6 text-[11px] text-white/70">
          <div className="flex items-center justify-center gap-1.5 truncate">
            <MapPin size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">{match.stadium || 'الملعب الرئيسي'}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 truncate">
            <Tv size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">{match.channel || 'beIN Sports HD'}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 truncate">
            <Mic size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">{match.commentator || 'عصام الشوالي'}</span>
          </div>
        </div>

        {/* Win Probability Bar */}
        <div className="w-full max-w-md space-y-1.5 mb-6">
          <div className="flex justify-between items-center text-[10px] font-bold text-white/60">
            <span>توقع الفوز: {homeTeam.name} ({homeWinProb}%)</span>
            <span>تعادل ({drawProb}%)</span>
            <span>{awayTeam.name} ({awayWinProb}%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden flex">
            <div style={{ width: `${homeWinProb}%` }} className="bg-amber-500 h-full" />
            <div style={{ width: `${drawProb}%` }} className="bg-gray-400 h-full" />
            <div style={{ width: `${awayWinProb}%` }} className="bg-blue-500 h-full" />
          </div>
        </div>

        {/* Action Button */}
        <Link 
          to={`/match/${match.id}`}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black px-8 py-3 rounded-xl w-full max-w-xs font-black transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5"
        >
          <Play size={16} className="fill-black" />
          <span>تفاصيل المباراة والبث المباشر</span>
        </Link>
      </div>
    </motion.section>
  );
}

