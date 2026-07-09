import { apiManagementRepository } from '../index';
import { repositories } from '../../repository';
import { ISyncJob, ISyncLog } from '../models/sync.model';

export class UnifiedSyncEngine {
  private static instance: UnifiedSyncEngine;
  private activeJobs: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): UnifiedSyncEngine {
    if (!UnifiedSyncEngine.instance) {
      UnifiedSyncEngine.instance = new UnifiedSyncEngine();
    }
    return UnifiedSyncEngine.instance;
  }

  /**
   * Main entry point for triggering a sync job
   */
  async triggerSync(jobData: Omit<ISyncJob, 'id' | 'status' | 'startedAt'>): Promise<string> {
    const jobId = await apiManagementRepository.syncRepository.triggerSync(jobData);
    
    // Start background execution
    this.executeJob(jobId, jobData).catch(err => {
      console.error(`[UnifiedSyncEngine] Unhandled job error for ${jobId}:`, err);
    });

    return jobId;
  }

  private async executeJob(jobId: string, jobData: any) {
    if (this.activeJobs.has(jobData.targetId)) {
      await apiManagementRepository.syncRepository.updateJobStatus(jobId, 'failed', 'Concurrency conflict: Job already running for this target');
      return;
    }

    this.activeJobs.add(jobData.targetId);
    let itemsCount = { matches: 0, leagues: 0, teams: 0, errors: 0 };
    const startTime = Date.now();

    try {
      await apiManagementRepository.syncRepository.addSyncLog({
        jobId,
        providerId: jobData.providerId,
        type: jobData.type,
        targetId: jobData.targetId,
        message: `Starting sync job of type ${jobData.type}`,
        timestamp: Date.now()
      });

      // Implement specific sync logic based on type
      switch (jobData.type) {
        case 'league':
          await this.syncLeague(jobData.targetId, jobData.providerId, itemsCount);
          break;
        case 'provider':
          await this.syncProvider(jobData.providerId, itemsCount);
          break;
        case 'all':
          await this.syncAll(itemsCount);
          break;
        default:
          throw new Error(`Sync type ${jobData.type} not implemented yet`);
      }

      await apiManagementRepository.syncRepository.updateJobStatus(jobId, 'completed');
      await apiManagementRepository.syncRepository.addSyncLog({
        jobId,
        providerId: jobData.providerId,
        type: jobData.type,
        targetId: jobData.targetId,
        message: `Completed sync job successfully`,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        itemsCount
      });

    } catch (error: any) {
      itemsCount.errors++;
      await apiManagementRepository.syncRepository.updateJobStatus(jobId, 'failed', error.message);
      await apiManagementRepository.syncRepository.addSyncLog({
        jobId,
        providerId: jobData.providerId,
        type: jobData.type,
        targetId: jobData.targetId,
        message: `Sync job failed: ${error.message}`,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        itemsCount
      });
    } finally {
      this.activeJobs.delete(jobData.targetId);
    }
  }

  private async syncLeague(leagueId: string, providerId: string, counts: any) {
    // 1. Get league config to find primary provider if not specified
    const leagues = await apiManagementRepository.leagueRepository.getLeagues();
    const league = leagues.find(l => l.id === leagueId);
    if (!league) throw new Error(`League ${leagueId} not found`);

    const targetProviderId = providerId || league.primaryProviderId;
    
    // 2. Get API key for provider
    const keys = await apiManagementRepository.apiKeyRepository.getKeys();
    const key = keys.find(k => k.id === targetProviderId && k.active);
    if (!key) throw new Error(`No active API key for provider ${targetProviderId}`);

    // 3. Perform the actual API fetch (Simplified logic for now, should use adapters)
    // Here we would call the specialized provider service or adapter
    console.log(`[UnifiedSyncEngine] Fetching fixtures for league ${leagueId} using ${targetProviderId}`);
    
    // Placeholder for actual fetch and map logic
    // const data = await providerAdapter.getFixtures(leagueId, key.value);
    // counts.matches = data.length;
    // await repositories.matches.bulkSave(data);
  }

  private async syncProvider(providerId: string, counts: any) {
    // Logic to sync everything from one provider
  }

  private async syncAll(counts: any) {
    // Logic to sync all enabled leagues/providers
  }
}

export const unifiedSyncEngine = UnifiedSyncEngine.getInstance();
