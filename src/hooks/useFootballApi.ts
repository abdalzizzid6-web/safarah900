import { useQuery } from '@tanstack/react-query';
import { matchService } from '../services/matchService';
import { leagueService } from '../services/leagueService';
import { standingsService } from '../services/standingsService';
import { teamService } from '../services/teamService';
import { playerService } from '../services/playerService';
import { searchService } from '../services/api/searchService';
import { Match, League, LeagueStandings } from '../types';

/**
 * 1. live matches currently in play
 * Cache Strategy: 60 seconds staleTime, auto refetch every 60 seconds (as requested)
 */
export function useLiveMatches() {
  return useQuery<Match[], Error>({
    queryKey: ['liveMatchesV2'],
    queryFn: async () => {
      return await matchService.getLiveMatches();
    },
    staleTime: 60000,           // 60 seconds stale (was 5s)
    refetchInterval: 120000,    // Refetch every 2 minutes (was 15s)
    retry: 2,
  });
}

/**
 * 2. fixtures list with optional date/league filter
 * Cache Strategy: 5 minutes stale, auto refetch every 10 minutes
 */
export function useFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}) {
  return useQuery<Match[], Error>({
    queryKey: ['fixturesV2', filters],
    queryFn: async () => {
      return await matchService.getFixtures(filters);
    },
    staleTime: 300000,          // 5 minutes stale (was 10s)
    refetchInterval: 600000,    // Refetch every 10 minutes (was 30s)
    retry: 2,
  });
}

import { useMatch as unifiedUseMatch } from '../features/match-details/hooks/useMatch';

/**
 * 3. match details for a specific match
 * Cache Strategy: live interval if in-play, otherwise normal cache
 */
export function useMatchDetails(id: string | undefined) {
  return unifiedUseMatch(id || '') as any;
}

/**
 * 4. league standings for custom league & season
 * Cache Strategy: 30 minutes stale, auto refetch every 30 minutes (as requested)
 */
export function useStandings(leagueId: string | number | undefined, season?: string | number) {
  return useQuery<LeagueStandings, Error>({
    queryKey: ['standingsV2', leagueId, season],
    queryFn: async () => {
      if (!leagueId) throw new Error('League ID is required');
      return await standingsService.getStandings(leagueId, season);
    },
    enabled: !!leagueId,
    staleTime: 1800000,        // 30 minutes cache
    refetchInterval: 1800000,  // Refetch every 30 minutes
    retry: 2,
  });
}

/**
 * 5. available leagues/competitions
 * Cache Strategy: 30 minutes stale cache
 */
export function useLeagues() {
  return useQuery<League[], Error>({
    queryKey: ['leaguesV2'],
    queryFn: async () => {
      return await leagueService.getLeagues();
    },
    staleTime: 1800000,        // 30 minutes cache
    retry: 2,
  });
}

/**
 * 6. team details foundation
 */
export function useTeamDetails(teamId: string | number | undefined) {
  return useQuery({
    queryKey: ['teamDetailsV2', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      return await teamService.getTeamDetails(teamId);
    },
    enabled: !!teamId,
    staleTime: 600000,         // 10 minutes cache
  });
}

/**
 * 7. player details foundation
 */
export function usePlayerDetails(playerId: string | number | undefined, season?: number) {
  return useQuery({
    queryKey: ['playerDetailsV2', playerId, season],
    queryFn: async () => {
      if (!playerId) return null;
      return await playerService.getPlayerDetails(playerId, season);
    },
    enabled: !!playerId,
    staleTime: 600000,         // 10 minutes cache
  });
}

/**
 * BACKWARD COMPATIBILITY ENDPOINTS (Keeps original code compiling)
 */
export function useGlobalSearch(queryText: string) {
  return useQuery({
    queryKey: ['globalSearch', queryText],
    queryFn: async () => {
      if (!queryText || queryText.trim().length < 2) {
        return { teams: [], players: [], matches: [], leagues: [] };
      }
      return await searchService.searchGlobal(queryText);
    },
    enabled: queryText.trim().length >= 2,
    staleTime: 30000,
  });
}

export function useLeagueDetails(leagueId: number | string, season = 2024) {
  return useQuery({
    queryKey: ['leagueDetails', leagueId, season],
    queryFn: async () => {
      const lid = Number(leagueId) || 307;
      const st = await standingsService.getStandings(lid, season);
      return {
        standings: st.standings,
        topScorers: [],
        topAssists: [],
        season,
        id: lid
      };
    },
    staleTime: 120000,
    enabled: !!leagueId,
  });
}
