import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Timer, Clock } from 'lucide-react';

interface MatchCountdownProps {
  startTime: string | Date | null | undefined;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'boxed' | 'badge' | 'compact';
  showIcon?: boolean;
  showLabel?: boolean;
}

export default function MatchCountdown({ 
  startTime, 
  className, 
  size = 'sm',
  variant = 'boxed',
  showIcon = true,
  showLabel = true
}: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isPast: boolean } | null>(null);

  useEffect(() => {
    if (!startTime) {
      setTimeLeft(null);
      return;
    }

    const startTimestamp = new Date(startTime).getTime();
    if (!startTimestamp || isNaN(startTimestamp)) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = startTimestamp - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!timeLeft) return null;

  if (timeLeft.isPast) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <span>تنطلق الآن</span>
      </span>
    );
  }

  // BADGE VARIANT
  if (variant === 'badge') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm",
          size === 'xs' && "text-[9px] px-1.5 py-0.5 rounded-lg gap-1",
          size === 'md' && "text-sm px-3 py-1.5 rounded-2xl gap-2",
          className
        )}
      >
        {showIcon && <Timer size={size === 'xs' ? 10 : size === 'md' ? 14 : 12} className="animate-pulse text-amber-400 shrink-0" />}
        {showLabel && <span className="text-gray-400 font-bold text-[9px] sm:text-[10px]">المتبقي:</span>}
        <div className="flex items-center gap-0.5 font-mono dir-ltr font-black">
          {timeLeft.days > 0 && <span>{timeLeft.days}ي </span>}
          <span>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="animate-pulse text-amber-500/60">:</span>
          <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="animate-pulse text-amber-500/60">:</span>
          <span className="text-red-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </motion.div>
    );
  }

  // COMPACT VARIANT
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1 font-mono text-[10px] font-black text-amber-400 dir-ltr", className)}>
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span className="opacity-50">:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span className="opacity-50">:</span>
        <span className="text-red-400">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    );
  }

  // BOXED VARIANT
  const sizeClasses = {
    xs: {
      container: 'px-1.5 py-1 rounded-lg gap-0.5',
      number: 'text-[10px]',
      label: 'text-[7px]',
      separator: 'text-[9px]'
    },
    sm: {
      container: 'px-2 py-1.5 rounded-xl gap-1',
      number: 'text-xs',
      label: 'text-[8px]',
      separator: 'text-xs'
    },
    md: {
      container: 'px-3 py-2 rounded-2xl gap-1.5',
      number: 'text-base sm:text-lg',
      label: 'text-[9px] sm:text-[10px]',
      separator: 'text-base'
    },
    lg: {
      container: 'px-4 py-3 rounded-2xl gap-2',
      number: 'text-2xl',
      label: 'text-xs',
      separator: 'text-xl'
    }
  };

  const currSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center bg-amber-500/[0.04] border border-amber-500/15 shadow-sm", currSize.container, className)}
    >
      {timeLeft.days > 0 && (
        <>
          <div className="flex flex-col items-center px-1">
            <span className={cn("font-black text-amber-400 font-mono", currSize.number)}>
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className={cn("text-gray-400 font-extrabold", currSize.label)}>يوم</span>
          </div>
          <span className={cn("text-amber-500/40 font-bold animate-pulse", currSize.separator)}>:</span>
        </>
      )}
      
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-amber-400 font-mono", currSize.number)}>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>ساعة</span>
      </div>
      
      <span className={cn("text-amber-500/40 font-bold animate-pulse", currSize.separator)}>:</span>
      
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-amber-400 font-mono", currSize.number)}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>دقيقة</span>
      </div>
      
      <span className={cn("text-amber-500/40 font-bold animate-pulse", currSize.separator)}>:</span>
      
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-red-400 font-mono", currSize.number)}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>ثانية</span>
      </div>
    </motion.div>
  );
}

