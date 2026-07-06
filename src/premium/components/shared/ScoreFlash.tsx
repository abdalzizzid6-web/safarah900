import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ScoreFlashProps {
  homeScore: number | string;
  awayScore: number | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ScoreFlash: React.FC<ScoreFlashProps> = ({ homeScore, awayScore, className = '', size = 'md' }) => {
  const [flash, setFlash] = useState(false);
  const prevHome = useRef(homeScore);
  const prevAway = useRef(awayScore);

  useEffect(() => {
    // If the score changes, trigger a beautiful animated pulse/flash
    if (homeScore !== prevHome.current || awayScore !== prevAway.current) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 2000);
      prevHome.current = homeScore;
      prevAway.current = awayScore;
      return () => clearTimeout(timer);
    }
  }, [homeScore, awayScore]);

  const sizeClasses = {
    sm: 'text-sm font-bold tracking-wider',
    md: 'text-lg font-black tracking-widest',
    lg: 'text-2xl font-black tracking-widest',
    xl: 'text-4xl font-black tracking-widest',
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        animate={
          flash
            ? {
                scale: [1, 1.22, 1],
                color: ['#ffffff', '#10b981', '#ffffff'],
                textShadow: [
                  '0 0 0px rgba(16, 185, 129, 0)',
                  '0 0 15px rgba(16, 185, 129, 0.8)',
                  '0 0 0px rgba(16, 185, 129, 0)',
                ],
              }
            : {}
        }
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className={`${sizeClasses[size]} ${className} relative z-10 transition-colors duration-300 font-mono`}
      >
        <span>{homeScore}</span>
        <span className="mx-2 opacity-40">-</span>
        <span>{awayScore}</span>
      </motion.div>

      {/* Radiant glow ring to capture maximum professional attention */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 bg-emerald-500/25 rounded-full blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
