import React from 'react';
import { motion } from 'motion/react';
import { Clock, Trophy, MapPin, Tv, Mic, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';
import FollowMatchButton from './FollowMatchButton';
import { Match } from '../types';
import { generateMatchEvents } from './TimelineView';
import { cn } from '../lib/utils';
import MatchCountdown from './MatchCountdown';
import { translationService } from '../services/translationService';
import ImageResolver from './ui/ImageResolver';
import LivePulse from './ui/LivePulse';

interface MatchHeaderProps {
  match?: Match;
}

export default function MatchHeader({ match: propMatch }: MatchHeaderProps) {
  const navigate = useNavigate();
  // Ensure we have a match
  const match = propMatch;

  if (!match) return null;

  const statusStr = typeof match?.status === 'object' && match?.status !== null ? (match.status as any).short : match?.status;
  
  const isLive = !!(match?.isLive || 
                 statusStr === 'LIVE' || 
                 statusStr === '1H' || 
                 statusStr === '2H' || 
                 statusStr === 'HT' || 
                 statusStr === 'ET' || 
                 statusStr === 'P' || 
                 statusStr === 'BT' ||
                 statusStr === 'LIVE_COMMENTARY' ||
                 statusStr === 'IN_PLAY' ||
                 statusStr === 'DURING_MATCH');

  const isFinished = statusStr === 'FINISHED' || statusStr === 'FT' || statusStr === 'AET' || statusStr === 'PEN';

  // Local state for checking user's favorite setting
  const [isFavorite, setIsFavorite] = React.useState(false);

  // Generate scorers based on the match events to render them FotMob style!
  const events = React.useMemo(() => generateMatchEvents(match), [match]);
  const scorers = React.useMemo(() => {
    return events.filter(e => e.type === 'goal');
  }, [events]);

  const homeScorers = scorers.filter(s => s.team === 'home');
  const awayScorers = scorers.filter(s => s.team === 'away');

  const formattedTime = React.useMemo(() => {
    try {
      const timeStr = match.startTime || (match as any).utcDate || new Date().toISOString();
      return new Date(timeStr).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '22:00';
    }
  }, [match.startTime, (match as any).utcDate]);

  const formattedDate = React.useMemo(() => {
    try {
      const dateStr = match.startTime || (match as any).utcDate || new Date().toISOString();
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }, [match.startTime]);

  const rawHomeName = match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam) : '';
  const rawAwayName = match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam) : '';
  const homeName = translationService.translateTeam(rawHomeName);
  const awayName = translationService.translateTeam(rawAwayName);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#04060b] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      style={{ direction: 'rtl' }}
    >
      {/* Search Engine Optimization: One H1 tag for the page */}
      <h1 className="sr-only">مباراة {homeName} ضد {awayName} - بث مباشر، تشكيلات، إحصائيات وتحليل الذكاء الاصطناعي | صافرة 90</h1>

      {/* Background premium glow spots */}
      <div className="absolute -top-12 -right-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-1/3 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner: League details & Leg details */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative p-1 bg-white/5 rounded-xl border border-white/10 shadow-inner">
            <ImageResolver src={match.leagueLogo || undefined} fallbackType="league" alt="League" className="w-6 h-6 rounded-lg object-contain saturate-125" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs sm:text-sm font-black tracking-tight">
              {match.league ? translationService.translateCompetition(typeof match.league === 'object' ? (match.league as any).name : match.league) : ''}
            </span>
            <span className="text-gray-400 text-[10px] font-bold">الدوري والبطولة المحلية</span>
          </div>
        </div>

        {/* Favorite Star and Match Day actions */}
        <div className="flex items-center gap-2">
          {match.id && (
            <FollowMatchButton matchId={String(match.id)} />
          )}
          <ShareButton 
            variant="icon"
            url={typeof window !== 'undefined' ? window.location.href : undefined}
            title={`مباراة ${homeName} ضد ${awayName}`}
            text={`النتيجة الآن: ${match.homeScore} - ${match.awayScore} | تابع لقاء ${homeName} ضد ${awayName} مباشرة على صافرة 90! ⚽`}
          />
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "p-2.5 rounded-xl border transition-all duration-300 cursor-pointer outline-none",
              isFavorite 
                ? "bg-amber-500/25 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                : "bg-white/5 border-white/5 hover:border-white/10 text-gray-400 hover:text-white"
            )}
            title="حفظ في المفضلة"
          >
            <Star size={15} className={isFavorite ? "fill-amber-400 text-amber-400" : ""} />
          </button>
          
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-black hidden sm:inline-block">
            إياب دور الإقصاء
          </span>
          
          {isLive && (
            <button 
              onClick={() => navigate(`/live/${match.id}`)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1.5 shadow-[0_5px_15px_rgba(220,38,38,0.4)] animate-pulse transition-all active:scale-95"
            >
              <Tv size={12} />
              شاهد البث
            </button>
          )}
        </div>
      </div>

      {/* Centerpiece Container with Teams, Logo & Score */}
      <div className="p-6 sm:p-10 md:p-12 space-y-8">
        <div className="grid grid-cols-12 gap-4 items-center">
          
          {/* Home Team Design */}
          <div 
            onClick={() => navigate(`/team/${encodeURIComponent(homeName)}`)}
            className="col-span-4 flex flex-col items-center text-center space-y-4 cursor-pointer group/home select-none hover:scale-105 transition-all duration-300"
          >
            <div className="relative group">
              {/* Outer circle glow on hover */}
              <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center p-3 sm:p-4 rounded-full bg-[#111827]/85 border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all group-hover:border-emerald-500/30">
                <ImageResolver 
                  src={match.homeLogo || undefined} 
                  fallbackType="team" 
                  fallbackText={homeName} 
                  tla={typeof match.homeTeam === 'object' ? match.homeTeam.tla : undefined}
                  alt={homeName} 
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base md:text-xl font-black text-white leading-tight tracking-tight hover:text-emerald-400 transition-colors flex flex-col items-center gap-2">
                {homeName}
                {typeof match.homeTeam === 'object' && (match.homeTeam as any).isPlaceholder && (
                  <span className="text-[10px] bg-amber-400/10 text-amber-500 px-3 py-1 rounded-full border border-amber-400/20 font-black flex items-center gap-1.5">
                    <span>🏆</span> بانتظار تحديد الفريق
                  </span>
                )}
              </h2>
              <span className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2.5 py-0.5 rounded-full font-black inline-block">
                صاحب الأرض
              </span>
            </div>
          </div>

          {/* Central Score and Time Panel */}
          <div className="col-span-4 flex flex-col items-center justify-center text-center space-y-4">
            {isLive ? (
              <div className="flex flex-col items-center gap-2">
                {/* Live Minute badge */}
                <span className="flex items-center gap-1.5 bg-red-600/15 border border-red-500/30 px-3.5 py-1.5 rounded-full text-red-500 text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                  <LivePulse size="sm" color="bg-red-500" />
                  مباشر • {match.minute}'
                </span>
                
                {/* Real-time score display */}
                <motion.div 
                  key={`live-score-${match.homeScore}-${match.awayScore}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-3 sm:gap-4 mt-2 select-none"
                >
                  <span className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                    {match.homeScore}
                  </span>
                  <span className="text-primary text-2xl sm:text-4xl font-black animate-pulse">:</span>
                  <span className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                    {match.awayScore}
                  </span>
                </motion.div>
              </div>
            ) : isFinished ? (
              <div className="flex flex-col items-center gap-2">
                <span className="bg-white/5 border border-white/10 text-gray-400 px-4 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider block">
                  انتهت المباراة
                </span>
                
                {/* Final Score display */}
                <motion.div 
                  key={`finished-score-${match.homeScore}-${match.awayScore}`}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 sm:gap-4 mt-2 select-none"
                >
                  <span className="text-4xl sm:text-6xl font-black text-gray-200 font-mono tracking-tighter tabular-nums">
                    {match.homeScore}
                  </span>
                  <span className="text-gray-600 text-2xl sm:text-4xl font-black">:</span>
                  <span className="text-4xl sm:text-6xl font-black text-gray-200 font-mono tracking-tighter tabular-nums">
                    {match.awayScore}
                  </span>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {/* Future Match Time Info */}
                <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black block whitespace-nowrap shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                  {formattedTime}
                </span>
                
                {/* "VS" Separator or Countdown */}
                {match.startTime && new Date(match.startTime).getTime() > Date.now() ? (
                  <MatchCountdown startTime={match.startTime} size="md" className="my-1.5" />
                ) : (
                  <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-white/10 bg-white/[0.02] shadow-inner my-1.5 text-xs sm:text-sm font-black text-gray-400">
                    VS
                  </div>
                )}
 
                <span className="text-[10px] sm:text-xs font-extrabold text-gray-400 block max-w-[120px] truncate">
                  {formattedDate}
                </span>
              </div>
            )}
          </div>
 
          {/* Away Team Design */}
          <div 
            onClick={() => navigate(`/team/${encodeURIComponent(awayName)}`)}
            className="col-span-4 flex flex-col items-center text-center space-y-4 cursor-pointer group/away select-none hover:scale-105 transition-all duration-300"
          >
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-l from-blue-500 to-indigo-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center p-3 sm:p-4 rounded-full bg-[#111827]/85 border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all group-hover:border-blue-500/30">
                <ImageResolver 
                  src={match.awayLogo || undefined} 
                  fallbackType="team" 
                  fallbackText={awayName} 
                  tla={typeof match.awayTeam === 'object' ? match.awayTeam.tla : undefined}
                  alt={awayName} 
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" 
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base md:text-xl font-black text-white leading-tight tracking-tight hover:text-blue-400 transition-colors flex flex-col items-center gap-2">
                {awayName}
                {typeof match.awayTeam === 'object' && (match.awayTeam as any).isPlaceholder && (
                  <span className="text-[10px] bg-amber-400/10 text-amber-500 px-3 py-1 rounded-full border border-amber-400/20 font-black flex items-center gap-1.5">
                    <span>🏆</span> بانتظار تحديد الفريق
                  </span>
                )}
              </h2>
              <span className="text-[10px] sm:text-xs bg-blue-500/10 text-blue-400 border border-blue-500/15 px-2.5 py-0.5 rounded-full font-black inline-block">
                الفريق الضيف
              </span>
            </div>
          </div>
 
        </div>
 
        {/* Scorers Sub-list (Exclusive FotMob Touch!) */}
        {scorers.length > 0 && (
          <div className="grid grid-cols-12 gap-3 border-t border-white/10 pt-5 text-xs text-gray-400 font-bold font-sans">
            {/* Home scorers - aligned right */}
            <div className="col-span-5 text-right space-y-2 pr-2">
              {homeScorers.map(s => (
                <div key={s.id} className="flex items-center gap-2 justify-start text-right">
                  <span className="text-white font-extrabold text-xs sm:text-sm hover:text-primary transition-colors cursor-pointer">{s.player}</span>
                  <span className="text-emerald-400 font-black">({s.minute}')</span>
                  <span className="text-[10px] text-gray-500 hidden md:inline-block font-medium">⚽ ({s.detail})</span>
                </div>
              ))}
            </div>
 
            {/* Separator / Ball */}
            <div className="col-span-2 flex items-center justify-center text-gray-600">
              <span className="text-sm leading-none filter drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]">⚽</span>
            </div>
 
            {/* Away scorers - aligned left */}
            <div className="col-span-5 text-left space-y-2 pl-2">
              {awayScorers.map(s => (
                <div key={s.id} className="flex items-center gap-2 justify-end text-left">
                  <span className="text-[10px] text-gray-500 hidden md:inline-block font-medium">({s.detail}) ⚽</span>
                  <span className="text-amber-500 font-black">({s.minute}')</span>
                  <span className="text-white font-extrabold text-xs sm:text-sm hover:text-primary transition-colors cursor-pointer">{s.player}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
 
      {/* Match Meta Information Drawer Footer: Stadium, Referee, etc. */}
      {(match.stadium || match.commentator || match.channel) && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 bg-white/[0.01] px-6 py-4 text-xs text-gray-400 font-bold">
          {match.stadium && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin size={13} className="text-emerald-400" />
              <span>{translationService.translateStadium(match.stadium)}</span>
            </div>
          )}
          {match.channel && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Tv size={13} className="text-emerald-400" />
              <span>{translationService.translateText(match.channel)}</span>
            </div>
          )}
          {match.commentator && (
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Mic size={13} className="text-emerald-400" />
              <span>{translationService.translateText(match.commentator)}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
