import React from 'react';
import { motion } from 'motion/react';
import { ListOrdered, ChevronLeft } from 'lucide-react';
import { useStandings } from '../../hooks/useFootballApi';
import { Link } from 'react-router-dom';
import { PremiumTable, PremiumTableRow, PremiumTableCell } from './shared/PremiumTable';

interface Props {
  leagueId?: number;
  leagueName?: string;
  title?: string;
}

export default function PremiumStandingsPreview({ leagueId = 39, leagueName = "الدوري الإنجليزي", title = "جدول الترتيب" }: Props) {
  // Use passed league ID
  const { data, isLoading } = useStandings(leagueId, 2024);
  const standings = (data && Array.isArray(data.standings)) ? data.standings.slice(0, 5) : [];

  return (
    <section className="space-y-4">
      {title && title.trim() !== "" && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <Link to={`/league/${leagueId}`} className="text-xs text-amber-500 font-bold hover:text-amber-400 transition-colors">
            عرض الكل
          </Link>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <PremiumTable headers={['#', 'الفريق', 'لعب', 'ن']}>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <PremiumTableRow key={i} className="animate-pulse">
                <PremiumTableCell colSpan={4}>
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                </PremiumTableCell>
              </PremiumTableRow>
            ))
          ) : (
            standings.map((team: any) => (
              <PremiumTableRow key={team.team.id}>
                <PremiumTableCell className="text-center font-bold text-gray-400">
                  {team.rank}
                </PremiumTableCell>
                <PremiumTableCell>
                  <Link to={`/team/${team.team.id}`} className="flex items-center gap-3">
                    <img src={team.team.logo} alt={team.team.name} className="w-6 h-6 object-contain" />
                    <span className="font-medium text-sm">{team.team.name}</span>
                  </Link>
                </PremiumTableCell>
                <PremiumTableCell className="text-center text-gray-400">
                  {team.played}
                </PremiumTableCell>
                <PremiumTableCell className="text-center font-bold text-blue-400">
                  {team.points}
                </PremiumTableCell>
              </PremiumTableRow>
            ))
          )}
        </PremiumTable>
      </motion.div>
    </section>
  );
}
