import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface MatchCountdownProps {
  startTime: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MatchCountdown({ startTime, className, size = 'sm' }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

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
        setTimeLeft(null);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!timeLeft) return null;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1.5 rounded-xl',
      number: 'text-xs',
      label: 'text-[8px]',
      separator: 'text-xs'
    },
    md: {
      container: 'px-3 py-2 rounded-2xl',
      number: 'text-base sm:text-lg',
      label: 'text-[9px] sm:text-[10px]',
      separator: 'text-base'
    },
    lg: {
      container: 'px-4 py-3 rounded-2xl',
      number: 'text-2xl',
      label: 'text-xs',
      separator: 'text-xl'
    }
  };

  const currSize = sizeClasses[size];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-1 bg-amber-500/[0.03] border border-amber-500/10", currSize.container, className)}
    >
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-amber-400 font-mono", currSize.number)}>
          {String(timeLeft.days).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>يوم</span>
      </div>
      
      <span className={cn("text-amber-500/40 font-bold", currSize.separator)}>:</span>
      
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-amber-400 font-mono", currSize.number)}>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>ساعة</span>
      </div>
      
      <span className={cn("text-amber-500/40 font-bold", currSize.separator)}>:</span>
      
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-amber-400 font-mono", currSize.number)}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>دقيقة</span>
      </div>
      
      <span className={cn("text-amber-500/40 font-bold", currSize.separator)}>:</span>
      
      <div className="flex flex-col items-center px-1">
        <span className={cn("font-black text-red-400 font-mono", currSize.number)}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className={cn("text-gray-400 font-extrabold", currSize.label)}>ثانية</span>
      </div>
    </motion.div>
  );
}
