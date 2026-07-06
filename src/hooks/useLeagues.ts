import { useQuery } from '@tanstack/react-query';
import { leagueService } from '../services/leagueService';
import { League } from '../types';

export const LEAGUES_QUERY_KEY = ['leagues'];

export function useLeagues() {
  return useQuery<League[]>({
    queryKey: LEAGUES_QUERY_KEY,
    queryFn: () => leagueService.getLeagues(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
