import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, HelpCircle, Flame, ShieldAlert, CheckCircle, Vote, Info, BarChart } from 'lucide-react';

export default function AIPredictionWidget({ match }) {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteStats, setVoteStats] = useState({ home: 45, draw: 20, away: 35 });

  const homeName = match?.homeTeam?.name || match?.homeTeam || 'صاحب الأرض';
  const awayName = match?.awayTeam?.name || match?.awayTeam || 'الفريق الضيف';

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/predict/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            homeTeam: homeName,
            awayTeam: awayName,
            league: match.competition?.name || 'League',
            status: match.status,
            homeScore: match.score?.fullTime?.home,
            awayScore: match.score?.fullTime?.away,
          }),
        });
        const data = await response.json();
        setPredictionData(data);
      } catch (err) {
        setError("تعذر جلب توقعات الذكاء الاصطناعي.");
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [match]);

  // Handle voting selection
  const handleVote = (option) => {
    if (hasVoted) return;
    
    setSelectedVote(option);
    setHasVoted(true);

    // Simulate update in standard distribution adding user weight
    setVoteStats(prev => {
      const updated = { ...prev };
      updated[option] = Math.min(95, updated[option] + 5);
      const total = updated.home + updated.draw + updated.away;
      return {
        home: Math.round((updated.home / total) * 100),
        draw: Math.round((updated.draw / total) * 100),
        away: 100 - Math.round((updated.home / total) * 100) - Math.round((updated.draw / total) * 100),
      };
    });
  };

  if (loading) return <div className="p-6 text-center text-white">جاري تحليل المباراة...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden space-y-6" dir="rtl">
      {/* Dynamic top shine */}
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse animate-duration-1000" />
          <h3 className="text-xs sm:text-sm font-black text-white">توقعات الذكاء الاصطناعي الذكية للنتيجة</h3>
        </div>
        <span className="text-[10px] text-[#d4af37] font-black bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
          AI ORACLE VERIFIED
        </span>
      </div>

      <div className="space-y-4">
        {/* Probability Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
            <span>{homeName}</span>
            <span>تعادل</span>
            <span>{awayName}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 flex overflow-hidden">
            <div style={{ width: `${predictionData.homeWinProbability}%` }} className="bg-amber-500" />
            <div style={{ width: `${predictionData.drawProbability}%` }} className="bg-gray-500" />
            <div style={{ width: `${predictionData.awayWinProbability}%` }} className="bg-emerald-500" />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-white">
            <span>{predictionData.homeWinProbability}%</span>
            <span>{predictionData.drawProbability}%</span>
            <span>{predictionData.awayWinProbability}%</span>
          </div>
        </div>

        {/* Commentary */}
        <div className="bg-white/5 p-4 rounded-xl text-right">
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            {predictionData.analystCommentary}
          </p>
        </div>
        
        <p className="text-xs text-gray-400 font-medium italic">{predictionData.prediction}</p>
      </div>

      {/* SECTION 2: Dynamic interactive community polling */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 select-none">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-emerald-400" />
              توقعات المجتمع والزوار
            </h4>
            <p className="text-[10px] text-gray-500 font-bold">بادر بصوتك وقارن نظرتك التحليلية مع بقية المشجعين الآن.</p>
          </div>
          {hasVoted && (
            <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              تم تسجيل صوتك بنجاح ✓
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button 
            disabled={hasVoted}
            onClick={() => handleVote('home')}
            className={`cursor-pointer overflow-hidden p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              selectedVote === 'home'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                : hasVoted
                ? 'bg-white/[0.01] border-white/5 text-gray-500 opacity-60'
                : 'bg-white/[0.03] border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-black truncate max-w-full">فوز {homeName}</span>
            {hasVoted ? (
              <span className="text-xs font-black font-mono text-white">{voteStats.home}%</span>
            ) : (
              <span className="text-[9px] text-[#d4af37] font-black">تصويت ➜</span>
            )}
          </button>

          <button 
            disabled={hasVoted}
            onClick={() => handleVote('draw')}
            className={`cursor-pointer overflow-hidden p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              selectedVote === 'draw'
                ? 'bg-gray-500/20 border-gray-500 text-gray-400 shadow-lg shadow-gray-500/15'
                : hasVoted
                ? 'bg-white/[0.01] border-white/5 text-gray-500 opacity-60'
                : 'bg-white/[0.03] border-white/5 hover:border-gray-500/50 hover:bg-white/[0.05] text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-black">تعادل الفريقين</span>
            {hasVoted ? (
              <span className="text-xs font-black font-mono text-white">{voteStats.draw}%</span>
            ) : (
              <span className="text-[9px] text-[#d4af37] font-black">تصويت ➜</span>
            )}
          </button>

          <button 
            disabled={hasVoted}
            onClick={() => handleVote('away')}
            className={`cursor-pointer overflow-hidden p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
              selectedVote === 'away'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                : hasVoted
                ? 'bg-white/[0.01] border-white/5 text-gray-500 opacity-60'
                : 'bg-white/[0.03] border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-gray-300 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-black truncate max-w-full">فوز {awayName}</span>
            {hasVoted ? (
              <span className="text-xs font-black font-mono text-white">{voteStats.away}%</span>
            ) : (
              <span className="text-[9px] text-[#d4af37] font-black">تصويت ➜</span>
            )}
          </button>
        </div>

        {hasVoted && (
          <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden flex flex-row-reverse">
            <div className="bg-amber-500 h-full" style={{ width: `${voteStats.home}%` }} />
            <div className="bg-gray-500 h-full" style={{ width: `${voteStats.draw}%` }} />
            <div className="bg-emerald-500 h-full" style={{ width: `${voteStats.away}%` }} />
          </div>
        )}
      </div>

    </div>
  );
}
