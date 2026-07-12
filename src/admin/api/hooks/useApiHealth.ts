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

    const { 
      health, 
      averageLatency, 
      rateLimitsCount, 
      authErrorsCount,
      requestsPerSecond,
      cacheHitRate,
      cacheMissRate,
      retryCount,
      timeoutCount,
      quotaUsage,
      providerAvailability
    } = stats.analytics;

    return {
      healthyCount: health.healthyCount || 0,
      degradedCount: health.degradedCount || 0,
      suspendedCount: health.suspendedCount || 0,
      averageLatency: averageLatency || 120,
      rateLimitsCount: rateLimitsCount || 0,
      authErrorsCount: authErrorsCount || 0,
      failoverStatus: 'active',
      requestsPerSecond: requestsPerSecond || 0.1,
      cacheHitRate: cacheHitRate !== undefined ? cacheHitRate : 100,
      cacheMissRate: cacheMissRate !== undefined ? cacheMissRate : 0,
      retryCount: retryCount || 0,
      timeoutCount: timeoutCount || 0,
      quotaUsage: quotaUsage || 0,
      providerAvailability: providerAvailability !== undefined ? providerAvailability : 100
    };
  }, [stats]);
}
