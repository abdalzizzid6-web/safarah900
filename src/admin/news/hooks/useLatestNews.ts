import { useQuery } from '@tanstack/react-query';
import { newsService } from '../../../services/newsService';
import { featureFlags } from '../../../core/config/featureFlags';

export function useLatestNews(count: number = 10) {
  return useQuery({
    queryKey: ['latestNews', count],
    queryFn: () => newsService.getLatestNews(count),
    staleTime: 3 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: true
  });
}
