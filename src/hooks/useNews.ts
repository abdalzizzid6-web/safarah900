import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { featureFlags } from '../core/config/featureFlags';
import { newsService } from '../services/newsService';
import { News } from '../types';

export type NewsArticle = News;

export function useNews(options: { 
  category?: string; 
  limitSize?: number;
  tag?: string;
} = {}) {
  // V2 Flow States
  const [v2Cursor, setV2Cursor] = useState<any | null>(null);
  const [v2Articles, setV2Articles] = useState<News[]>([]);
  const [v2HasMore, setV2HasMore] = useState(false);

  // V2 Fetch Logic using React Query and newsService Wrapper
  const { data: pageData, isLoading: v2Loading, error: v2Error, refetch: v2Refetch, isFetching: v2Fetching } = useQuery({
    queryKey: ['newsListV2', options.category, options.tag, options.limitSize, v2Cursor],
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      return await newsService.getArticlesPaginated({
        status: 'PUBLISHED',
        category: options.category,
        tag: options.tag,
        limitSize: options.limitSize || 10,
        lastDoc: v2Cursor,
      });
    },
    enabled: featureFlags.useNewsV2,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000,  // 15 minutes garbage collection
    retry: 2,
  });

  // Reset accumulated V2 articles and cursor when filters change
  useEffect(() => {
    setV2Articles([]);
    setV2Cursor(null);
    setV2HasMore(false);
  }, [options.category, options.tag]);

  // Handle accumulation of paginated articles
  useEffect(() => {
    if (pageData) {
      const pageArticles = pageData.articles as News[];
      if (v2Cursor) {
        setV2Articles(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const filtered = pageArticles.filter(a => !existingIds.has(a.id));
          return [...prev, ...filtered];
        });
      } else {
        setV2Articles(pageArticles);
      }
      setV2HasMore(pageArticles.length === (options.limitSize || 10));
    }
  }, [pageData, v2Cursor, options.limitSize]);

  const loadMore = useCallback(() => {
    if (pageData?.lastVisible && !v2Fetching && v2HasMore) {
      setV2Cursor(pageData.lastVisible);
    }
  }, [pageData, v2Fetching, v2HasMore]);

  const refresh = useCallback(async () => {
    setV2Cursor(null);
    setV2Articles([]);
    await v2Refetch();
  }, [v2Refetch]);

  return {
    articles: v2Articles,
    loading: v2Loading || v2Fetching,
    error: v2Error ? (v2Error as any).message : null,
    hasMore: v2HasMore,
    loadMore,
    refresh
  };
}
