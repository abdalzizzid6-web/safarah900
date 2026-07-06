import { useState, useEffect, useCallback } from 'react';
import { NewsStatisticsData } from '../types';
import { newsAnalyticsService } from '../services/newsAnalyticsService';

export function useNewsStatistics() {
  const [stats, setStats] = useState<NewsStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await newsAnalyticsService.getAggregatedStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل إحصائيات الأخبار');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}
