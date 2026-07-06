import React from 'react';
import { motion } from 'motion/react';

interface SkeletonMatchCardProps {
  viewMode?: 'compact' | 'expanded';
}

export default function SkeletonMatchCard({ viewMode = 'compact' }: SkeletonMatchCardProps) {
  if (viewMode === 'compact') {
    return (
      <div 
        className="bg-surface border border-white/5 rounded-2xl p-3 flex items-center justify-between shadow-sm animate-pulse"
        dir="rtl"
      >
        {/* Right side check: team logo & name */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
          <div className="h-4.5 bg-white/10 rounded-md w-24" />
        </div>

        {/* Center check: time / score placeholder */}
        <div className="flex flex-col items-center justify-center w-1/3 text-center">
          <div className="h-5.5 bg-white/10 rounded-lg w-12" />
        </div>

        {/* Left side check: name & team logo */}
        <div className="flex items-center gap-3 justify-end w-1/3">
          <div className="h-4.5 bg-white/10 rounded-md w-24" />
          <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0" />
        </div>
      </div>
    );
  }

  // Expanded Layout
  return (
    <div 
      className="bg-surface rounded-3xl p-5 border border-border/10 space-y-5 shadow-md animate-pulse"
      dir="rtl"
    >
      {/* Card Header Placeholder */}
      <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white/5" />
          <div className="h-4 bg-white/10 rounded-md w-32" />
        </div>
        <div className="w-6 h-6 rounded-full bg-white/5" />
      </div>

      {/* Card Body: Teams Grid */}
      <div className="grid grid-cols-3 items-center gap-2 py-2">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 shadow-inner" />
          <div className="h-4 bg-white/15 rounded-md w-20" />
        </div>

        {/* Match Center (Score / Time) */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 bg-white/10 rounded-xl w-14" />
          <div className="h-3.5 bg-white/5 rounded-md w-10" />
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 shadow-inner" />
          <div className="h-4 bg-white/15 rounded-md w-20" />
        </div>
      </div>

      {/* Card Footer Features */}
      <div className="border-t border-white/[0.03] pt-4 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5" />
          <div className="w-8 h-8 rounded-lg bg-white/5" />
        </div>
        <div className="h-4 bg-white/10 rounded-md w-24" />
      </div>
    </div>
  );
}
