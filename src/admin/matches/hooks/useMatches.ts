import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { matchAdminService } from '../services/matchAdminService';
import { Match } from '@/types';

export function useMatches(options?: { subscribe?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-matches'],
    queryFn: matchAdminService.getMatches,
    staleTime: 60000, // 1 minute
  });

  useEffect(() => {
    if (!options?.subscribe) return;

    const unsubscribe = matchAdminService.subscribeToMatches((matches) => {
      queryClient.setQueryData(['admin-matches'], matches);
    });

    return () => unsubscribe();
  }, [options?.subscribe, queryClient]);

  return {
    matches: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
}
