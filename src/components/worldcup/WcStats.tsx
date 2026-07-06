import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Award, Shield, Flame, Activity, TrendingUp, Zap, AlertCircle, BarChart as BarChartIcon } from 'lucide-react';
import { worldCupService, WCMatch, ScorerEntry } from '../../services/worldCupService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WcStatsProps {
  matches: WCMatch[];
  scorers: ScorerEntry[];
}

export default function WcStats({ matches, scorers }: WcStatsProps) {
  const safeMatches = Array.isArray(matches) ? matches : [];

  // Use real scorers provided via props
  const activeScorers = useMemo(() => {
    return scorers || [];
  }, [scorers]);

  // Advanced Stats Calculation
  const statsSummary = useMemo(() => {
    const played = safeMatches.filter(m => ['FINISHED', 'FT'].includes(m.status)).length;
    let totalGoals = 0;
    const teamGoalsMap: Record<string, { name: string; goals: number; crest: string }> = {};
    const teamConcededMap: Record<string, { name: string; conceded: number; crest: string }> = {};

    safeMatches.forEach(m => {
      const hG = m.score?.fullTime?.home;
      const aG = m.score?.fullTime?.away;

      if (hG !== null && hG !== undefined) {
        totalGoals += hG;
        if (!teamGoalsMap[m.homeTeam.name]) {
          teamGoalsMap[m.homeTeam.name] = { name: m.homeTeam.name, goals: 0, crest: m.homeTeam.crest };
        }
        teamGoalsMap[m.homeTeam.name].goals += hG;

        if (!teamConcededMap[m.awayTeam.name]) {
          teamConcededMap[m.awayTeam.name] = { name: m.awayTeam.name, conceded: 0, crest: m.awayTeam.crest };
        }
        teamConcededMap[m.awayTeam.name].conceded += hG;
      }

      if (aG !== null && aG !== undefined) {
        totalGoals += aG;
        if (!teamGoalsMap[m.awayTeam.name]) {
          teamGoalsMap[m.awayTeam.name] = { name: m.awayTeam.name, goals: 0, crest: m.awayTeam.crest };
        }
        teamGoalsMap[m.awayTeam.name].goals += aG;

        if (!teamConcededMap[m.homeTeam.name]) {
          teamConcededMap[m.homeTeam.name] = { name: m.homeTeam.name, conceded: 0, crest: m.homeTeam.crest };
        }
        teamConcededMap[m.homeTeam.name].conceded += aG;
      }
    });

    // Best Attack
    let bestAttack = { name: '--', goals: 0, crest: '' };
    Object.values(teamGoalsMap).forEach(t => {
      if (t.goals > bestAttack.goals) {
        bestAttack = { name: t.name, goals: t.goals, crest: t.crest };
      }
    });

    let bestDefense = { name: '--', conceded: 99, crest: '' };
    Object.values(teamConcededMap).forEach(t => {
      if (t.conceded < bestDefense.conceded) {
        bestDefense = { name: t.name, conceded: t.conceded, crest: t.crest };
      }
    });

    // Aggregated Stats
    const teamStats = matches.reduce((acc: any, m) => {
        // Cards
        ((m as any).events || []).filter((e: any) => e.type === 'Card' && e.team).forEach((e: any) => {
            const name = e.team!.name;
            if (!acc[name]) acc[name] = { name, cards: 0, possession: 0, count: 0 };
            acc[name].cards++;
        });
        // Possession
        ((m as any).statistics || []).filter((s: any) => s.type === 'Ball Possession').forEach((s: any) => {
            const homePoss = parseInt(String(s.home).replace('%', ''));
            const awayPoss = parseInt(String(s.away).replace('%', ''));
            
            if (!acc[m.homeTeam.name]) acc[m.homeTeam.name] = { name: m.homeTeam.name, cards: 0, possession: 0, count: 0 };
            acc[m.homeTeam.name].possession += homePoss || 0;
            acc[m.homeTeam.name].count++;
            
            if (!acc[m.awayTeam.name]) acc[m.awayTeam.name] = { name: m.awayTeam.name, cards: 0, possession: 0, count: 0 };
            acc[m.awayTeam.name].possession += awayPoss || 0;
            acc[m.awayTeam.name].count++;
        });
        return acc;
    }, {});

    const processedStats = Object.values(teamStats as any).map((s: any) => ({
        name: worldCupService.translateTeam(s.name),
        cards: s.cards,
        avgPossession: s.count > 0 ? Math.round(s.possession / s.count) : 0
    })).filter(s => s.cards > 0 || s.avgPossession > 0);

    return {
      played,
      totalGoals,
      avgGoals: played > 0 ? (totalGoals / played).toFixed(2) : "0.00",
      bestAttack: bestAttack.goals > 0 ? bestAttack : null,
      bestDefense: bestDefense.conceded < 99 ? bestDefense : null,
      processedStats
    };
  }, [matches]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title block */}
      <div className="flex items-center gap-3 border-b border-[#d4af37]/15 pb-4">
        <div className="p-2 bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 rounded-xl">
          <Activity className="w-5 h-5 text-[#f3c623]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">إحصائيات وأرقام كأس العالم</h2>
          <p className="text-xs text-gray-400">لوحة تحليلية تفاعلية صُمِّمت بخصائص تليق بطابع البطولة</p>
        </div>
      </div>

      {/* Overview Bento Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-gradient-to-br from-[#0c0d10] to-[#050510] border border-[#d4af37]/10 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] text-gray-500 font-black block">إجمالي الأهداف</span>
            <strong className="text-2xl font-black text-[#f3c623]">{statsSummary.totalGoals}</strong>
          </div>
          <Flame className="w-8 h-8 text-amber-500" />
        </div>

        <div className="p-5 bg-gradient-to-br from-[#0c0d10] to-[#050510] border border-[#d4af37]/10 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] text-gray-500 font-black block">متوسط الأهداف / المباراة</span>
            <strong className="text-2xl font-black text-white">{statsSummary.avgGoals}</strong>
          </div>
          <TrendingUp className="w-8 h-8 text-[#d4af37]" />
        </div>

        {statsSummary.bestAttack ? (
          <div className="p-5 bg-gradient-to-br from-[#0c0d10] to-[#050510] border border-[#d4af37]/10 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] text-gray-500 font-block block uppercase leading-none">أقوى هجوم بالفريق</span>
              <strong className="text-sm font-black text-white block mt-1 truncate max-w-[120px]">
                {worldCupService.translateTeam(statsSummary.bestAttack.name)}
              </strong>
              <span className="text-xs text-[#f3c623] font-mono">{statsSummary.bestAttack.goals} أهداف</span>
            </div>
            {statsSummary.bestAttack.crest ? (
              <img src={statsSummary.bestAttack.crest} className="w-10 h-10 object-contain rounded bg-white/5 p-1" alt="" referrerPolicy="no-referrer" />
            ) : <Zap className="w-8 h-8 text-[#f3c623]" />}
          </div>
        ) : (
          <div className="p-5 bg-gradient-to-br from-[#0c0d10] to-[#050510] border border-white/5 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">بانتظار ركلة البداية</span>
            <Activity className="w-8 h-8 text-gray-600" />
          </div>
        )}

        {statsSummary.bestDefense ? (
          <div className="p-5 bg-gradient-to-br from-[#0c0d10] to-[#050510] border border-[#d4af37]/10 rounded-2xl flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] text-gray-500 font-block block uppercase leading-none">الأقل استقبالاً للأهداف</span>
              <strong className="text-sm font-black text-white block mt-1 truncate max-w-[120px]">
                {worldCupService.translateTeam(statsSummary.bestDefense.name)}
              </strong>
              <span className="text-xs text-emerald-400 font-mono">{statsSummary.bestDefense.conceded} أهداف</span>
            </div>
            {statsSummary.bestDefense.crest ? (
              <img src={statsSummary.bestDefense.crest} className="w-10 h-10 object-contain rounded bg-white/5 p-1" alt="" referrerPolicy="no-referrer" />
            ) : <Shield className="w-8 h-8 text-[#f3c623]" />}
          </div>
        ) : (
          <div className="p-5 bg-gradient-to-br from-[#0c0d10] to-[#050510] border border-white/5 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-gray-500 font-bold">بانتظار مباريات دورية</span>
            <Shield className="w-8 h-8 text-gray-600" />
          </div>
        )}
      </div>

      {/* Main Stats Layout: Scorers Grid & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Scorer Golden Boot Card */}
        <div className="lg:col-span-2 p-5 bg-[#0a0a0a] border border-[#d4af37]/10 rounded-3xl shadow-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Award className="w-5 h-5 text-[#f3c623]" />
            <span className="text-sm font-black text-white">ترتيب الهدافين والسباق نحو الحذاء الذهبي</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-bold">
                  <th className="pb-3 text-center">المركز</th>
                  <th className="pb-3 text-right pr-2">اللاعب</th>
                  <th className="pb-3 text-right">المنتخب</th>
                  <th className="pb-3 text-center">المباريات</th>
                  <th className="pb-3 text-center">التمريرات</th>
                  <th className="pb-3 text-center text-[#f3c623]">الأهداف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {activeScorers.map((entry, idx) => (
                  <tr key={entry.player.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="py-3 text-center font-black font-mono">
                      {idx + 1 === 1 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d4af37] text-black font-extrabold text-[10px]">👑</span>
                      ) : (
                        <span className="text-gray-400">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 font-extrabold text-white pr-2">
                      <div className="space-y-0.5">
                        <p>{entry.player.name}</p>
                        <p className="text-[9px] text-gray-500 font-bold">{entry.player.position === 'ATT' ? 'مهاجم' : entry.player.position === 'MID' ? 'وسط' : 'مدافع'}</p>
                      </div>
                    </td>
                    <td className="py-3 font-bold">
                      <div className="flex items-center gap-2">
                        <img src={entry.team.crest} className="w-5 h-5 object-contain" alt="" referrerPolicy="no-referrer" />
                        <span className="truncate max-w-[100px]">{worldCupService.translateTeam(entry.team.name)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-gray-400">{entry.playedGames || '--'}</td>
                    <td className="py-3 text-center font-mono font-bold text-gray-400">{entry.assists || '0'}</td>
                    <td className="py-3 text-center font-mono font-black text-lg text-[#f3c623]">{entry.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-white/[0.02] border border-[#d4af37]/15 rounded-xl text-[10px] text-gray-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#f3c623] shrink-0" />
            <p className="leading-normal font-bold">
              تُقَدَّم إحصائيات سباق الحذاء الذهبي باحتساب الأهداف الإجمالية أولاً، ثم التمريرات الحاسمة كأساس للمفاضلة في حالة التساوي، تليها نسبة الأهداف إلى الدقائق الملعوبة في البطولة.
            </p>
          </div>
        </div>

        {/* Attack vs Defense Index */}
        <div className="p-5 bg-[#0a0a0a] border border-[#d4af37]/10 rounded-3xl shadow-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <BarChartIcon className="w-5 h-5 text-[#f3c623]" />
            <span className="text-sm font-black text-white">إحصائيات إضافية</span>
          </div>

          <div className="space-y-6">
            <div className="text-[11px] text-gray-400 font-bold uppercase">الاستحواذ المتوسط للكرة</div>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsSummary.processedStats.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis type="number" stroke="#555" tick={{fontSize: 10}} />
                        <YAxis dataKey="name" type="category" stroke="#555" tick={{fontSize: 10}} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #d4af37', fontSize: '12px' }} />
                        <Bar dataKey="avgPossession" fill="#d4af37" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="text-[11px] text-gray-400 font-bold uppercase">أكثر المنتخبات حصولاً على البطاقات</div>
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsSummary.processedStats.sort((a,b) => b.cards - a.cards).slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis type="number" stroke="#555" tick={{fontSize: 10}} />
                        <YAxis dataKey="name" type="category" stroke="#555" tick={{fontSize: 10}} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #d4af37', fontSize: '12px' }} />
                        <Bar dataKey="cards" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
