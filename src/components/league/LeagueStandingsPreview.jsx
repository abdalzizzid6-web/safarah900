import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { standingsService } from '../../services/standingsService';
import ImageResolver from '../ui/ImageResolver';

export default function LeagueStandingsPreview({ leagueName, initialLimit = 5 }) {
  const [showAll, setShowAll] = useState(false);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        const data = await standingsService.getStandings(leagueName);
        setStandings(data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load standings:", err);
        setError("تعذر تحميل جدول الترتيب");
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [leagueName]);

  const displayedStandings = showAll ? standings : standings.slice(0, initialLimit);

  if (loading) {
    return <div className="p-6 text-center text-gray-500 text-xs">جاري تحميل جدول الترتيب...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-rose-400 text-xs">{error}</div>;
  }

  if (standings.length === 0) {
    return <div className="p-6 text-center text-gray-500 text-xs">لا تتوفر بيانات للجدول حالياً</div>;
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden p-4 md:p-6 space-y-4" style={{ direction: 'rtl' }}>
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-primary animate-pulse" />
          <h2 className="text-sm font-black text-white">ترتيب أندية {leagueName}</h2>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          {new Date().toLocaleDateString('ar-EG')}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto select-none">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="text-gray-400 border-b border-white/5 text-[10px] uppercase tracking-wider h-10 select-none">
              <th className="w-10 text-center">#</th>
              <th className="text-right">الفريق</th>
              <th className="w-12 text-center">لعب</th>
              <th className="w-12 text-center">+/-</th>
              <th className="w-16 text-center text-primary font-black">النقاط</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {displayedStandings.map((team) => (
              <tr 
                key={team.team.id} 
                className="h-12 hover:bg-white/[0.02] transition-colors"
              >
                {/* Seed Rank */}
                <td className="text-center">
                  <span className={`inline-flex w-5 h-5 rounded-md items-center justify-center text-[10px] font-black ${
                    team.position <= 3 ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-400'
                  }`}>
                    {team.position}
                  </span>
                </td>

                <td>
                  <div className="flex items-center gap-2.5">
                    <ImageResolver 
                      src={team.team.crest} 
                      alt={team.team.name}
                      fallbackType="team"
                      fallbackText={team.team.name}
                      className="w-6 h-6 rounded-full bg-white/5 p-0.5 object-contain"
                    />
                    <span className="font-extrabold text-gray-200 hover:text-white transition-colors truncate max-w-[130px] md:max-w-none">
                      {team.team.name}
                    </span>
                  </div>
                </td>

                <td className="text-center font-mono tabular-nums text-gray-400">{team.playedGames}</td>
                
                <td className="text-center font-mono tabular-nums">
                  <span className={`px-1 py-0.5 rounded text-[10px] ${
                    team.goalDifference > 0 ? 'text-primary' : team.goalDifference < 0 ? 'text-rose-400' : 'text-gray-400'
                  }`}>
                    {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                  </span>
                </td>

                <td className="text-center text-sm font-black text-primary font-mono tabular-nums select-all">
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Full Table Button */}
      {standings.length > initialLimit && (
        <div className="pt-2 text-center border-t border-white/5">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2.5 rounded-xl border border-white/5 hover:border-gray-500 bg-white/5 hover:bg-white/10 text-xs font-black text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {showAll ? (
              <>
                <ChevronUp size={14} />
                <span>عرض الترتيب المختصر</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>عرض جدول الترتيب بالكامل</span>
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}

