import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RefreshCw, Calendar, MapPin, ArrowUpRight, ArrowDownLeft, Info, HelpCircle, Award, Shield, Zap, Activity, Flame, X, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { Match } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { translationService } from '../services/translationService';

export interface PlayerStats {
  rating: number;
  passesCompleted: number;
  passesAttempted: number;
  duelsWon: number;
  duelsTotal: number;
  extraLabel1: string;
  extraValue1: string;
  extraLabel2: string;
  extraValue2: string;
}

export interface Player {
  number: number;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  subbedOut?: boolean;
  subbedIn?: boolean;
  subTime?: string;
  subPlayer?: string; // name of player swapped with
}

export function generatePlayerStats(player: Player): PlayerStats {
  // Use a simple hash of player.name to make sure statistics are deterministic
  let hash = 0;
  for (let i = 0; i < player.name.length; i++) {
    hash = player.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const rating = Number((6.8 + (hash % 23) / 10).toFixed(1)); // 6.8 - 9.0

  const passesAttempted = 25 + (hash % 45); // 25 - 69
  const passPercent = 75 + (hash % 21); // 75% - 95%
  const passesCompleted = Math.round((passesAttempted * passPercent) / 100);

  const duelsTotal = 4 + (hash % 8); // 4 - 11
  const duelsWon = Math.round((duelsTotal * (55 + (hash % 36))) / 100);

  let extraLabel1 = "قطع كرات";
  let extraValue1 = `${2 + (hash % 5)}`;
  let extraLabel2 = "ركض (كم)";
  let extraValue2 = `${(9.5 + (hash % 30) / 10).toFixed(1)}`;

  if (player.position === 'GK') {
    extraLabel1 = "تصديات رائعة";
    extraValue1 = `${3 + (hash % 4)}`;
    extraLabel2 = "تشتيت بنجاح";
    extraValue2 = `${1 + (hash % 3)}`;
  } else if (player.position === 'DEF') {
    extraLabel1 = "تشتيت كرات";
    extraValue1 = `${4 + (hash % 6)}`;
    extraLabel2 = "اعتراض هجمات";
    extraValue2 = `${2 + (hash % 4)}`;
  } else if (player.position === 'MID') {
    extraLabel1 = "تمريرات مفتاحية";
    extraValue1 = `${2 + (hash % 4)}`;
    extraLabel2 = "نجاح الالتحامات";
    extraValue2 = `${60 + (hash % 30)}%`;
  } else if (player.position === 'FWD') {
    extraLabel1 = "على المرمى";
    const totalShots = 2 + (hash % 4);
    const onTarget = Math.max(1, totalShots - (hash % 3));
    extraValue1 = `${onTarget}/${totalShots}`;
    extraLabel2 = "مراوغات ناجحة";
    const totalDribbles = 3 + (hash % 5);
    const succDribbles = Math.max(1, totalDribbles - (hash % 3));
    extraValue2 = `${succDribbles}/${totalDribbles}`;
  }

  return {
    rating,
    passesCompleted,
    passesAttempted,
    duelsWon,
    duelsTotal,
    extraLabel1,
    extraValue1,
    extraLabel2,
    extraValue2
  };
}

export interface TeamRoster {
  formation: string;
  players: Player[];
  substitutes: Player[];
}

export function mapTeamRoster(lineup: any): TeamRoster {
  if (!lineup) return { formation: '-', players: [], substitutes: [] };
  
  const mapPos = (pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    const p = String(pos || '').toUpperCase();
    if (p === 'G' || p === 'GK') return 'GK';
    if (p === 'D' || p === 'DEF') return 'DEF';
    if (p === 'M' || p === 'MID') return 'MID';
    if (p === 'F' || p === 'FWD' || p === 'ATT') return 'FWD';
    return 'MID';
  };

  return {
    formation: lineup.formation || '-',
    players: (lineup.startXI || []).map((p: any) => ({
      number: p.player?.number || 0,
      name: p.player?.name || '',
      position: mapPos(p.player?.pos)
    })),
    substitutes: (lineup.substitutes || []).map((p: any) => ({
      number: p.player?.number || 0,
      name: p.player?.name || '',
      position: mapPos(p.player?.pos)
    }))
  };
}

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
              {/* Hot Spot 1: Midfield dominance */}
              <div 
                className="absolute w-[45%] h-[30%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.35)_0%,rgba(245,158,11,0.15)_45%,rgba(16,185,129,0.03)_70%,rgba(0,0,0,0)_100%)] blur-md animate-pulse"
                style={{ top: '35%', left: '25%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 2: Home Striker presence / Away Defense */}
              <div 
                className="absolute w-[35%] h-[25%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.3)_0%,rgba(251,191,36,0.12)_50%,rgba(0,0,0,0)_100%)] blur-sm"
                style={{ top: '15%', left: '50%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 3: Home Right Wing flank run */}
              <div 
                className="absolute w-[20%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.25)_0%,rgba(16,185,129,0.05)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '65%', left: '15%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 4: Away Left Wing flank run */}
              <div 
                className="absolute w-[22%] h-[35%] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.28)_0%,rgba(16,185,129,0.05)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '25%', left: '85%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 5: Defensive shield Area Home */}
              <div 
                className="absolute w-[40%] h-[22%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.25)_0%,rgba(245,158,11,0.1)_50%,rgba(0,0,0,0)_100%)] blur-md"
                style={{ top: '78%', left: '48%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Hot Spot 6: Buildup Zone Center */}
              <div 
                className="absolute w-[30%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,rgba(16,185,129,0.06)_60%,rgba(0,0,0,0)_100%)]"
                style={{ top: '50%', left: '70%', transform: 'translate(-50%, -50%)' }}
              />

              {/* Interactive Heat labels in empty areas */}
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
          
          {/* ==================== AWAY TEAM ROW (Top-Down index order) ==================== */}
          <div className="relative w-full h-[45%] flex flex-col justify-between pt-2">
            
            {/* Row 1: GK (Away) */}
            <div className="flex justify-center">
              {awaySubsets.gk.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 2: DEF (Away) */}
            <div className="flex justify-around px-2">
              {awaySubsets.def.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 3: MID (Away) */}
            <div className="flex justify-around px-8">
              {awaySubsets.mid.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 4: FWD (Away) */}
            <div className="flex justify-around px-12">
              {awaySubsets.fwd.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={false} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

          </div>

          {/* ==================== HOME TEAM ROW (Bottom-Up index order) ==================== */}
          <div className="relative w-full h-[45%] flex flex-col-reverse justify-between pb-2">
            
            {/* Row 1: GK (Home) */}
            <div className="flex justify-center">
              {homeSubsets.gk.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 2: DEF (Home) */}
            <div className="flex justify-around px-2">
              {homeSubsets.def.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 3: MID (Home) */}
            <div className="flex justify-around px-8">
              {homeSubsets.mid.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

            {/* Row 4: FWD (Home) */}
            <div className="flex justify-around px-12">
              {homeSubsets.fwd.map((p, i) => (
                <PlayerNode key={p.name} player={p} isHome={true} onClick={() => setSelectedPlayer(p)} showHeatmap={showHeatmap} />
              ))}
            </div>

          </div>

        </div>

        {/* Selected Player Status Card Popup (Micro Tooltip overlay) */}
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
                className="p-1 px-2.5 bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs hover:bg-primary/30 transition-colors font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>الملف الشخصي 👤</span>
              </button>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="p-1 px-2.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors border border-white/5 font-bold cursor-pointer"
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
                {/* Timeline node dot */}
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

      {/* AI Lineup Analysis Popup Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-text" style={{ direction: 'rtl' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0c0e12] border border-white/10 rounded-[28px] w-full max-w-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col max-h-[85vh] relative text-right"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">التحليل التكتيكي للتشكيلة وتوقعات الأداء</h3>
                    <p className="text-[10px] text-gray-500 font-bold">بواسطة مخرجات الذكاء الاصطناعي من Gemini AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-400 animate-spin" />
                      <Sparkles size={24} className="text-emerald-400 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm font-black text-gray-200">
                        {analysisProgressStep === 0 && "جاري قراءة ودراسة التشكيل والتكتيك المعتمد..."}
                        {analysisProgressStep === 1 && "جاري استنتاج وتحليل نقاط القوة والضعف بالذكاء الاصطناعي..."}
                        {analysisProgressStep === 2 && "جاري توليد توقعات الأداء والسيناريوهات المحتملة..."}
                        {analysisProgressStep >= 3 && "جاري حساب نسب الفوز ونهاية التحليل..."}
                      </p>
                      <p className="text-xs text-gray-500 font-bold">يستغرق هذا الإجراء بضع ثوانٍ للحصول على أدق البيانات الفنية</p>
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                      <Info size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-red-400">فشل التحليل للفريقين</p>
                      <p className="text-xs text-gray-500 max-w-md font-bold leading-relaxed">{analysisError}</p>
                    </div>
                    <button
                      onClick={handleAnalyzeLineups}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer outline-none"
                    >
                      <RefreshCw size={12} className="animate-spin-slow" />
                      <span>إعادة المحاولة الفورية</span>
                    </button>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-6">
                    {/* Highlight Dashboard Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Result Probabilities Card */}
                      <div className="col-span-1 md:col-span-2 bg-[#12151b] border border-white/5 rounded-2xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-300">نسب احتمالات النتيجة الفنية</span>
                          <TrendingUp size={14} className="text-emerald-400" />
                        </div>
                        
                        {/* Progress Bar Display */}
                        <div className="space-y-2 text-[11px] font-bold">
                          <div className="h-2.5 rounded-full overflow-hidden flex bg-white/5">
                            <div 
                              style={{ width: `${analysisResult.probabilities?.homeWin || 33}%` }} 
                              className="bg-emerald-500 h-full transition-all duration-1000"
                              title={`فوز ${homeName}`}
                            />
                            <div 
                              style={{ width: `${analysisResult.probabilities?.draw || 33}%` }} 
                              className="bg-gray-500 h-full transition-all duration-1000"
                              title="تعادل"
                            />
                            <div 
                              style={{ width: `${analysisResult.probabilities?.awayWin || 34}%` }} 
                              className="bg-indigo-500 h-full transition-all duration-1000"
                              title={`فوز ${awayName}`}
                            />
                          </div>
                          {/* Labels row */}
                          <div className="flex justify-between items-center text-gray-400 mt-1 flex-wrap gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              فوز {homeName}: <span className="text-emerald-400 font-extrabold">{analysisResult.probabilities?.homeWin}%</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-gray-500" />
                              تعادل: <span className="text-gray-300 font-extrabold">{analysisResult.probabilities?.draw}%</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              فوز {awayName}: <span className="text-indigo-400 font-extrabold">{analysisResult.probabilities?.awayWin}%</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Prediction Badge Card */}
                      <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">التوقع الرقمي المقترح</span>
                        <div className="text-3xl font-black text-emerald-300 tracking-wider my-1">
                          {analysisResult.predictedScore || "? - ?"}
                        </div>
                        <span className="text-[9px] text-gray-500 font-semibold">توقع النتيجة النهائية</span>
                      </div>
                    </div>

                    {/* Tactical Overview Description */}
                    <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-2.5">
                      <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <Shield size={13} />
                        التحليل التكتيكي وبناء الخطط
                      </h4>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        {analysisResult.tacticalOverview}
                      </p>
                    </div>

                    {/* Strengths & Weaknesses comparison grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths Card */}
                      <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-3.5">
                        <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Zap size={13} className="animate-pulse" />
                          مكامن القوة للخطتين
                        </h4>
                        <div className="space-y-3">
                          {/* Home Strengths */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 w-fit block">{homeName}</span>
                            <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                              {(analysisResult.strengths?.home || []).map((s: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 mt-0.5">✓</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Away Strengths */}
                          <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                            <span className="text-[10px] font-black text-secondary px-1.5 py-0.5 rounded bg-secondary/10 w-fit block">{awayName}</span>
                            <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                              {(analysisResult.strengths?.away || []).map((s: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 mt-0.5">✓</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Weaknesses Card */}
                      <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-3.5">
                        <h4 className="text-xs font-black text-red-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                          <Info size={13} />
                          نقاط الضعف والثغرات المحتملة
                        </h4>
                        <div className="space-y-3">
                          {/* Home Weaknesses */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 w-fit block">{homeName}</span>
                            <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                              {(analysisResult.weaknesses?.home || []).map((w: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-red-500 mt-0.5">⚡</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* Away Weaknesses */}
                          <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                            <span className="text-[10px] font-black text-secondary px-1.5 py-0.5 rounded bg-secondary/10 w-fit block">{awayName}</span>
                            <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                              {(analysisResult.weaknesses?.away || []).map((w: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-red-500 mt-0.5">⚡</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Head-To-Head Matchups */}
                    <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <Users size={13} />
                        المواجهات الثنائية الحاسمة
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                        {(analysisResult.keyMatchups || []).map((item: any, idx: number) => (
                          <div key={idx} className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2 animate-fade-in">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {item.players}
                            </span>
                            <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Scenario and Narrative Predictions */}
                    <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-2.5">
                      <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <Flame size={13} />
                        سيناريو اللقاء المتوقع
                      </h4>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed">
                        {analysisResult.predictions}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-white/5 px-6 py-4 bg-white/[0.01] flex justify-end">
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-black text-xs transition-all cursor-pointer outline-none"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- PLAYER NODE RENDERED ON FIELD ----------------
interface PlayerNodeProps {
  player: Player;
  isHome: boolean;
  onClick: () => void;
  showHeatmap: boolean;
}

function PlayerNode({ player, isHome, onClick, showHeatmap }: PlayerNodeProps) {
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

// ---------------- PLAYER LIST ITEM RENDERED IN LIST ----------------
interface PlayerListItemProps {
  player: Player;
  isHome: boolean;
}

function PlayerListItem({ player, isHome }: PlayerListItemProps) {
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
