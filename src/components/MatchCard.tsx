import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Timer, Radio, Tv, Activity, Crosshair, ChevronLeft, Star, Bell, BellOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Match } from '../types';
import { cn, formatTime } from '../lib/utils';
import { handleImageError, getTeamLogoUrl, getFallbackImageUrl } from '../utils/teamUtils';
import { createSlugPath } from '../utils/slugify';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useNotifications } from '../context/NotificationContext';
import { useError } from '../context/ErrorContext';
import { TranslatedText } from './TranslatedText';
import ImageResolver from './ui/ImageResolver';
const MotionImageResolver = motion.create(ImageResolver as any);;

interface MatchCardProps {
  match: Match;
  key?: string;
}

interface TeamLogoWithGlowProps {
  logoUrl: string;
  teamName: string;
  tla?: string;
  isLive?: boolean;
}

function TeamLogoWithGlow({ logoUrl, teamName, tla, isLive }: TeamLogoWithGlowProps) {
  return (
    <div className="relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 group/logo select-none">
      {/* Glow shadow matching original logo colors */}
      <MotionImageResolver fallbackType="team" fallbackText={teamName} tla={tla}
        src={logoUrl}
        alt=""
        onError={(e: any) => handleImageError(e, getFallbackImageUrl(teamName))}
        animate={isLive ? {
          scale: [0.95, 1.2, 0.95],
          opacity: [0.35, 0.7, 0.35]
        } : {}}
        transition={isLive ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
        className="absolute w-12 h-12 md:w-14 md:h-14 object-contain filter blur-xl opacity-40 select-none pointer-events-none transition-all duration-700 ease-out scale-95 group-hover/logo:scale-120 group-hover/logo:opacity-60"
        aria-hidden="true"
        referrerPolicy="no-referrer"
      />
      {/* Front sharp logo */}
      <MotionImageResolver fallbackType="team" fallbackText={teamName} tla={tla}
        src={logoUrl}
        alt={teamName}
        onError={(e: any) => handleImageError(e, getFallbackImageUrl(teamName))}
        animate={isLive ? {
          scale: [1, 1.05, 1]
        } : {}}
        transition={isLive ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
        className="relative w-12 h-12 md:w-16 md:h-16 object-contain z-10 transition-transform duration-500 ease-out group-hover:scale-105 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
        referrerPolicy="no-referrer"
      />

      {/* Tooltip on hover */}
      <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-30 invisible opacity-0 scale-95 -translate-y-2 group-hover/logo:visible group-hover/logo:opacity-100 group-hover/logo:scale-100 group-hover/logo:translate-y-0 transition-all duration-300 ease-out">
        <div className="relative bg-surface/95 backdrop-blur-md border border-border text-[color:var(--color-text)] text-[11px] font-black px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>{teamName}</span>
        </div>
        {/* Tooltip Arrow pointing UP */}
        <div className="w-2.5 h-2.5 bg-surface border-t border-l border-border absolute -top-1 left-1/2 -translate-x-1/2 rotate-45" />
      </div>
    </div>
  );
}

import LivePulse from './ui/LivePulse';

interface ScoreDisplayProps {
  homeScore: number | undefined | null;
  awayScore: number | undefined | null;
  status: string;
}

function ScoreDisplay({ homeScore, awayScore, status }: ScoreDisplayProps) {
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const [scoreChanged, setScoreChanged] = useState(false);

  const prevHome = useRef(homeScore);
  const prevAway = useRef(awayScore);

  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'P', 'IN_PLAY'].includes(status.toUpperCase());

  useEffect(() => {
    let homeChanged = false;
    let awayChanged = false;

    // Only flash if it's not the initial mount and status is not UPCOMING
    if (status !== 'UPCOMING') {
      if (prevHome.current !== undefined && prevHome.current !== null && homeScore !== prevHome.current) {
        homeChanged = true;
      }
      if (prevAway.current !== undefined && prevAway.current !== null && awayScore !== prevAway.current) {
        awayChanged = true;
      }
    }

    if (homeChanged || awayChanged) {
      setScoreChanged(true);
      if (homeChanged) setHomeFlash(true);
      if (awayChanged) setAwayFlash(true);

      const timer = setTimeout(() => {
        setHomeFlash(false);
        setAwayFlash(false);
        setScoreChanged(false);
      }, 1500); // Effect duration 1.5 seconds

      return () => clearTimeout(timer);
    }

    prevHome.current = homeScore;
    prevAway.current = awayScore;
  }, [homeScore, awayScore, status]);

  if (status === 'UPCOMING') {
    return (
      <div className="text-xl md:text-3xl font-black text-gray-500 bg-gray-500/5 px-4 py-1.5 rounded-2xl border border-gray-500/10">
        VS
      </div>
    );
  }

  const displayHome = homeScore ?? 0;
  const displayAway = awayScore ?? 0;

  return (
    <div className="flex items-center gap-5 select-none relative">
      {/* Live Pulse Indicator */}
      {isLive && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <LivePulse size="sm" className="shadow-red-500/20" />
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">LIVE</span>
        </div>
      )}

      {/* Home score */}
      <motion.div
        animate={homeFlash ? {
          scale: [1, 1.3, 0.95, 1.05, 1],
          color: ['var(--color-text)', '#10B981', '#10B981', 'var(--color-text)'],
          textShadow: ['0 0 0px rgba(16, 185, 129, 0)', '0 0 15px rgba(16, 185, 129, 0.6)', '0 0 0px rgba(16, 185, 129, 0)']
        } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={cn(
          "text-3xl md:text-5xl font-black tabular-nums tracking-tighter px-2 rounded-xl transition-all",
          homeFlash && "bg-emerald-500/10 scale-110"
        )}
      >
        {displayHome}
      </motion.div>

      {/* Separator dash */}
      <span className="text-gray-400 font-bold text-xl md:text-2xl">-</span>

      {/* Away score */}
      <motion.div
        animate={awayFlash ? {
          scale: [1, 1.3, 0.95, 1.05, 1],
          color: ['var(--color-text)', '#10B981', '#10B981', 'var(--color-text)'],
          textShadow: ['0 0 0px rgba(16, 185, 129, 0)', '0 0 15px rgba(16, 185, 129, 0.6)', '0 0 0px rgba(16, 185, 129, 0)']
        } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={cn(
          "text-3xl md:text-5xl font-black tabular-nums tracking-tighter px-2 rounded-xl transition-all",
          awayFlash && "bg-emerald-500/10 scale-110"
        )}
      >
        {displayAway}
      </motion.div>

      {/* Highlight glow ring container when any score changes */}
      {scoreChanged && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
          transition={{ duration: 1, repeat: 1, ease: "easeOut" }}
          className="absolute -inset-4 rounded-3xl border-2 border-emerald-500 pointer-events-none"
        />
      )}
    </div>
  );
}

export default React.memo(function MatchCard({ match }: MatchCardProps) {
  if (!match) return null;

  const isLive = match.status === 'LIVE';
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { 
    favoriteLeagues, 
    notifiedMatches, 
    toggleFavoriteLeague, 
    toggleMatchNotification 
  } = useNotifications();
  const { showToast, showError } = useError();

  const getCountdownString = (): string => {
    if (!match.startTime) return '';
    const start = new Date(match.startTime);
    const now = new Date();
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) {
      return 'تبدأ الآن';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const totalHours = days * 24 + hours;
    if (totalHours > 0) {
      return `بعد ${totalHours}س ${minutes}د`;
    } else {
      return `بعد ${minutes}د ${seconds}ث`;
    }
  };

  const [timeLeft, setTimeLeft] = useState<string>(getCountdownString);

  useEffect(() => {
    if (match.status === 'LIVE' || match.status === 'FINISHED') {
      return;
    }

    const updateCountdown = () => {
      setTimeLeft(getCountdownString());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [match.startTime, match.status]);

  const isFav = favoriteLeagues.includes(match.league);
  const isNotified = notifiedMatches.includes(match.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لإضافة الدوري للمفضلة ⭐', 'warning');
      return;
    }

    try {
      await toggleFavoriteLeague(match.league);
      showToast(isFav ? 'تمت إزالة الدوري من المفضلة 🗑️' : 'تمت إضافة الدوري للمفضلة ⭐', 'success');
    } catch (err) {
      showError(err);
    }
  };

  const handleToggleNotification = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('يرجى تسجيل الدخول أولاً لتفعيل إشعارات المباراة 🔔', 'warning');
      return;
    }

    try {
      await toggleMatchNotification(match.id);
      showToast(isNotified ? 'تم إلغاء تفعيل إشعارات المباراة 🔕' : 'تم تفعيل إشعارات المباراة بنجاح! 🔔⚽', 'success');
    } catch (err) {
      showError(err);
    }
  };

  const getTeamName = (team: any) => {
    if (!team) return '';
    if (typeof team === 'string') return team;
    return team.name || '';
  };

  const getLeagueName = (league: any) => {
    if (!league) return '';
    if (typeof league === 'string') return league;
    return league.name || '';
  };

  const homeTeamName = getTeamName(match.homeTeam);
  const awayTeamName = getTeamName(match.awayTeam);
  const leagueName = getLeagueName(match.league);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border transition-all duration-300 p-6 shadow-sm shadow-black/5",
        "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50",
        match.isFeatured ? "border-amber-400/50 shadow-amber-500/10 ring-1 ring-amber-400/20" : "border-border"
      )}
    >
      <Link to={`/match/${createSlugPath(`${homeTeamName} vs ${awayTeamName}`, match.id)}`} className="block">
        {match.isFeatured && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-600 text-white px-2 py-1 rounded-full shadow-lg border border-white/20">
            <span className="text-[10px] font-black">مميزة ⭐</span>
          </div>
        )}
        {match.isManual && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-2 py-1 rounded-full shadow-lg border border-white/20">
            <span className="text-[10px] font-black">إضافة يدوية</span>
          </div>
        )}
        {/* Header: League & Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageResolver src={match.leagueLogo || undefined} fallbackType="league" alt={`شعار ${leagueName}`} className="w-5 h-5 rounded-full border border-white/10 bg-white/5" fallbackText={leagueName} />
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {leagueName ? <TranslatedText name={leagueName} type="league" /> : ''}
            </span>
            {/* Action Buttons: Favorite Star & Notifications Bell */}
            <div className="flex items-center gap-1">
              <motion.button
                type="button"
                onClick={handleToggleFavorite}
                whileHover={{ scale: 1.25, rotate: 15 }}
                whileTap={{ scale: 0.85, rotate: -15 }}
                className={cn(
                  "p-1.5 rounded-full transition-all duration-300 outline-none z-20 relative cursor-pointer flex items-center justify-center",
                  isFav 
                    ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 shadow-sm shadow-yellow-400/20" 
                    : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10"
                )}
                title={isFav ? "إزالة الدوري من المفضلة" : "إضافة الدوري للمفضلة"}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: isFav ? [1, 1.4, 1] : 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                >
                  <Star size={11} fill={isFav ? "currentColor" : "none"} className="transition-all duration-300" />
                </motion.div>
              </motion.button>

              <motion.button
                type="button"
                onClick={handleToggleNotification}
                whileHover={{ scale: 1.25, y: -1 }}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "p-1.5 rounded-full transition-all duration-300 outline-none z-20 relative cursor-pointer flex items-center justify-center",
                  isNotified 
                    ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 shadow-sm shadow-emerald-400/20" 
                    : "text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10"
                )}
                title={isNotified ? "إلغاء إشعارات المباراة" : "تفعيل إشعارات المباراة"}
              >
                <motion.div
                  initial={false}
                  animate={isNotified ? {
                    rotate: [0, -15, 15, -15, 15, 0],
                    scale: [1, 1.15, 1.15, 1]
                  } : {}}
                  transition={{ duration: 0.8 }}
                >
                  <Bell size={11} fill={isNotified ? "currentColor" : "none"} className="transition-all duration-300" />
                </motion.div>
              </motion.button>
            </div>
          </div>
          {/* Updated Status/Time Display */}
          <div className="flex items-center gap-1.5">
            {match.status === 'LIVE' ? (
              <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold">'{match.minute}</span>
              </div>
            ) : match.status === 'FINISHED' ? (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/10">منتهية</span>
            ) : (
              <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                <Timer size={10} className="text-primary" />
                <span className="text-[10px] font-bold tabular-nums">
                  {timeLeft || formatTime(match.startTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const teamId = typeof match.homeTeam === 'object' && match.homeTeam ? (match.homeTeam as any).id : null;
              navigate(`/team/${createSlugPath(homeTeamName, (match.homeTeamDetails?.id || teamId || homeTeamName))}`);
            }}
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer group/team text-center hover:scale-105 transition-all duration-300 relative z-25"
          >
            <TeamLogoWithGlow 
              logoUrl={getTeamLogoUrl(match.homeLogo, homeTeamName, typeof match.homeTeam === 'object' ? match.homeTeam.tla : undefined)} 
              teamName={homeTeamName} 
              tla={typeof match.homeTeam === 'object' ? match.homeTeam.tla : undefined}
              isLive={isLive}
            />
            <span className="text-xs md:text-sm font-bold text-center leading-tight group-hover/team:text-primary transition-colors flex flex-col items-center gap-1">
              {homeTeamName ? <TranslatedText name={homeTeamName} type="team" /> : ''}
              {typeof match.homeTeam === 'object' && (match.homeTeam as any).isPlaceholder && (
                <span className="text-[8px] md:text-[9px] bg-amber-400/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap flex items-center gap-1">
                   <span>🏆</span> بانتظار تحديد الفريق
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <ScoreDisplay 
              homeScore={match.homeScore} 
              awayScore={match.awayScore} 
              status={match.status} 
            />
          </div>

          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const teamId = typeof match.awayTeam === 'object' && match.awayTeam ? (match.awayTeam as any).id : null;
              navigate(`/team/${createSlugPath(awayTeamName, (match.awayTeamDetails?.id || teamId || awayTeamName))}`);
            }}
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer group/team text-center hover:scale-105 transition-all duration-300 relative z-25"
          >
            <TeamLogoWithGlow 
              logoUrl={getTeamLogoUrl(match.awayLogo, awayTeamName, typeof match.awayTeam === 'object' ? match.awayTeam.tla : undefined)} 
              teamName={awayTeamName} 
              tla={typeof match.awayTeam === 'object' ? match.awayTeam.tla : undefined}
              isLive={isLive}
            />
            <span className="text-xs md:text-sm font-bold text-center leading-tight group-hover/team:text-primary transition-colors flex flex-col items-center gap-1">
              {awayTeamName ? <TranslatedText name={awayTeamName} type="team" /> : ''}
              {typeof match.awayTeam === 'object' && (match.awayTeam as any).isPlaceholder && (
                <span className="text-[8px] md:text-[9px] bg-amber-400/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap flex items-center gap-1">
                   <span>🏆</span> بانتظار تحديد الفريق
                </span>
              )}
            </span>
          </div>
        </div>


        {/* Live Stats Quick View */}
        {isLive && match.stats && match.stats.possession && match.stats.shotsOnTarget && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 space-y-3 py-3.5 border-t border-b border-border bg-background/50 rounded-xl px-4"
          >
            {/* Possession */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400">
                <span className="text-primary">{match.stats.possession.home || 0}%</span>
                <span className="flex items-center gap-1 uppercase tracking-wider text-[8px] text-slate-400 dark:text-gray-500">
                  <Activity size={10} className="text-secondary" /> الاستحواذ
                </span>
                <span className="text-[color:var(--color-text)]">{match.stats.possession.away || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface rounded-full flex overflow-hidden border border-border/20">
                <div className="bg-primary transition-all duration-500" style={{ width: `${match.stats.possession.home || 0}%` }} />
                <div className="bg-slate-300 dark:bg-white/20 transition-all duration-500" style={{ width: `${match.stats.possession.away || 0}%` }} />
              </div>
            </div>

            {/* Shots on Target */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400">
                <span className="text-primary">{match.stats.shotsOnTarget.home || 0}</span>
                <span className="flex items-center gap-1 uppercase tracking-wider text-[8px] text-slate-400 dark:text-gray-500">
                  <Crosshair size={10} className="text-secondary" /> على المرمى
                </span>
                <span className="text-[color:var(--color-text)]">{match.stats.shotsOnTarget.away || 0}</span>
              </div>
              <div className="w-full h-1.5 bg-surface rounded-full flex overflow-hidden border border-border/20">
                <div 
                  className="bg-primary transition-all duration-500" 
                  style={{ width: `${((match.stats.shotsOnTarget.home || 0) / (((match.stats.shotsOnTarget.home || 0) + (match.stats.shotsOnTarget.away || 0)) || 1)) * 100}%` }} 
                />
                <div 
                  className="bg-slate-300 dark:bg-white/20 transition-all duration-500" 
                  style={{ width: `${((match.stats.shotsOnTarget.away || 0) / (((match.stats.shotsOnTarget.home || 0) + (match.stats.shotsOnTarget.away || 0)) || 1)) * 100}%` }} 
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer: Details */}
        <div className="flex flex-col gap-2 border-t border-border pt-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Tv size={12} className="text-secondary" />
                <span className="text-[10px] font-bold">{match.channel || ''}</span>
              </div>
              {match.commentator && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Radio size={12} className="text-secondary" />
                  <span className="text-[10px] font-bold">{match.commentator}</span>
                </div>
              )}
            </div>

            {/* Subtle Hover Action */}
            <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1 text-primary">
              <span className="text-[10px] font-bold whitespace-nowrap">التفاصيل</span>
              <ChevronLeft size={16} />
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-primary to-secondary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl" />
      </Link>
    </motion.div>
  );
});
