import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { matchService } from '../services/matchService';
import { Match, MatchEvent, MatchStat, TeamLineup } from '../types';

/**
 * SPRINT 2 - Unified Matches & Match-Details React Query Hooks
 * 
 * Flow Chain: React Query -> matchService Wrapper -> MatchesRepositoryV2 / Legacy Match Service
 * Handles complete request optimization, deduplication, abort controller signaling, retries,
 * background polling, and cache policies.
 */

// Global constant keys for query caching stability
export const MATCHES_QUERY_KEYS = {
  all: ['matches'] as const,
  lists: () => [...MATCHES_QUERY_KEYS.all, 'list'] as const,
  list: (filters: any) => [...MATCHES_QUERY_KEYS.lists(), filters] as const,
  live: () => [...MATCHES_QUERY_KEYS.all, 'live'] as const,
  fixtures: (filters: any) => [...MATCHES_QUERY_KEYS.all, 'fixtures', filters] as const,
  results: () => [...MATCHES_QUERY_KEYS.all, 'results'] as const,
  standings: (leagueId?: string) => ['standings', leagueId || 'all'] as const,
  league: (leagueId: string) => [...MATCHES_QUERY_KEYS.all, 'league', leagueId] as const,
  team: (teamId: string) => [...MATCHES_QUERY_KEYS.all, 'team', teamId] as const,
  h2h: (homeId: string, awayId: string) => [...MATCHES_QUERY_KEYS.all, 'h2h', homeId, awayId] as const,
  detail: (id: string) => [...MATCHES_QUERY_KEYS.all, 'detail', id] as const,
  events: (matchId: string) => ['events', matchId] as const,
  statistics: (matchId: string) => ['statistics', matchId] as const,
  lineups: (matchId: string) => ['lineups', matchId] as const,
};

