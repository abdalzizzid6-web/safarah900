import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services/newsService';
import { NewsArticle } from './useNews';

export interface SearchFilters {
  search?: string;
  category?: string;
  tag?: string;
  authorName?: string;
  limitSize?: number;
  lastDoc?: any;
}

export function useSearchNews(initialFilters: SearchFilters = {}) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(initialFilters.search || '');

  // Debouncing search query to optimize Firestore Reads
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search || '');
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [filters.search]);

  // Keep other filters updated instantly, but use debounced search
  const queryFilters = {
    ...filters,
    search: debouncedSearch
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['newsSearch', queryFilters],
    queryFn: async ({ signal }) => {
      if (signal?.aborted) throw new Error('Query cancelled');
      
      return await newsService.getArticlesPaginated({
        search: queryFilters.search,
        category: queryFilters.category,
        tag: queryFilters.tag,
        authorName: queryFilters.authorName,
        limitSize: queryFilters.limitSize || 10,
        lastDoc: queryFilters.lastDoc
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000,  // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const articles = data?.articles || [];
  const lastVisible = data?.lastVisible || null;
  const isEmpty = !isLoading && articles.length === 0;

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    articles,
    lastVisible,
    loading: isLoading || isFetching,
    error: error ? (error as any).message : null,
    isEmpty,
    updateFilters,
    filters,
    refresh: refetch
  };
}
