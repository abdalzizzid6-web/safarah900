import { useMemo } from 'react';
import { DashboardStats, ApiStatistics } from '../types/api';

export function useApiStatistics(stats: DashboardStats | null) {
  return useMemo(() => {
    if (!stats || !stats.analytics) {
      return {
        totalRequests: 0,
        successRate: 100,
        totalCost: 0,
        hourlyTrends: [],
        averageCostPerThousand: 0.1000,
        providerCosts: []
      };
    }

    const { totalRequests, successRate, totalCost, hourlyTrends } = stats.analytics;
    const providers = stats.providers || [];

    const averageCostPerThousand = totalRequests > 0 
      ? (totalCost / totalRequests) * 1000 
      : 0.1000;

    // Calculate provider cost distribution
    const providerCosts = ['API-Football', 'SportMonks', 'TheSportsDB'].map((pName) => {
      const totalProvCost = providers
        .filter(p => p.provider === pName)
        .reduce((acc, curr) => acc + (curr.usedToday * (curr.costPerCall || 0)), 0);
      
      const maxCost = Math.max(...providers.map(p => p.usedToday * (p.costPerCall || 0))) || 1;
      const percentage = Math.min(Math.round((totalProvCost / maxCost) * 100), 100) || 5;

      return {
        name: pName,
        cost: totalProvCost,
        percentage
      };
    });

    return {
      totalRequests,
      successRate,
      totalCost,
      hourlyTrends,
      averageCostPerThousand,
      providerCosts
    };
  }, [stats]);
}
