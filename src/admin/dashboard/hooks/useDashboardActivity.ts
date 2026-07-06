import { useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboardActivity() {
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const logs = await dashboardService.fetchRecentActivityLogs();
      setRecentActions(logs);
    } catch (e: any) {
      console.warn("Logs fetch failed", e);
    }

    try {
      const trends = await dashboardService.fetchTrafficTrends();
      setChartData(trends);
    } catch (e) {
      setChartData([]);
    }

    try {
      const audits = await dashboardService.fetchSecurityAudits();
      setSecurityEvents(audits);
    } catch (e) {
      console.warn("Failed to fetch security audits", e);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  return {
    recentActions,
    securityEvents,
    chartData,
    loadingActivity,
    fetchActivity
  };
}
