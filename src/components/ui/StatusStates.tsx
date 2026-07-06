import React from 'react';
import { motion } from 'motion/react';
import { Search, Info, RefreshCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MatchCardSkeleton() {
  return (
    <div className="w-full rounded-2xl bg-surface border border-border p-6 shadow-sm animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-border" />
          <div className="w-24 h-3 rounded-full bg-border" />
        </div>
        <div className="w-16 h-5 rounded-full bg-border" />
      </div>

      {/* Teams Skeleton */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="w-16 h-16 rounded-full bg-border" />
          <div className="w-20 h-4 rounded-full bg-border" />
        </div>

        <div className="w-20 h-10 rounded-xl bg-border" />

        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="w-16 h-16 rounded-full bg-border" />
          <div className="w-20 h-4 rounded-full bg-border" />
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t border-border pt-4 flex justify-between items-center">
        <div className="flex gap-4">
          <div className="w-16 h-3 rounded-full bg-border" />
          <div className="w-16 h-3 rounded-full bg-border" />
        </div>
        <div className="w-12 h-4 rounded-full bg-border" />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon = <Search size={40} className="text-gray-600" />, 
  onRetry,
  className
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-surface/50 border border-dashed border-border",
        className
      )}
    >
      <div className="mb-6 p-4 rounded-full bg-background border border-border shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-black text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed mb-6">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-black font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <RefreshCcw size={14} />
          إعادة المحاولة
        </button>
      )}
    </motion.div>
  );
}
