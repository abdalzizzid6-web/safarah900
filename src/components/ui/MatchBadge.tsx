import React from 'react';
import { cn } from '../../lib/utils';

interface MatchBadgeProps {
  status: any;
  className?: string;
}

export default function MatchBadge({ status, className }: MatchBadgeProps) {
  // Determine status string from potentially complex object
  const statusStr = typeof status === 'object' ? (status?.short || status?.long || '') : (status || '');
  const normalizedStatus = statusStr.toUpperCase();

  let colorClass = 'bg-gray-500/10 text-gray-400';
  let text = 'قادمة';

  if (['LIVE', '1H', '2H', 'HT', 'ET', 'P', 'IN_PLAY'].includes(normalizedStatus)) {
    colorClass = 'bg-red-500/10 text-red-500 animate-pulse';
    text = 'جارية';
  } else if (['FT', 'AET', 'PEN'].includes(normalizedStatus)) {
    colorClass = 'bg-emerald-500/10 text-emerald-500';
    text = 'انتهت';
  } else if (['NS', 'TBD', 'POSTP'].includes(normalizedStatus)) {
    colorClass = 'bg-blue-500/10 text-blue-400';
    text = 'قادمة';
  }

  return (
    <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border border-current/20", colorClass, className)}>
      {text}
    </div>
  );
}
