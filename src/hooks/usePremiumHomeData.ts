import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocalDateString } from '../utils/dateUtils';
import { useMatches, useFixtures, useLiveMatches, MATCHES_QUERY_KEYS } from '../hooks/useMatchesV2';
import { worldCupService } from '../services/worldCupService';
import { filterMatchesByCustomLeagues } from '../utils/leagueFilter';
import { Match } from '../types';

export function usePremiumHomeData() {
  const queryClient = useQueryClient();
  const today = getLocalDateString();

  const handleRefresh = async () => {
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['wcMatches'] }),
        queryClient.refetchQueries({ queryKey: MATCHES_QUERY_KEYS.all }),
        queryClient.refetchQueries({ queryKey: ['latestNews'] }),
        queryClient.refetchQueries({ queryKey: ['ads'] }),
        queryClient.refetchQueries({ queryKey: ['stories'] })
      ]);
    } catch (err) {
      console.error("[usePremiumHomeData] Error refetching data:", err);
    }
  };

  const { data: wcMatches = [], isLoading: wcLoading } = useQuery<any[]>({
    queryKey: ['wcMatches'],
    queryFn: () => worldCupService.getWorldCupMatches(2026),
    staleTime: 1000 * 60 * 60
  });

  const { data: qLive = [], isLoading: liveLoading } = useLiveMatches();
  const { data: qFixtures = [], isLoading: fixturesLoading } = useFixtures({ date: today });
  const { data: qAllToday = [], isLoading: allLoading } = useMatches({ date: today });
  
  const liveMatches = useMemo(() => Array.isArray(qLive) ? filterMatchesByCustomLeagues(qLive) : [], [qLive]);
  const todayMatches = useMemo(() => Array.isArray(qFixtures) ? filterMatchesByCustomLeagues(qFixtures) : [], [qFixtures]);
  
  const combinedMatches = useMemo<Match[]>(() => {
    const list: any[] = [...liveMatches, ...todayMatches];
    const uniqueMap = new Map<string, any>();
    list.forEach(m => m?.id && uniqueMap.set(String(m.id), m));
    return (Array.from(uniqueMap.values()) as Match[]).sort((a, b) => {
      const aLive = a.status === 'LIVE' || (a as any).isLive;
      const bLive = b.status === 'LIVE' || (b as any).isLive;
      if (aLive !== bLive) return aLive ? -1 : 1;
      return new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
    });
  }, [liveMatches, todayMatches]);

  const featuredMatches = useMemo<Match[]>(() => {
    const allMatches = Array.isArray(qAllToday) ? qAllToday : [];
    const now = new Date();
    
    return allMatches
      .filter((m: any) => {
        if (!m.isFeatured || m.isHidden || m.featuredEnabled === false) return false;
        if (m.featuredStartDate && now < new Date(m.featuredStartDate)) return false;
        if (m.featuredEndDate && now > new Date(m.featuredEndDate)) return false;
        return true;
      })
      .sort((a: any, b: any) => {
        const aPinned = a.featuredPinned ? 1 : 0;
        const bPinned = b.featuredPinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aPri = a.featuredPriority || 0;
        const bPri = b.featuredPriority || 0;
        if (aPri !== bPri) return bPri - aPri;
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return aTime - bTime;
      });
  }, [qAllToday]);

  const heroMatch = featuredMatches[0] || combinedMatches.find(m => m.status === 'LIVE') || combinedMatches[0] || null;

  return {
    heroMatch,
    liveMatches,
    todayMatches,
    combinedMatches,
    wcMatches,
    isLoading: liveLoading || fixturesLoading || wcLoading || allLoading,
    handleRefresh
  };
}
