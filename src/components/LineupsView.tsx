import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RefreshCw, ArrowUpRight, ArrowDownLeft, X, Sparkles, Flame } from 'lucide-react';
import { Match } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { translationService } from '../services/translationService';

// Import newly refactored modular components & helper functions
import { Player, TeamRoster, mapTeamRoster } from './lineups/LineupTypes';
import { PlayerNode, PlayerListItem } from './lineups/PlayerComponents';
import { LineupsAnalysisModal } from './lineups/LineupsAnalysisModal';

interface LineupsViewProps {
  match: Match;
}

export default function LineupsView({ match }: LineupsViewProps) {
  const navigate = useNavigate();
  const rawHomeName = typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam;
  const rawAwayName = typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam;
  const homeName = translationService.translateTeam(rawHomeName);
  const awayName = translationService.translateTeam(rawAwayName);
  
  const homeLineup = match.lineups?.[0];
  const awayLineup = match.lineups?.[1];

  const homeRoster = React.useMemo(() => mapTeamRoster(homeLineup), [homeLineup]);
  const awayRoster = React.useMemo(() => mapTeamRoster(awayLineup), [awayLineup]);
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [showHeatmap, setShowHeatmap] = React.useState(false);

  // AI Tactical Lineup Analysis states
  const [showAnalysisModal, setShowAnalysisModal] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [analysisProgressStep, setAnalysisProgressStep] = React.useState(0);

  const handleAnalyzeLineups = async () => {
    setShowAnalysisModal(true);
    if (analysisResult) return; // Retrieve cached session result if already requested
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgressStep(0);
    
    // Smooth loading cycle animations to indicate real progress
    const interval = setInterval(() => {
      setAnalysisProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1250);

    try {
      const response = await fetch(`/api/matches/${match.id || 'match'}/analyze-lineup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchData: match,
          homeRoster,
          awayRoster
        })
      });

      if (!response.ok) {
        throw new Error("فشلت عملية الاتصال بخادم الذكاء الاصطناعي لتحليل التشكيل. يرجى المحاولة لاحقاً.");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error("AI lineup analysis failed:", err);
      setAnalysisError(err?.message || "حدث خطأ فني غير متوقع أثناء توليد التحليلات التكتيكية.");
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  // Distribute players into subsets grouped by role
  const getSubsets = (roster: TeamRoster) => {
    const gk = roster.players.filter(p => p.position === 'GK');
    const def = roster.players.filter(p => p.position === 'DEF');
    const mid = roster.players.filter(p => p.position === 'MID');
    const fwd = roster.players.filter(p => p.position === 'FWD');
    return { gk, def, mid, fwd };
  };

  const homeSubsets = getSubsets(homeRoster);
  const awaySubsets = getSubsets(awayRoster);

  // Group all substitutions to show a modern timeline
  const substitutions = React.useMemo(() => {
    const list: Array<{ time: string, team: string, outPlayer: string, inPlayer: string, isHome: boolean }> = [];
    homeRoster.players.forEach(p => {
      if (p.subbedOut && p.subPlayer && p.subTime) {
        list.push({ time: p.subTime, team: homeName, outPlayer: p.name, inPlayer: p.subPlayer, isHome: true });
      }
    });
    awayRoster.players.forEach(p => {
      if (p.subbedOut && p.subPlayer && p.subTime) {
        list.push({ time: p.subTime, team: awayName, outPlayer: p.name, inPlayer: p.subPlayer, isHome: false });
      }
    });
    return list.sort((a, b) => (parseInt(a.time) || 0) - (parseInt(b.time) || 0));
  }, [homeRoster, awayRoster, homeName, awayName]);

  return (
    <div className="space-y-8 select-none" style={{ direction: 'rtl' }}>
      {/* Field Overview Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Users size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-200">الرسم التكتيكي للفريقين</h4>
            <p className="text-[10px] text-gray-500 font-bold">انقر على اللاعب لعرض تفاصيل التبديل والبيانات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Lineup Analysis Button */}
          <button
            type="button"
            onClick={handleAnalyzeLineups}
            className="text-[11px] font-black px-3.5 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.06)] outline-none"
          >
            <Sparkles size={11} className="text-emerald-400 animate-pulse" />
            <span>تحليل التشكيلة بالذكاء الاصطناعي ✨</span>
          </button>

          {/* Heat map toggle button */}
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={cn(
              "text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center gap-1.5 relative overflow-hidden cursor-pointer outline-none",
              showHeatmap 
                ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-black" 
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 font-bold"
            )}
          >
            <Flame size={12} className={cn(showHeatmap && "animate-pulse text-red-500")} />
            <span>{showHeatmap ? 'إغلاق الخريطة الحرارية' : 'الخريطة الحرارية 🔥'}</span>
          </button>

          <span 
            onClick={() => navigate(`/team/${encodeURIComponent(homeName)}`)}
            className="text-[11px] font-bold bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-gray-400 hidden sm:inline-block cursor-pointer hover:text-primary transition-colors"
          >
            {homeName}: {homeRoster.formation}
          </span>
          <span 
            onClick={() => navigate(`/team/${encodeURIComponent(awayName)}`)}
            className="text-[11px] font-bold bg-white/5 px-3 py-1.5 border border-white/10 rounded-xl text-gray-400 hidden sm:inline-block cursor-pointer hover:text-secondary transition-colors"
          >
            {awayName}: {awayRoster.formation}
          </span>
        </div>
      </div>

      {/* Graphical Tactical Football Pitch */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/20 bg-[#072412] relative aspect-[3/4] sm:aspect-[2/3] px-2 py-4"
        style={{
          boxShadow: 'inset 0 0 80px rgba(16, 185, 129, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Grass Pattern Strides (Alternating stripes) */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className={cn("flex-1 w-full", i % 2 === 0 ? "bg-emerald-950/40" : "bg-transparent")} 
            />
          ))}
        </div>

        {/* Pitch Lines */}
        <div className="absolute inset-4 border border-emerald-500/30 rounded-2xl pointer-events-none">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-emerald-500/30" />
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-emerald-500/30 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />

          {/* Top Penalty Area (Away) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[15%] border-b border-x border-emerald-500/30">
            {/* Goal Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%] border-b border-x border-emerald-500/20" />
            {/* Penalty spot */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
            {/* Penalty arch */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-6 border-b border-emerald-500/30 rounded-b-full pointer-events-none" />
          </div>

          {/* Bottom Penalty Area (Home) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[15%] border-t border-x border-emerald-500/30">
            {/* Goal Area */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[40%] border-t border-x border-emerald-500/20" />
            {/* Penalty spot */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
            {/* Penalty arch */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-6 border-t border-emerald-500/30 rounded-t-full pointer-events-none" />
          </div>

          {/* Corner Arcs */}
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-b border-l border-emerald-500/30 rounded-bl-full" />
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-b border-r border-emerald-500/30 rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-t border-l border-emerald-500/30 rounded-tl-full" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-t border-r border-emerald-500/30 rounded-tr-full" />
        </div>

        {/* Heatmap Overlay */}
        <AnimatePresence>
          {showHeatmap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-4 z-0 pointer-events-none overflow-hidden rounded-2xl"
            >
              {/* Hot Spots */}
              <div 
                className="absolute w-[45%] h-[30%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.35)_0%,rgba(245,158,11,0.15)_45%,rgba(16,185,129,0.03)_70%,rgba(0,0,0,0)_100%)] blur-md animate-pulse"
                style={{ top: '35%', left: '25%', transform: 'translate(-50%, -50%)' }}
              />
              <div 
                className="absolute w-[35%] h-[25%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.3)_0%,rgba(251,191,36,0.12)_50%,rgba(0,0,0,0)_100%)] blur-sm"
                style={{ top: '15%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />
              <div 
                className="absolute w-[20%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.25)_0%,rgba(16,185,129,0.05)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '65%', left: '15%', transform: 'translate(-50%, -50%)' }}
              />
              <div 
                className="absolute w-[22%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.28)_0%,rgba(16,185,129,0.05)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '25%', left: '85%', transform: 'translate(-50%, -50%)' }}
              />
              <div 
                className="absolute w-[40%] h-[22%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.25)_0%,rgba(245,158,11,0.1)_50%,rgba(0,0,0,0)_100%)] blur-md"
                style={{ top: '78%', left: '48%', transform: 'translate(-50%, -50%)' }}
              />
              <div 
                className="absolute w-[30%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,rgba(16,185,129,0.06)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '50%', left: '70%', transform: 'translate(-50%, -50%)' }}
              />

              <div className="absolute top-[18%] left-[78%] border border-red-500/25 bg-red-950/40 backdrop-blur-sm shadow-sm px-1.5 py-0.5 rounded text-[8px] font-black text-red-400 select-none">
                منطقة هجومية مكثفة 🔥
              </div>
              <div className="absolute bottom-[22%] left-[12%] border border-yellow-500/25 bg-yellow-950/40 backdrop-blur-sm shadow-sm px-1.5 py-0.5 rounded text-[8px] font-black text-yellow-400 select-none">
                صناعة الفرص ⚽
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heatmap Legend */}
        {showHeatmap && (
          <div className="absolute bottom-4 right-4 z-20 bg-black/80 border border-white/10 px-2.5 py-1.5 rounded-xl flex items-center gap-2 text-[9px] font-extrabold backdrop-blur-md">
            <span className="text-gray-400">مفتاح الخريطة:</span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> مرتفع
            </span>
            <span className="flex items-center gap-1 text-yellow-500">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> متوسط
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> منخفض
            </span>
          </div>
        )}

        {/* Players Overlay container */}
        <div className="absolute inset-4 z-10 flex flex-col justify-between">
          
          {/* AWAY TEAM ROW (Top-Down index order) */}
          <div className="relative w-full h-[45%] flex flex-col justify-between pt-2">
            <div className="flex justify-center">
              {awaySubsets.gk.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
            <div className="flex justify-around px-2">
              {awaySubsets.def.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
            <div className="flex justify-around px-8">
              {awaySubsets.mid.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
            <div className="flex justify-around px-12">
              {awaySubsets.fwd.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
          </div>

          {/* HOME TEAM ROW (Bottom-Up index order) */}
          <div className="relative w-full h-[45%] flex flex-col-reverse justify-between pb-2">
            <div className="flex justify-center">
              {homeSubsets.gk.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
            <div className="flex justify-around px-2">
              {homeSubsets.def.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
            <div className="flex justify-around px-8">
              {homeSubsets.mid.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
            <div className="flex justify-around px-12">
              {homeSubsets.fwd.map((p) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>
          </div>

        </div>

        {/* Selected Player Status Card Popup */}
        {selectedPlayer && (
          <div className="absolute inset-x-4 bottom-4 z-20 bg-[#0d1512]/95 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-white backdrop-blur-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-emerald-500/50 flex items-center justify-center font-black bg-emerald-500/10 text-emerald-400">
                {selectedPlayer.number}
              </div>
              <div>
                <h5 className="font-extrabold text-sm text-white">{selectedPlayer.name}</h5>
                <p className="text-[10px] text-gray-400 uppercase font-black block mt-0.5">
                  المركز • {
                    selectedPlayer.position === 'GK' ? 'حارس مرمى' :
                    selectedPlayer.position === 'DEF' ? 'مدافع' :
                    selectedPlayer.position === 'MID' ? 'خط وسط' : 'مهاجم'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedPlayer.subbedOut && (
                <div className="text-right">
                  <span className="text-[10px] text-red-400 font-extrabold flex items-center gap-1">
                    <ArrowDownLeft size={12} />
                    تم تبديله ({selectedPlayer.subTime})
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">البديل: {selectedPlayer.subPlayer}</span>
                </div>
              )}
              {!selectedPlayer.subbedOut && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  خاض المباراة كاملة ⚡
                </span>
              )}
              <button 
                onClick={() => navigate(`/player/${encodeURIComponent(selectedPlayer.name)}`)}
                className="p-1 px-2.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs hover:bg-primary/30 transition-colors font-bold flex items-center gap-1 cursor-pointer font-sans"
              >
                <span>الملف الشخصي 👤</span>
              </button>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="p-1 px-2.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors border border-white/5 font-bold cursor-pointer font-sans"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Starting Squad Table Lists & Substitutes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Home Team Starting XI List */}
        <div className="glass p-5 rounded-3xl space-y-4 border border-white/5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h4 className="font-black text-sm text-gray-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span 
                onClick={() => navigate(`/team/${encodeURIComponent(homeName)}`)}
                className="cursor-pointer hover:text-primary transition-colors hover:underline decoration-primary decoration-2 underline-offset-4"
              >
                تشكيلة {homeName} الأساسية
              </span>
            </h4>
            <span className="text-[10px] font-black uppercase text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {homeRoster.formation}
            </span>
          </div>
          
          <div className="divide-y divide-white/[0.03] space-y-2.5">
            {homeRoster.players.map((p) => (
              <PlayerListItem key={p.name} player={p} isHome={true} />
            ))}
          </div>

          {/* Substitutes */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h5 
              onClick={() => navigate(`/team/${encodeURIComponent(homeName)}`)}
              className="text-xs font-black text-gray-400 cursor-pointer hover:text-primary transition-colors"
            >
              قائمة بدلاء {homeName}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
              {homeRoster.substitutes.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-black text-gray-400 w-4">{s.number}</span>
                    <span className="font-bold text-gray-300 truncate">{s.name}</span>
                  </div>
                  {s.subbedIn && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <ArrowUpRight size={10} />
                      {s.subTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Away Team Starting XI List */}
        <div className="glass p-5 rounded-3xl space-y-4 border border-white/5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h4 className="font-black text-sm text-gray-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span 
                onClick={() => navigate(`/team/${encodeURIComponent(awayName)}`)}
                className="cursor-pointer hover:text-secondary transition-colors hover:underline decoration-secondary decoration-2 underline-offset-4"
              >
                تشكيلة {awayName} الأساسية
              </span>
            </h4>
            <span className="text-[10px] font-black uppercase text-secondary/80 bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
              {awayRoster.formation}
            </span>
          </div>

          <div className="divide-y divide-white/[0.03] space-y-2.5">
            {awayRoster.players.map((p) => (
              <PlayerListItem key={p.name} player={p} isHome={false} />
            ))}
          </div>

          {/* Substitutes */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h5 
              onClick={() => navigate(`/team/${encodeURIComponent(awayName)}`)}
              className="text-xs font-black text-gray-400 cursor-pointer hover:text-secondary transition-colors"
            >
              قائمة بدلاء {awayName}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
              {awayRoster.substitutes.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-black text-gray-400 w-4">{s.number}</span>
                    <span className="font-bold text-gray-300 truncate">{s.name}</span>
                  </div>
                  {s.subbedIn && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <ArrowUpRight size={10} />
                      {s.subTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Substitutions Timeline feed */}
      {substitutions.length > 0 && (
        <div className="glass p-5 rounded-3xl border border-white/5 space-y-4">
          <h4 className="font-black text-sm text-gray-200 flex items-center gap-2">
            <RefreshCw size={14} className="text-emerald-400 animate-spin-slow" />
            سجل تبديلات اللقاء
          </h4>
          <div className="relative border-r border-white/5 mr-3 pr-4 py-2 space-y-6">
            {substitutions.map((sub, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <div className="absolute top-1 -right-[23px] w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background ring-4 ring-emerald-400/15" />
                <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/10">
                  د {sub.time.replace("'", "")}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white">{sub.team}</span>
                    <span className="text-[10px] font-bold text-gray-500">•</span>
                    <span className="text-[11px] font-bold text-gray-400">دخول: </span>
                    <span className="text-xs font-black text-emerald-400">{sub.inPlayer}</span>
                    <span className="text-[10px] text-gray-500 font-bold">بدلاً من</span>
                    <span className="text-xs font-black text-red-400">{sub.outPlayer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Analysis Modal Overlay */}
      <LineupsAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        homeName={homeName}
        awayName={awayName}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        analysisResult={analysisResult}
        analysisProgressStep={analysisProgressStep}
        onRetry={handleAnalyzeLineups}
      />
    </div>
  );
}
