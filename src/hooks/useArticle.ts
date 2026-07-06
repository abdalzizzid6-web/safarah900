import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services/newsService';
import { featureFlags } from '../core/config/featureFlags';
import { NewsArticle } from './useNews';

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => newsService.getArticleBySlug(slug),
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    enabled: !!slug
  });
}
