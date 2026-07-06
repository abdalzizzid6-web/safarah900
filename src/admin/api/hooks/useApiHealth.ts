import { useMemo } from 'react';
import { DashboardStats, ApiHealth } from '../types/api';

export function useApiHealth(stats: DashboardStats | null): ApiHealth {
  return useMemo(() => {
    if (!stats || !stats.analytics) {
      return {
        healthyCount: 0,
        degradedCount: 0,
        suspendedCount: 0,
        averageLatency: 120,
        rateLimitsCount: 0,
        authErrorsCount: 0,
        failoverStatus: 'active'
      };
    }

    const { health, averageLatency, rateLimitsCount, authErrorsCount } = stats.analytics;

    return {
      healthyCount: health.healthyCount || 0,
      degradedCount: health.degradedCount || 0,
      suspendedCount: health.suspendedCount || 0,
      averageLatency: averageLatency || 120,
      rateLimitsCount: rateLimitsCount || 0,
      authErrorsCount: authErrorsCount || 0,
      failoverStatus: 'active'
    };
  }, [stats]);
}
