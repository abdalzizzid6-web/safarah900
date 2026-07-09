import { ISyncSettings, ISyncJob, ISyncLog } from '../models/sync.model';

export interface ISyncRepository {
  getSyncSettings(): Promise<ISyncSettings[]>;
  updateSyncSettings(settings: ISyncSettings): Promise<void>;
  
  getSyncJobs(): Promise<ISyncJob[]>;
  triggerSync(job: Omit<ISyncJob, 'id' | 'status' | 'startedAt'>): Promise<string>;
  updateJobStatus(jobId: string, status: ISyncJob['status'], error?: string): Promise<void>;

  getSyncLogs(limitCount?: number): Promise<ISyncLog[]>;
  addSyncLog(log: Omit<ISyncLog, 'id'>): Promise<void>;
}
