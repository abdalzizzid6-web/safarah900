export interface ISyncSettings {
  id: string;
  providerId: string;
  leagueId: string;
  enabled: boolean;
  frequency: '5m' | '15m' | '1h' | '6h' | 'daily' | 'weekly';
  lastSync: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  retryCount?: number;
  maxRetries?: number;
}

export interface ISyncJob {
  id: string;
  providerId: string;
  targetId: string;
  type: 'all' | 'provider' | 'league' | 'team' | 'match' | 'news' | 'channels';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retry';
  startedAt: number;
  completedAt?: number;
  error?: string;
  retryCount?: number;
}

export interface ISyncLog {
  id: string;
  jobId: string;
  timestamp: number;
  providerId: string;
  type: string;
  targetId: string;
  message: string;
  details?: any;
  duration?: number;
  itemsCount?: {
    matches?: number;
    leagues?: number;
    teams?: number;
    errors?: number;
  };
}
