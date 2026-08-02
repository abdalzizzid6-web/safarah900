import React from 'react';
import { Timer, CheckCircle, Calendar, AlertTriangle } from 'lucide-react';
import { MatchStatus } from '../../types';
import LivePulse from './LivePulse';

interface LiveMatchIndicatorProps {
  status: MatchStatus;
  isLiveProp?: boolean;
  minute?: number;
  startTime?: string | Date;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export default function LiveMatchIndicator({
  status,
  isLiveProp,
  minute,
  startTime,
  size = 'md',
  className = '',
  showIcon = true,
}: LiveMatchIndicatorProps) {
  // 1. Determine states
  let isLive = false;
  let isFinished = false;
  let elapsed: number | null = null;
  let statusText = '';
  let statusCode = '';

  if (typeof status === 'object' && status !== null) {
    statusText = status.long || '';
    elapsed = status.elapsed ?? null;
    statusCode = (status.short || '').toUpperCase();
  } else if (typeof status === 'string') {
    statusText = status;
    statusCode = status.toUpperCase();
  }

  // Override absolute elapsed if minute is explicitly supplied
  if (minute !== undefined && minute !== null) {
    elapsed = minute;
  }

  // List of live codes from API-Football
  const liveCodes = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT', 'LIVE_CONTRARY', 'مباشر'];
  if (liveCodes.includes(statusCode) || statusText === 'LIVE' || statusText.includes('مباشر')) {
    isLive = true;
  }

  if (isLiveProp !== undefined) {
    isLive = isLiveProp;
  }

  // Finished codes
  const finishedCodes = ['FT', 'AET', 'PEN', 'PCO', 'FT_PEN', 'FINISHED', 'انتهت'];
  if (finishedCodes.includes(statusCode) || statusText === 'Finished' || statusText.includes('انتهت')) {
    isFinished = true;
  }

  const isUpcoming = !isLive && !isFinished;

  // 2. Select Arabic terminology for live phases, finished, etc.
  let displayLabel = '';
  if (isLive) {
    if (statusCode === '1H' || statusCode === 'FIRST_HALF' || statusText.includes('شوط أول')) {
      displayLabel = elapsed ? `شوط أول • ${elapsed}'` : 'شوط أول';
    } else if (statusCode === '2H' || statusCode === 'SECOND_HALF' || statusText.includes('شوط ثاني')) {
      displayLabel = elapsed ? `شوط ثاني • ${elapsed}'` : 'شوط ثاني';
    } else if (statusCode === 'HT' || statusCode === 'HALF_TIME' || statusText.includes('استراحة') || statusText.includes('بين الشوطين')) {
      displayLabel = 'استراحة';
    } else if (statusCode === '1ET' || statusText.includes('إضافي أول')) {
      displayLabel = elapsed ? `شوط إضافي أول • ${elapsed}'` : 'شوط إضافي أول';
    } else if (statusCode === '2ET' || statusText.includes('إضافي ثاني')) {
      displayLabel = elapsed ? `شوط إضافي ثاني • ${elapsed}'` : 'شوط إضافي ثاني';
    } else if (statusCode === 'ET' || statusText.includes('إضافي')) {
      displayLabel = elapsed ? `شوط إضافي • ${elapsed}'` : 'شوط إضافي';
    } else if (statusCode === 'P' || statusCode === 'PEN' || statusText.includes('ترجيح')) {
      displayLabel = 'ركلات ترجيح';
    } else {
      displayLabel = elapsed ? `مباشر • ${elapsed}'` : 'بدأت (مباشر)';
    }
  } else if (isFinished) {
    if (statusCode === 'AET' || statusText.includes('إضافي')) {
      displayLabel = 'انتهت (وقت إضافي)';
    } else if (statusCode === 'PEN' || statusCode === 'FT_PEN' || statusText.includes('ترجيح')) {
      displayLabel = 'انتهت (ركلات ترجيح)';
    } else {
      displayLabel = 'انتهت';
    }
  } else {
    // Upcoming
    if (startTime) {
      try {
        const d = new Date(startTime);
        const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
        displayLabel = `لم تبدأ • ${timeStr}`;
      } catch (e) {
        displayLabel = 'لم تبدأ';
      }
    } else {
      displayLabel = 'لم تبدأ';
    }
  }

  // 3. Define size classes
  const sizeStyles = {
    xs: {
      badge: 'px-1.5 py-0.5 text-[9px] gap-1 rounded',
      icon: 'w-2.5 h-2.5',
      dot: 'h-1 w-1'
    },
    sm: {
      badge: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
      icon: 'w-3 h-3',
      dot: 'h-1.5 w-1.5'
    },
    md: {
      badge: 'px-3 py-1 text-xs gap-1.5 rounded-lg',
      icon: 'w-3.5 h-3.5',
      dot: 'h-2 w-2'
    },
    lg: {
      badge: 'px-4 py-1.5 text-sm gap-2 rounded-xl',
      icon: 'w-4 h-4',
      dot: 'h-2.5 w-2.5'
    }
  };

  const selectedSize = sizeStyles[size] || sizeStyles.md;

  // 4. Render correct Badge view based on state
  return (
    <div className={`inline-flex items-center ${className}`} id="live-match-indicator-wrapper">
      {isLive && (
        <span
          id="status-badge-live"
          className={`flex items-center font-extrabold select-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.06)] leading-none ${selectedSize.badge}`}
        >
          {/* Custom pulsing breathing live indicator dot with extra visual halo ring */}
          <LivePulse size={size === 'xs' ? 'sm' : size === 'lg' ? 'lg' : 'md'} color="bg-emerald-500" className="mr-0.5" />
          {showIcon && <Timer className={`${selectedSize.icon} animate-pulse text-emerald-400`} />}
          <span>{displayLabel}</span>
        </span>
      )}

      {isFinished && (
        <span
          id="status-badge-finished"
          className={`flex items-center font-bold select-none bg-white/5 text-gray-400 border border-white/5 leading-none ${selectedSize.badge}`}
        >
          {showIcon && <CheckCircle className={selectedSize.icon} />}
          <span>{displayLabel}</span>
        </span>
      )}

      {isUpcoming && (
        <span
          id="status-badge-upcoming"
          className={`flex items-center font-black select-none bg-primary/10 text-primary border border-primary/20 leading-none ${selectedSize.badge}`}
        >
          {showIcon && <Calendar className={selectedSize.icon} />}
          <span>{displayLabel}</span>
        </span>
      )}
    </div>
  );
}
