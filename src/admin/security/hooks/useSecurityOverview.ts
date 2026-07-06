import { useState, useCallback, useEffect } from 'react';
import { securityService } from '../services/securityService';
import { SecurityStats } from '../SecurityOverviewWidget';

export function useSecurityOverview() {
  const [stats, setStats] = useState<SecurityStats>({
    unauthorizedAttempts: 0,
    validationFailures: 0,
    suspiciousRequests: 0,
    apiAbuseAttempts: 0
  });

  const fetchOverviewStats = useCallback(async () => {
    try {
      const data = await securityService.fetchSecurityAudits();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("[Security Fetch Log Failed]", err);
    }
  }, []);

  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  return { stats, fetchOverviewStats };
}
