import { useState, useEffect, useCallback } from 'react';
import { RssAnalyticsStats } from '../types';
import { rssService } from '../services/rssService';

export function useRssAnalytics() {
  const [stats, setStats] = useState<RssAnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rssService.getAnalytics();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل تحليلات RSS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    stats,
    loading,
    error,
    fetchAnalytics
  };
}
