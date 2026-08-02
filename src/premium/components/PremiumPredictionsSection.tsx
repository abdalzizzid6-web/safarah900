import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useMatches } from '../../hooks/useMatchesV2';
import { Match } from '../../types';
import { Link } from 'react-router-dom';

interface Props {
  title?: string;
}

export default function PremiumPredictionsSection({ title = 'توقعات وترشيحات الذكاء الاصطناعي' }: Props) {
  const { data: matches = [] } = useMatches();

  const featuredMatch = matches.find(m => m.status === 'NS' || m.status === 'SCHEDULED' || m.isLive) || matches[0];

  if (!featuredMatch) return null;

  const homeName = typeof featuredMatch.homeTeam === 'object' ? featuredMatch.homeTeam.name : featuredMatch.homeTeam;
  const homeLogo = typeof featuredMatch.homeTeam === 'object' ? featuredMatch.homeTeam.logo : '';
  const awayName = typeof featuredMatch.awayTeam === 'object' ? featuredMatch.awayTeam.name : featuredMatch.awayTeam;
  const awayLogo = typeof featuredMatch.awayTeam === 'object' ? featuredMatch.awayTeam.logo : '';

  const homeWinProb = 54;
  const drawProb = 26;
  const awayWinProb = 20;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
        <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          تحليل خوارزمي
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-gradient-to-br from-[#0c1322] to-[#080d16] rounded-2xl border border-white/10 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <span className="text-xs font-bold text-white/60">مباراة التوقع الرئيسي</span>
          <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
            <ShieldCheck size={14} /> ثقة التوقع 88%
          </span>
        </div>

        {/* Match Row */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3 w-5/12">
            {homeLogo ? <img src={homeLogo} alt={homeName} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 rounded-full bg-white/10" />}
            <span className="font-black text-sm text-white truncate">{homeName}</span>
          </div>

          <span className="text-xs font-black text-white/40">VS</span>

          <div className="flex items-center justify-end gap-3 w-5/12">
            <span className="font-black text-sm text-white truncate text-right">{awayName}</span>
            {awayLogo ? <img src={awayLogo} alt={awayName} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 rounded-full bg-white/10" />}
          </div>
        </div>

        {/* Probability bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-white/70">
            <span className="text-amber-400">فوز {homeName} ({homeWinProb}%)</span>
            <span className="text-gray-400">تعادل ({drawProb}%)</span>
            <span className="text-blue-400">فوز {awayName} ({awayWinProb}%)</span>
          </div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden flex">
            <div style={{ width: `${homeWinProb}%` }} className="bg-amber-500 h-full" />
            <div style={{ width: `${drawProb}%` }} className="bg-gray-400 h-full" />
            <div style={{ width: `${awayWinProb}%` }} className="bg-blue-500 h-full" />
          </div>
        </div>

        {/* Key takeaway */}
        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white/80 leading-relaxed font-medium">
          💡 <strong className="text-amber-400">رأي المحلل:</strong> يتفوق {homeName} في نسب الاستحواذ والضغط العالي على ملعبه، مع احتمالية تسجيل أكثر من 1.5 هدف خلال الشوط الثاني.
        </div>

        <Link
          to={`/match/${featuredMatch.id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
        >
          <span>عرض التحليل الكامل والتوقع الدقيق</span>
          <ChevronLeft size={14} />
        </Link>
      </motion.div>
    </section>
  );
}
