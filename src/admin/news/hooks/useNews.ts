import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsArticleStatus } from '../types';
import { newsService } from '../services/newsService';
import { DocumentSnapshot } from 'firebase/firestore';

export function useNews(initialFilters: {
  status?: NewsArticleStatus;
  category?: string;
  tag?: string;
  search?: string;
} = {}) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchArticles = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await newsService.getArticles({
        status: filters.status,
        category: filters.category,
        tag: filters.tag,
        search: filters.search,
        lastDoc: isLoadMore ? (lastVisible || undefined) : undefined,
        limitSize: 15
      });

      if (isLoadMore) {
        setArticles(prev => [...prev, ...response.articles]);
      } else {
        setArticles(response.articles);
      }

      setLastVisible(response.lastVisible);
      setHasMore(response.articles.length === 15);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل المقالات الإخبارية');
    } finally {
      setLoading(false);
    }
  }, [filters, lastVisible]);

  useEffect(() => {
    fetchArticles();
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setLastVisible(null);
  }, []);

  const deleteArticle = useCallback(async (id: string) => {
    try {
      await newsService.deleteArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل في حذف المقال');
      return false;
    }
  }, []);

  const transitionStatus = useCallback(async (id: string, status: NewsArticleStatus, updatedBy: string) => {
    try {
      await newsService.transitionStatus(id, status, updatedBy);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a));
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل في تعديل حالة المقال');
      return false;
    }
  }, []);

  return {
    articles,
    loading,
    error,
    filters,
    hasMore,
    updateFilters,
    loadMore: () => fetchArticles(true),
    refresh: () => fetchArticles(false),
    deleteArticle,
    transitionStatus
  };
}
