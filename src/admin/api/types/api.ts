export interface ApiProvider {
  id: string;
  name: string;
  key: string;
  provider: 'API-Football' | 'SportMonks' | 'TheSportsDB' | 'Custom';
  quotaDaily: number;
  quotaMonthly: number;
  usedToday: number;
  usedMonth: number;
  priority: number;
  priorityType?: 'primary' | 'secondary' | 'fallback';
  active: boolean;
  fallbackProvider: string;
  status: 'healthy' | 'degraded' | 'suspended' | 'unauthorized';
  statusMessage?: string;
  latency?: number;
  costPerCall: number;
  updatedAt: string;
  categories?: string[];
  allowedLeagues?: string[];
}

export type ApiConnection = ApiProvider;
export type ApiKey = ApiProvider;

export interface ApiRouting {
  worldCup: string;
  premierLeague: string;
  arabMatches: string;
  news: string;
  players: string;
  teams: string;
  stats: string;
  streaming: string;
}

export interface ApiHealth {
  healthyCount: number;
  degradedCount: number;
  suspendedCount: number;
  averageLatency: number;
  rateLimitsCount: number;
  authErrorsCount: number;
  failoverStatus: 'active' | 'inactive';
}

export interface ApiStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'suspended' | 'unauthorized';
  active: boolean;
  usagePercent: number;
}

export interface ApiStatistics {
  totalRequests: number;
  successRate: number;
  totalCost: number;
  hourlyTrends: Array<{ hour: string; requests: number; success: number; errors: number; cost: number }>;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  provider: string;
  endpoint: string;
  status: number;
  latency: number;
  error?: string;
}

export interface DashboardStats {
  providers: ApiProvider[];
  routing: ApiRouting;
  recentLogs: ApiLog[];
  analytics: {
    totalRequests: number;
    successRate: number;
    rateLimitsCount: number;
    authErrorsCount: number;
    totalCost: number;
    averageLatency: number;
    health: {
      healthyCount: number;
      degradedCount: number;
      suspendedCount: number;
    };
    hourlyTrends: Array<{ hour: string; requests: number; success: number; errors: number; cost: number }>;
  };
}

export type ApiSettings = ApiRouting;
