import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Target, 
  ShieldAlert, 
  Dribbble, 
  Zap, 
  Award, 
  Activity,
  Heart,
  BarChart
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Tooltip as RechartsTooltip,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { Match, MatchStats } from '../types';
import { handleImageError, getFallbackImageUrl } from '../utils/teamUtils';
import { mapMatchStats } from '../services/statsMapper';
import { translationService } from '../services/translationService';

import ImageResolver from './ui/ImageResolver';

interface MatchStatsViewProps {
  match: Match;
}

interface EnrichedStatMetric {
  label: string;
  home: number;
  away: number;
  suffix?: string;
  category: 'general' | 'attack' | 'passing' | 'defense';
}

// Sub-component for graphical overview
const VisualStatsOverview = ({ metrics, homeTeam, awayTeam }: { metrics: EnrichedStatMetric[], homeTeam: string, awayTeam: string }) => {
  const possession = metrics.find(m => m.label === 'الاستحواذ');
  
  const possessionData = [
    { name: homeTeam, value: possession?.home || 50, color: '#22c55e' },
    { name: awayTeam, value: possession?.away || 50, color: '#45e9f5' }
  ];

  // Prepare radar data for key attack/defense metrics
  const radarData = [
    { subject: 'التسديدات', A: metrics.find(m => m.label === 'إجمالي التسديدات')?.home || 0, B: metrics.find(m => m.label === 'إجمالي التسديدات')?.away || 0, fullMark: 20 },
    { subject: 'على المرمى', A: (metrics.find(m => m.label === 'التسديدات على المرمى')?.home || 0) * 2, B: (metrics.find(m => m.label === 'التسديدات على المرمى')?.away || 0) * 2, fullMark: 20 },
    { subject: 'الركنيات', A: (metrics.find(m => m.label === 'الضربات الركنية')?.home || 0) * 2, B: (metrics.find(m => m.label === 'الضربات الركنية')?.away || 0) * 2, fullMark: 20 },
    { subject: 'الدقة %', A: metrics.find(m => m.label === 'دقة التمرير المكتمل')?.home || 0, B: metrics.find(m => m.label === 'دقة التمرير المكتمل')?.away || 0, fullMark: 100 },
    { subject: 'التدخلات', A: (metrics.find(m => m.label === 'معدل التدخلات الناجحة')?.home || 0) * 3, B: (metrics.find(m => m.label === 'معدل التدخلات الناجحة')?.away || 0) * 3, fullMark: 30 }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Possession Pie */}
      <div className="bg-[#121926]/40 border border-white/5 p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute top-4 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">معدل الاستحواذ</div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={possessionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {possessionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0b1121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-xl font-black text-white">{possession?.home}%</div>
            <div className="text-[8px] text-gray-500 font-bold uppercase">الاستحواذ</div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black text-gray-300">{homeTeam}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-[10px] font-black text-gray-300">{awayTeam}</span>
          </div>
        </div>
      </div>

      {/* Comparison Radar */}
      <div className="bg-[#121926]/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-4 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">توازن القوة</div>
        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 9, fontWeight: 900 }} />
              <Radar
                name={homeTeam}
                dataKey="A"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
              <Radar
                name={awayTeam}
                dataKey="B"
                stroke="#45e9f5"
                fill="#45e9f5"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Professional empty state component
const StatsUnavailableBanner = () => (
  <div className="glass p-6 rounded-2xl border border-white/10 bg-[#0e1622]/20 flex flex-col items-center justify-center text-center gap-3 select-none">
    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
      <Activity size={24} />
    </div>
    <h3 className="text-white font-black text-sm">Match statistics are not available yet</h3>
    <p className="text-[11px] text-gray-400 font-medium max-w-[200px]">Real-time statistics will appear when provided by the official data source.</p>
  </div>
);

// Simplified mapper logic that only extracts real stats
export function getStatsMetrics(match: Match): EnrichedStatMetric[] | null {
  const stats = mapMatchStats(match);
  if (!stats) return null;

  const metrics: EnrichedStatMetric[] = [];
  
  if (stats.possession) metrics.push({ ...stats.possession, category: 'general' });
  if (stats.shots) metrics.push({ ...stats.shots, category: 'general' });
  if (stats.shotsOnTarget) metrics.push({ ...stats.shotsOnTarget, category: 'general' });
  if (stats.corners) metrics.push({ ...stats.corners, category: 'general' });
  if (stats.fouls) metrics.push({ ...stats.fouls, category: 'defense' });
  if (stats.yellowCards) metrics.push({ ...stats.yellowCards, category: 'defense' });
  if (stats.redCards) metrics.push({ ...stats.redCards, category: 'defense' });
  
  return metrics;
}

export default function MatchStatsView({ match }: MatchStatsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'attack' | 'passing' | 'defense'>('all');

  const allMetrics = React.useMemo(() => getStatsMetrics(match), [match]);

  if (!allMetrics) {
    return <StatsUnavailableBanner />;
  }

  const filteredMetrics = React.useMemo(() => {
    if (activeTab === 'all') return allMetrics;
    return allMetrics.filter(m => m.category === activeTab);
  }, [allMetrics, activeTab]);

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      
      {/* Category Tabs / Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-b border-white/5 no-scrollbar select-none">
        {[
          { id: 'all', label: 'الكل 📊', icon: BarChart3 },
          { id: 'general', label: 'العام ⚽', icon: Zap },
          { id: 'attack', label: 'الهجوم 🔥', icon: Target },
          { id: 'passing', label: 'التمرير 🔄', icon: Activity },
          { id: 'defense', label: 'الدفاع 🛡️', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative text-[10px] sm:text-[11px] font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none outline-none shrink-0 ${
                isActive 
                  ? 'text-black font-extrabold' 
                  : 'hover:bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="statsFilterTabMarker"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-[0_2px_10px_rgba(0,255,130,0.2)]"
                />
              )}
              <Icon size={12} className={isActive ? 'text-black' : 'text-gray-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Visual Analytics Overview (Recharts) */}
      <VisualStatsOverview 
        metrics={allMetrics} 
        homeTeam={match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam) : ''} 
        awayTeam={match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam) : ''} 
      />

      {/* Visual Team Comparison Summary Header */}
      <div className="bg-[#121926]/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4 select-none backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.15)] md:px-8">
        <div className="flex items-center gap-2.5">
          <ImageResolver 
            src={match.homeLogo || undefined} 
            fallbackType="team" 
            fallbackText={match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam) : ''} 
            tla={match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).tla : undefined) : undefined}
            className="w-8 h-8 object-contain rounded-xl bg-white/5 p-0.5 border border-white/10" 
          />
          <span className="text-xs font-black text-gray-200 truncate max-w-[100px] sm:max-w-none">{match.homeTeam ? (typeof match.homeTeam === 'object' ? (match.homeTeam as any).name : match.homeTeam) : ''}</span>
        </div>

        <div className="text-center space-y-0.5 shrink-0">
          <span className="text-[9px] font-black uppercase text-primary tracking-wider block">الأداء العام</span>
          <div className="flex items-center gap-1.5 font-mono text-sm font-black text-white tabular-nums">
            <span className="text-emerald-400">{match.homeScore}</span>
            <span className="text-gray-600">:</span>
            <span className="text-secondary">{match.awayScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black text-gray-200 truncate max-w-[100px] sm:max-w-none">{match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam) : ''}</span>
          <ImageResolver 
            src={match.awayLogo || undefined} 
            fallbackType="team" 
            fallbackText={match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).name : match.awayTeam) : ''} 
            tla={match.awayTeam ? (typeof match.awayTeam === 'object' ? (match.awayTeam as any).tla : undefined) : undefined}
            className="w-8 h-8 object-contain rounded-xl bg-white/5 p-0.5 border border-white/10" 
          />
        </div>
      </div>

      {/* Main Stats Rows */}
      <div className="space-y-4 pt-1">
        <AnimatePresence mode="popLayout">
          {filteredMetrics.map((stat, idx) => {
            const total = stat.home + stat.away;
            
            // Calculate relative distribution percentages
            let homePercent = 50;
            let awayPercent = 50;
            if (total > 0) {
              homePercent = (stat.home / total) * 100;
              awayPercent = (stat.away / total) * 100;
            }

            // Highlighting winners based on metric properties
            const isHomeDominant = stat.home > stat.away;
            const isAwayDominant = stat.away > stat.home;
            const isDraw = stat.home === stat.away;

            // Color palette configs: custom gradients and borders for dominance indicators
            const homeBarColor = isHomeDominant ? 'bg-primary' : 'bg-white/10';
            const awayBarColor = isAwayDominant ? 'bg-secondary' : 'bg-white/10';

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.25) }}
                className="group relative bg-[#0e1622]/20 hover:bg-[#0e1622]/40 p-3 rounded-2xl border border-white/[0.02] hover:border-white/5 transition-all duration-300"
              >
                {/* Stats Numbers & centered Name */}
                <div className="flex items-center justify-between text-xs font-black select-none px-1 mb-2">
                  
                  {/* Home Value */}
                  <div className="flex items-center gap-1 font-mono">
                    <span className={`text-sm tabular-nums transition-colors duration-300 ${
                      isHomeDominant ? 'text-primary font-black scale-105' : 'text-gray-400 font-bold'
                    }`}>
                      {stat.home}{stat.suffix || ''}
                    </span>
                    {isHomeDominant && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
                    )}
                  </div>

                  {/* Centered Label */}
                  <span className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-300 transition-colors uppercase tracking-tight font-black">
                    {translationService.translateStatistic(stat.label)}
                  </span>

                  {/* Away Value */}
                  <div className="flex items-center gap-1 font-mono">
                    {isAwayDominant && (
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-pulse" />
                    )}
                    <span className={`text-sm tabular-nums transition-colors duration-300 ${
                      isAwayDominant ? 'text-secondary font-black scale-105' : 'text-gray-400 font-bold'
                    }`}>
                      {stat.away}{stat.suffix || ''}
                    </span>
                  </div>

                </div>

                {/* Double-Sided Splits Progress Bars */}
                {/* Right aligns the Left bar, Left aligns the Right bar. This makes them grow outwards! */}
                <div className="flex items-center gap-2.5 h-2">
                  
                  {/* Home Bar (Aligned right to fill leftwards) */}
                  <div className="w-1/2 bg-white/5 h-1.5 rounded-r-none rounded-l-full overflow-hidden flex justify-end">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${homePercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-r-none rounded-l-full transition-all duration-300 ${homeBarColor}`}
                    />
                  </div>

                  {/* Center Dot Indicator */}
                  <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />

                  {/* Away Bar (Aligned left to fill rightwards) */}
                  <div className="w-1/2 bg-white/5 h-1.5 rounded-l-none rounded-r-full overflow-hidden flex justify-start">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${awayPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-l-none rounded-r-full transition-all duration-300 ${awayBarColor}`}
                    />
                  </div>

                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Interactive Bottom Stat Fun-fact banner */}
      <div className="glass p-4 rounded-2xl border border-primary/10 bg-[#0e2217]/20 flex items-start gap-3 select-none">
        <Award className="text-primary shrink-0 mt-0.5 animate-bounce" size={16} />
        <p className="text-[10px] sm:text-xs text-secondary/90 leading-relaxed font-bold">
          يتم موازنة وحساب دقة الأرقام والإحصائيات وتصديات حراس المرمى بشكل حي وحيوي وفقاً لمجريات المباراة الفعلية والأهداف المسجلة والأحداث الكروية المسجلة في السجل الزمني بانتظام ⚽
        </p>
      </div>

    </div>
  );
}
