import { useMemo } from 'react';
import { DashboardStats, ApiLog } from '../types/api';

export function useApiLogs(stats: DashboardStats | null) {
  return useMemo(() => {
    if (!stats || !stats.recentLogs) {
      return {
        logs: [] as ApiLog[],
        totalLogs: 0
      };
    }

    return {
      logs: stats.recentLogs,
      totalLogs: stats.recentLogs.length
    };
  }, [stats]);
}
