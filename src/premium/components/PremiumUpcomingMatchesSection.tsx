import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, MapPin, Tv } from 'lucide-react';
import { useFixtures } from '../../hooks/useMatchesV2';
import { Match } from '../../types';
import { Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import MatchCountdown from '../../components/MatchCountdown';
import { normalizeMatchDate } from '../../core/utils/matchNormalization';

interface Props {
  title?: string;
}

export default function PremiumUpcomingMatchesSection({ title = 'المباريات القادمة' }: Props) {
  const [selectedOffset, setSelectedOffset] = useState<number>(1); // Default: Tomorrow (+1)

  const dateList = Array.from({ length: 6 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return {
      offset: i + 1,
      dateObj: d,
      formattedDate: format(d, 'yyyy-MM-dd'),
      dayName: i === 0 ? 'الغد' : format(d, 'EEEE', { locale: ar }),
      shortDate: format(d, 'd MMM', { locale: ar }),
    };
  });

  const selectedDateStr = dateList.find(d => d.offset === selectedOffset)?.formattedDate || dateList[0].formattedDate;

  const { data: fixturesData, isLoading, isError, refetch } = useFixtures({ date: selectedDateStr });
  const rawMatches: Match[] = Array.isArray(fixturesData) ? fixturesData : [];

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
      </div>

      {/* Date Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {dateList.map((item) => {
          const isSelected = item.offset === selectedOffset;
          return (
            <button
              key={item.offset}
              onClick={() => setSelectedOffset(item.offset)}
              className={`flex flex-col items-center justify-center min-w-[5rem] py-2 px-3 rounded-xl border transition-all text-xs font-bold ${
                isSelected
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-[#0a0f18] text-white/70 border-white/5 hover:border-white/10 hover:text-white'
              }`}
            >
              <span>{item.dayName}</span>
              <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-black/80 font-black' : 'text-white/40'}`}>
                {item.shortDate}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[#0a0f18] rounded-2xl border border-white/5" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 bg-[#0a0f18] rounded-2xl border border-red-500/20 text-center space-y-2">
          <p className="text-xs text-red-400 font-bold">حدث خطأ أثناء تحميل جدول المباريات القادمة</p>
          <button onClick={() => refetch()} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg font-bold">
            إعادة المحاولة
          </button>
        </div>
      ) : rawMatches.length === 0 ? (
        <div className="p-6 bg-[#0a0f18] rounded-2xl border border-white/5 text-center">
          <p className="text-xs text-gray-400 font-medium">لا توجد مباريات مجدولة لليوم المحدد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rawMatches.slice(0, 6).map((match, idx) => {
            const homeName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
            const homeLogo = typeof match.homeTeam === 'object' ? match.homeTeam.logo : '';
            const awayName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
            const awayLogo = typeof match.awayTeam === 'object' ? match.awayTeam.logo : '';
            const leagueName = typeof match.league === 'object' ? match.league.name : match.league;
            const matchDate = normalizeMatchDate(match.startTime || match.utcDate);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link
                  to={`/match/${match.id}`}
                  className="block p-4 bg-[#0a0f18] rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all shadow-md group"
                >
                  <div className="flex items-center justify-between text-[10px] text-white/40 pb-2 mb-2 border-b border-white/5 font-bold">
                    <span>{leagueName}</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Tv size={11} /> {match.channel || 'beIN Sports'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-5/12">
                      {homeLogo ? <img src={homeLogo} alt={homeName} className="w-7 h-7 object-contain" loading="lazy" /> : <div className="w-7 h-7 rounded-full bg-white/10" />}
                      <span className="font-bold text-xs text-white truncate">{homeName}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center w-2/12">
                      <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                        {matchDate ? format(matchDate, 'hh:mm a', { locale: ar }) : '22:00'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 w-5/12">
                      <span className="font-bold text-xs text-white truncate text-right">{awayName}</span>
                      {awayLogo ? <img src={awayLogo} alt={awayName} className="w-7 h-7 object-contain" loading="lazy" /> : <div className="w-7 h-7 rounded-full bg-white/10" />}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
