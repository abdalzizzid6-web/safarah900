import React, { useState, useMemo } from 'react';
import { useFixtures } from '../hooks/useMatchesV2';
import { useLeagues } from '../hooks/useLeagues';
import { useSettings } from '../context/SettingsContext';
import { Match } from '../types';
import MatchCard from './MatchCard';
import MatchBadge from './ui/MatchBadge';
import { getLocalDateString } from '../utils/dateUtils';

export default function MatchSchedule() {
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const { data: fixtures = [], isLoading } = useFixtures({ date: getLocalDateString() });
  const { data: leagues = [] } = useLeagues();
  const { settings } = useSettings();

  const { myLeaguesMatches, otherMatches } = useMemo(() => {
    const favoriteLeagues = settings.favoriteLeagues || [];
    let result = fixtures;
    if (selectedLeague !== 'ALL') {
      result = result.filter(m => (typeof m.league === 'object' ? m.league?.name : m.league) === selectedLeague);
    }
    
    const myLeaguesMatches = result.filter(m => {
       const leagueId = typeof m.league === 'object' ? String(m.league?.id) : String(m.league);
       return favoriteLeagues.includes(leagueId);
    });
    
    const otherMatches = result.filter(m => {
       const leagueId = typeof m.league === 'object' ? String(m.league?.id) : String(m.league);
       return !favoriteLeagues.includes(leagueId);
    });
    
    return { myLeaguesMatches, otherMatches };
  }, [fixtures, selectedLeague, settings.favoriteLeagues]);

  if (isLoading) return <div className="text-white text-center py-10">جاري تحميل المباريات...</div>;

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-black text-white">جدول مباريات الأسبوع القادم</h2>
      
      {/* League Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedLeague('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-bold ${selectedLeague === 'ALL' ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}
        >
          الكل
        </button>
        {leagues.map((league: any) => (
          <button
            key={league.id}
            onClick={() => setSelectedLeague(league.name)}
            className={`px-4 py-2 rounded-full text-xs font-bold ${selectedLeague === league.name ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}
          >
            {league.name}
          </button>
        ))}
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {myLeaguesMatches.length > 0 && (
            <>
                <h3 className="text-lg font-bold text-primary">مباريات دورياتي</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myLeaguesMatches.map((match: Match) => (
                        <div key={match.id} className="relative">
                            <MatchBadge status={match.status} className="absolute top-4 right-4 z-10" />
                            <MatchCard match={match} />
                        </div>
                    ))}
                </div>
            </>
        )}
        <h3 className="text-lg font-bold text-white">كل المباريات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherMatches.map((match: Match) => (
            <div key={match.id} className="relative">
              <MatchBadge status={match.status} className="absolute top-4 right-4 z-10" />
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
