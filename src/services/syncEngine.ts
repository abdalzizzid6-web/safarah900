import { matchesRepositoryV2 } from '../core/repository/MatchesRepositoryV2';

import { db } from '../firebase';
import { Match } from '../types';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

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
    
    const existingDoc = await matchesRepositoryV2.getDocRaw(matchId);
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
      updatedAt: serverTimestamp(),
    };

    // Ensure temporal fields are stored as actual Timestamps for robust querying
    if (normalizedData.startTime) {
      matchToSave.startTime = Timestamp.fromDate(new Date(normalizedData.startTime));
    }
    if (normalizedData.utcDate) {
      matchToSave.utcDate = Timestamp.fromDate(new Date(normalizedData.utcDate));
    }
    
    if (!existingDoc.exists()) {
        matchToSave.createdAt = serverTimestamp();
    }
    
    const matchRef = doc(db, 'matches', matchId);
    await setDoc(matchRef, matchToSave, { merge: true });
    
    return { success: true, matchId };
  } catch (error) {
    console.error(`[SyncEngine] Failed to sync match from ${provider}:`, error);
    return { success: false, error };
  }
};
