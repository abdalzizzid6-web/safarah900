import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Zap, Shield, Activity, Info, RefreshCw, ArrowDownLeft } from 'lucide-react';
import { Player, generatePlayerStats } from './LineupTypes';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface PlayerNodeProps {
  player: Player;
  isHome: boolean;
  onClick: () => void;
  showHeatmap: boolean;
}

export function PlayerNode({ player, isHome, onClick, showHeatmap }: PlayerNodeProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = React.useState(false);
  const stats = React.useMemo(() => generatePlayerStats(player), [player]);

  const isTopTeamGKOrDef = !isHome && (player.position === 'GK' || player.position === 'DEF');
  const tooltipPlacementClass = isTopTeamGKOrDef ? "top-full mt-2.5" : "bottom-full mb-2.5";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="flex flex-col items-center gap-1 cursor-pointer outline-none relative group"
    >
      {/* Localized player heat aura */}
      {showHeatmap && (
        <div 
          className="absolute -inset-4 rounded-full -z-10 bg-[radial-gradient(circle,rgba(239,68,68,0.32)_0%,rgba(245,158,11,0.1)_60%,rgba(0,0,0,0)_100%)] animate-pulse pointer-events-none"
        />
      )}
      
      {/* Hover-glowing player movement zone */}
      {isHovered && showHeatmap && (
        <div 
          className="absolute -inset-10 rounded-full -z-20 bg-[radial-gradient(circle,rgba(239,68,68,0.45)_0%,rgba(245,158,11,0.2)_50%,rgba(0,0,0,0)_100%)] animate-ping duration-1000 pointer-events-none"
        />
      )}

      {/* Jersey circle with glowing state */}
      <div 
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] border shadow-md relative transition-all duration-300",
          isHome 
            ? "bg-primary/10 border-primary text-primary group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
            : "bg-secondary/10 border-secondary text-secondary group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
        )}
      >
        <span>{player.number}</span>
        
        {/* Red substitution arrow if subbed out */}
        {player.subbedOut && (
          <div className="absolute -top-1 -left-1 bg-red-500/90 text-white rounded-full p-0.5 border border-background shadow-md">
            <RefreshCw size={8} className="animate-spin-slow text-white" />
          </div>
        )}
      </div>

      {/* Player name label styled defensively for readability on complex pitch backgrounds */}
      <span className="px-1.5 py-0.5 rounded-md bg-[#011408]/95 border border-white/5 text-[9px] sm:text-[10px] font-extrabold text-gray-100 max-w-[80px] sm:max-w-[100px] truncate block text-center shadow-lg">
        {player.name.split(' ')[0]}
      </span>

      {/* Exquisite Floating Hover Tooltip with Player Statistics */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: isTopTeamGKOrDef ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: isTopTeamGKOrDef ? -6 : 6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 z-50 w-52 p-3.5 rounded-2xl",
              "bg-[#0e2217]/95 border border-emerald-500/30 text-white shadow-2xl backdrop-blur-md pointer-events-none select-none text-right font-sans",
              tooltipPlacementClass
            )}
            style={{ direction: 'rtl' }}
          >
            {/* Caret Arrow */}
            <div 
              className={cn(
                "absolute w-2 h-2 rotate-45 bg-[#0e2217] border-emerald-500/30",
                isTopTeamGKOrDef 
                  ? "-top-1 left-1/2 -translate-x-1/2 border-t border-l" 
                  : "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b"
              )} 
            />

            {/* Header: Name, Position, Number, Rating */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <div className="text-right">
                <div className="font-black text-xs text-white truncate max-w-[130px]">{player.name}</div>
                <div className="text-[9px] text-emerald-400 font-extrabold mt-0.5 flex items-center gap-1">
                  <span>
                    {player.position === 'GK' && 'حارس مرمى'}
                    {player.position === 'DEF' && 'مدافع'}
                    {player.position === 'MID' && 'لاعب وسط'}
                    {player.position === 'FWD' && 'مهاجم'}
                  </span>
                  <span>•</span>
                  <span>#{player.number}</span>
                </div>
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-0.5 shadow-sm",
                stats.rating >= 8.0 
                  ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                  : stats.rating >= 7.2
                  ? "text-yellow-400 bg-yellow-400/15 border-yellow-400/30"
                  : "text-amber-500 bg-amber-500/15 border-amber-500/30"
              )}>
                <Award size={10} className="inline-block" />
                {stats.rating}
              </div>
            </div>

            {/* Statistics rows */}
            <div className="space-y-2 text-[10px] font-bold">
              {/* Passes Completed */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Zap size={10} className="text-emerald-400" />
                  التمريرات ناجحة
                </span>
                <span className="text-gray-200">
                  {stats.passesCompleted}/{stats.passesAttempted} ({Math.round((stats.passesCompleted / stats.passesAttempted) * 100)}%)
                </span>
              </div>

              {/* Duels Won */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Shield size={10} className="text-emerald-400" />
                  الالتحامات بدقة
                </span>
                <span className="text-gray-200">
                  {stats.duelsWon}/{stats.duelsTotal}
                </span>
              </div>

              {/* Dynamic extra 1 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Activity size={10} className="text-emerald-400 animate-pulse" />
                  {stats.extraLabel1}
                </span>
                <span className="text-emerald-400 font-black">
                  {stats.extraValue1}
                </span>
              </div>

              {/* Dynamic extra 2 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1 font-semibold">
                  <Info size={10} className="text-emerald-400" />
                  {stats.extraLabel2}
                </span>
                <span className="text-gray-200">
                  {stats.extraValue2}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface PlayerListItemProps {
  player: Player;
  isHome: boolean;
}

export function PlayerListItem({ player, isHome }: PlayerListItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 text-right">
      <div className="flex items-center gap-3">
        <span className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] border",
          isHome ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/10 border-secondary/20 text-secondary"
        )}>
          {player.number}
        </span>
        <div>
          <h5 className="text-xs font-black text-white">{player.name}</h5>
          <span className="text-[9px] text-gray-500 font-bold block">
            {
              player.position === 'GK' ? 'حارس مرمى' :
              player.position === 'DEF' ? 'مدافع' :
              player.position === 'MID' ? 'لاعب وسط' : 'مهاجم'
            }
          </span>
        </div>
      </div>
      
      {player.subbedOut && player.subPlayer && (
        <div className="flex items-center gap-2">
          <div className="text-left">
            <span className="text-[10px] text-red-400 font-extrabold flex items-center gap-0.5 justify-end">
              <ArrowDownLeft size={11} />
              خرج {player.subTime}
            </span>
            <span className="text-[9px] text-gray-500 block">البديل: {player.subPlayer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