// 1. useMatches
export function useMatches(filters: { date?: string } = {}) {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.list(filters),
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getRealFirestoreMatches(filters);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes standard stale
    gcTime: 30 * 60 * 1000,  // 30 minutes cache duration
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// 2. useLiveMatches
export function useLiveMatches() {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.live(),
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      const data = await matchService.getLiveMatches();
      console.log(`[useLiveMatches Hook] Received ${data?.length || 0} matches from service`);
      return data;
    },
    staleTime: 30 * 1000,       // 30 seconds stale
    gcTime: 10 * 60 * 1000,     // 10 minutes cache duration
    refetchInterval: 30 * 1000, // Background poll every 30s
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

// 3. useMatch (Match Details)
export function useMatch(id: string) {
  return useQuery<Match | null, Error>({
    queryKey: MATCHES_QUERY_KEYS.detail(id),
    queryFn: async ({ signal }) => {
      if (!id) return null;
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getMatchDetails(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,   // 2 minutes stale
    gcTime: 30 * 60 * 1000,     // 30 minutes cache duration
    refetchInterval: (query) => {
      // Dynamic poll: if match is active/live, refetch in background every 30s
      const match = query.state.data;
      if (match?.isLive || match?.status === 'LIVE' || match?.status?.short === 'LIVE') {
        return 30 * 1000;
      }
      return false;
    },
    retry: 2,
  });
}

// 4. useFixtures
export function useFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}) {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.fixtures(filters),
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getFixtures(filters);
    },
    staleTime: 5 * 60 * 1000,  // 5 minutes stale
    gcTime: 30 * 60 * 1000,   // 30 minutes cache duration
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// 5. useResults
export function useResults() {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.results(),
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getResults();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes stale
    gcTime: 60 * 60 * 1000,    // 1 hour cache duration
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// 6. useStandings
export function useStandings(leagueId?: string) {
  return useQuery<any[], Error>({
    queryKey: MATCHES_QUERY_KEYS.standings(leagueId),
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getStandings(leagueId);
    },
    staleTime: 60 * 60 * 1000, // 1 hour stale
    gcTime: 6 * 60 * 60 * 1000, // 6 hours cache duration
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// 7. useLeagueMatches
export function useLeagueMatches(leagueId: string) {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.league(leagueId),
    queryFn: async ({ signal }) => {
      if (!leagueId) return [];
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getLeagueMatches(leagueId);
    },
    enabled: !!leagueId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale
    gcTime: 30 * 60 * 1000,  // 30 minutes cache duration
    retry: 2,
  });
}

// 8. useTeamMatches
export function useTeamMatches(teamId: string) {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.team(teamId),
    queryFn: async ({ signal }) => {
      if (!teamId) return [];
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getTeamMatches(teamId);
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale
    gcTime: 30 * 60 * 1000,  // 30 minutes cache duration
    retry: 2,
  });
}

// 9. useHeadToHead
export function useHeadToHead(homeId: string, awayId: string) {
  return useQuery<Match[], Error>({
    queryKey: MATCHES_QUERY_KEYS.h2h(homeId, awayId),
    queryFn: async ({ signal }) => {
      if (!homeId || !awayId) return [];
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getHeadToHead(homeId, awayId);
    },
    enabled: !!homeId && !!awayId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale
    gcTime: 30 * 60 * 1000,  // 30 minutes cache duration
    retry: 2,
  });
}

// 10. useMatchEvents
export function useMatchEvents(matchId: string) {
  return useQuery<MatchEvent[], Error>({
    queryKey: MATCHES_QUERY_KEYS.events(matchId),
    queryFn: async ({ signal }) => {
      if (!matchId) return [];
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getEvents(matchId);
    },
    enabled: !!matchId,
    staleTime: 15 * 1000,      // 15 seconds stale
    gcTime: 10 * 60 * 1000,    // 10 minutes cache duration
    retry: 2,
  });
}

// 11. useMatchStatistics
export function useMatchStatistics(matchId: string) {
  return useQuery<MatchStat[], Error>({
    queryKey: MATCHES_QUERY_KEYS.statistics(matchId),
    queryFn: async ({ signal }) => {
      if (!matchId) return [];
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getStatistics(matchId);
    },
    enabled: !!matchId,
    staleTime: 60 * 1000,       // 60 seconds stale
    gcTime: 15 * 60 * 1000,     // 15 minutes cache duration
    retry: 2,
  });
}

// 12. useMatchLineups
export function useMatchLineups(matchId: string) {
  return useQuery<TeamLineup[], Error>({
    queryKey: MATCHES_QUERY_KEYS.lineups(matchId),
    queryFn: async ({ signal }) => {
      if (!matchId) return [];
      if (signal?.aborted) throw new Error('Query cancelled');
      return await matchService.getLineups(matchId);
    },
    enabled: !!matchId,
    staleTime: 30 * 60 * 1000,  // 30 minutes stale
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache duration
    retry: 2,
  });
}

/**
 * Request Optimization Helper - Prefetch Support
 */
export async function prefetchMatchDetails(queryClient: QueryClient, matchId: string) {
  if (!matchId) return;

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: MATCHES_QUERY_KEYS.detail(matchId),
        queryFn: () => matchService.getMatchDetails(matchId),
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: MATCHES_QUERY_KEYS.events(matchId),
        queryFn: () => matchService.getEvents(matchId),
        staleTime: 15 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: MATCHES_QUERY_KEYS.statistics(matchId),
        queryFn: () => matchService.getStatistics(matchId),
        staleTime: 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: MATCHES_QUERY_KEYS.lineups(matchId),
        queryFn: () => matchService.getLineups(matchId),
        staleTime: 30 * 60 * 1000,
      }),
    ]);
  } catch (error) {
    console.warn(`[useMatchesV2] Prefetch failed for match ${matchId}`, error);
  }
}

/**
 * Request Invalidation Helper - Automatic Invalidation
 */
export function invalidateMatchQueries(queryClient: QueryClient, matchId: string) {
  if (!matchId) return;
  
  queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEYS.detail(matchId) });
  queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEYS.events(matchId) });
  queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEYS.statistics(matchId) });
  queryClient.invalidateQueries({ queryKey: MATCHES_QUERY_KEYS.lineups(matchId) });
}
