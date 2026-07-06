import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, X } from 'lucide-react';
import { useLiveMatches } from '../hooks/useMatchesV2';
import { useSettings } from '../context/SettingsContext';
import { Match } from '../types';

export default function LiveScoreWidget() {
  const { settings } = useSettings();
  const { data: matches = [] } = useLiveMatches();
  const [isVisible, setIsVisible] = useState(false);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);

  useEffect(() => {
    // Check if the widget is enabled in settings
    if (!settings.liveScoreWidgetEnabled) {
      setIsVisible(false);
      return;
    }

    // Find the current top priority live match
    const live = matches.find(m => m.isLive || m.status === 'LIVE' || m.status === 'HT');
    if (live) {
      setLiveMatch(live);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [matches, settings.liveScoreWidgetEnabled]);

  if (!settings.liveScoreWidgetEnabled) return null;

  return (
    <AnimatePresence>
      {isVisible && liveMatch && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-24 right-6 z-40 bg-[#0f0f10]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto"
        >
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white drop-shadow-md z-10"
          >
            <X size={12} />
          </button>
          <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2">
                 <Radio className="text-primary w-4 h-4 animate-pulse" />
                 <span className="text-white font-bold text-xs uppercase tracking-widest">مباشر</span>
             </div>
             <div className="text-gray-400 text-[10px] font-bold mt-1">الدقيقة {(liveMatch as any).elapsed || (liveMatch as any).time || "45'"}</div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-white font-black text-sm text-right w-20 truncate">
               {typeof liveMatch.homeTeam === 'object' ? liveMatch.homeTeam.name : liveMatch.homeTeam}
             </div>
             <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg">
                <span className="text-xl font-black text-white">{liveMatch.homeScore ?? 0}</span>
                <span className="text-sm font-black text-gray-500">-</span>
                <span className="text-xl font-black text-white">{liveMatch.awayScore ?? 0}</span>
              </div>
              <div className="text-white font-black text-sm text-left w-20 truncate">
                {typeof liveMatch.awayTeam === 'object' ? liveMatch.awayTeam.name : liveMatch.awayTeam}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
