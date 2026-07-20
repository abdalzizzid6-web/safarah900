
import React, { useEffect, useState } from 'react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  stadium: string;
}

const WorldCupMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      // Check localStorage for cache
      const cached = localStorage.getItem('world_cup_matches');
      if (cached) {
        setMatches(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/world-cup/matches');
        if (!response.ok) throw new Error('Failed to fetch matches');
        const data = await response.json();
        setMatches(data);
        localStorage.setItem('world_cup_matches', JSON.stringify(data));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (loading) return <div className="p-4 text-center">جاري تحميل مباريات كأس العالم...</div>;
  if (error) return <div className="p-4 text-center text-red-500">حدث خطأ: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">مباريات كأس العالم</h2>
      <div className="grid gap-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">{match.homeTeam} vs {match.awayTeam}</p>
              <p className="text-sm text-gray-500">{match.date} - {match.time}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{match.stadium}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorldCupMatches;
