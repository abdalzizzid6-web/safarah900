import { BaseRepository } from '../../repository/BaseRepository';
import { ISyncSettings, ISyncJob, ISyncLog } from '../models/sync.model';
import { ISyncRepository } from '../contracts/ISyncRepository';
import { CacheLayer } from '../cache/CacheLayer';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../../../firebase';

export class SyncRepository extends BaseRepository<ISyncSettings> implements ISyncRepository {
  constructor() {
    super('sync_settings');
  }

  async getSyncSettings(): Promise<ISyncSettings[]> {
    const cached = CacheLayer.get('sync_settings');
    if (cached) return cached;

    const settings = await this.getAll(500);
    CacheLayer.set('sync_settings', settings, 60); // 1 min TTL
    return settings;
  }

  async updateSyncSettings(settings: ISyncSettings): Promise<void> {
    await this.setById(settings.id, settings);
    CacheLayer.invalidate('sync_settings');
  }

  async getSyncJobs(): Promise<ISyncJob[]> {
    const q = query(collection(db, 'sync_jobs'), orderBy('startedAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ISyncJob));
  }

  async triggerSync(job: Omit<ISyncJob, 'id' | 'status' | 'startedAt'>): Promise<string> {
    // Check if a job is already running for this target
    const runningQuery = query(
      collection(db, 'sync_jobs'), 
      where('targetId', '==', job.targetId),
      where('status', '==', 'running'),
      limit(1)
    );
    const runningSnap = await getDocs(runningQuery);
    if (!runningSnap.empty) {
      throw new Error(`Sync already running for target ${job.targetId}`);
    }

    const docRef = await addDoc(collection(db, 'sync_jobs'), {
      ...job,
      status: 'running',
      startedAt: Date.now(),
      retryCount: 0
    });
    
    return docRef.id;
  }

  async updateJobStatus(jobId: string, status: ISyncJob['status'], error?: string): Promise<void> {
    const data: any = { status };
    if (status === 'completed' || status === 'failed') {
      data.completedAt = Date.now();
    }
    if (error) data.error = error;

    await updateDoc(doc(db, 'sync_jobs', jobId), data);
  }

  async getSyncLogs(limitCount: number = 200): Promise<ISyncLog[]> {
    const q = query(collection(db, 'sync_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ISyncLog));
  }

  async addSyncLog(log: Omit<ISyncLog, 'id'>): Promise<void> {
    await addDoc(collection(db, 'sync_logs'), {
      ...log,
      timestamp: Date.now()
    });
  }
}
