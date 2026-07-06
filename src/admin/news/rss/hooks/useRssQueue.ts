import { useState, useEffect, useCallback } from 'react';
import { RssImportedArticle } from '../types';
import { rssService } from '../services/rssService';

export function useRssQueue(initialStatus = 'REVIEW') {
  const [articles, setArticles] = useState<RssImportedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: initialStatus,
    providerId: '',
    search: ''
  });

  const fetchQueue = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await rssService.getQueue(currentFilters);
      setArticles(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل قائمة مراجعة RSS');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      // Fetch queue immediately after filters change
      fetchQueue(updated);
      return updated;
    });
  };

  const updateArticleStatus = async (id: string, status: string, publishSchedule?: string) => {
    try {
      const success = await rssService.updateQueueArticleStatus(id, status, publishSchedule);
      if (success) {
        // Remove from current view list if status changed away from filtered status
        setArticles((prev) => prev.filter((art) => art.id !== id));
      }
      return success;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        setError('جلسة العمل منتهية. الرجاء تسجيل الدخول مرة أخرى.');
      } else {
        setError(err.message || 'فشل تحديث حالة المقال');
      }
      throw err;
    }
  };

  const editArticle = async (id: string, updates: Partial<RssImportedArticle>) => {
    try {
      const updated = await rssService.editQueueArticle(id, updates);
      setArticles((prev) =>
        prev.map((art) => (art.id === id ? { ...art, ...updated } : art))
      );
      return updated;
    } catch (err: any) {
      setError(err.message || 'فشل تعديل بيانات المقال');
      throw err;
    }
  };

  const reclassifyArticle = async (id: string) => {
    try {
      const result = await rssService.reClassifyQueueArticle(id);
      setArticles((prev) =>
        prev.map((art) =>
          art.id === id
            ? {
                ...art,
                classification: result.classification,
                seo: {
                  ...art.seo,
                  metaTitle: result.seo.metaTitle,
                  metaDescription: result.seo.metaDescription,
                  readingTime: result.seo.readingTime,
                  keywords: result.classification.suggestedTags
                }
              }
            : art
        )
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'فشل إعادة تصنيف المقال باستخدام الذكاء الاصطناعي');
      throw err;
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filters.status, filters.providerId]); // fetch on status or provider change, search is debounced manually in UI

  return {
    articles,
    loading,
    error,
    filters,
    updateFilters,
    fetchQueue,
    updateArticleStatus,
    editArticle,
    reclassifyArticle
  };
}
