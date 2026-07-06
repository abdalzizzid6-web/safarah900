import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface LivePulseProps {
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LivePulse({ 
  className, 
  color = "bg-red-500",
  size = 'md'
}: LivePulseProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3"
  };

  const selectedSize = sizeClasses[size];

  return (
    <div className={cn("relative flex items-center justify-center", selectedSize, className)}>
      {/* Outer Pulse Ring 1 */}
      <motion.div
        animate={{
          scale: [1, 2.5],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className={cn("absolute inset-0 rounded-full opacity-60", color)}
      />
      
      {/* Outer Pulse Ring 2 (staggered) */}
      <motion.div
        animate={{
          scale: [1, 2],
          opacity: [0.4, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5,
        }}
        className={cn("absolute inset-0 rounded-full opacity-40", color)}
      />

      {/* Core Dot */}
      <div className={cn("relative rounded-full shadow-lg shadow-red-500/50", selectedSize, color)} />
    </div>
  );
}
