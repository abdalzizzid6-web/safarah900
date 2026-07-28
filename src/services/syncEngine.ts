import { Match } from '../types';
import { repositories } from '../core/repository';

export const syncMatch = async (
  rawMatchData: any,
  provider: string,
  source: string,
  competitionType: string,
  normalizeFn: (data: any) => Partial<Match>
) => {
  try {
    const normalizedData = normalizeFn(rawMatchData);
    const matchId = normalizedData.id || `apf-${provider}-${rawMatchData.id}`;
    
    const existingDoc = await repositories.matches.getById(matchId);
    const now = new Date().toISOString();
    
    const matchToSave: any = {
      ...normalizedData,
      id: matchId,
      provider,
      source,
      competitionType,
      syncStatus: 'synced',
      lastSyncAt: now,
      lastProviderUpdate: now,
      updatedAt: now,
    };

    if (normalizedData.startTime) {
      matchToSave.startTime = new Date(normalizedData.startTime).toISOString();
    }
    if (normalizedData.utcDate) {
      matchToSave.utcDate = new Date(normalizedData.utcDate).toISOString();
    }
    
    if (!existingDoc) {
      matchToSave.createdAt = now;
    }
    
    await repositories.matches.setById(matchId, matchToSave);
    
    return { success: true, matchId };
  } catch (error) {
    console.error(`[SyncEngine] Failed to sync match from ${provider}:`, error);
    return { success: false, error };
  }
};
