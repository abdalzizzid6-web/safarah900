import { firestore, isFirebaseAdminReady } from "../firestore/collections";
import { generateAndWriteCacheFiles } from "../firestore/cache";
import { matchRepository } from "../compositionRoot";

export async function syncMatchesFromAPI() {
    if (!isFirebaseAdminReady) return { success: false, message: "Firebase not ready" };
    
    console.log("[SyncService] Starting match sync from API...");
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const days = [yesterday, today, tomorrow];
    let totalSynced = 0;
    
    try {
        for (const date of days) {
            const dateStr = date.toISOString().split('T')[0];
            console.log(`[SyncService] Fetching matches for ${dateStr}...`);
            // Use repository instead of creating a new adapter
            const matches = await matchRepository.getMatchesByDate(date);
            console.log(`[SyncService] Fetched ${matches.length} matches for ${dateStr}.`);
            
            if (matches.length > 0) {
                const batch = firestore.batch();
                matches.forEach(m => {
                    const ref = firestore.collection('matches').doc(String(m.id));
                    // Ensure utcDate and startTime are present for the cache generator query
                    const firestoreData = {
                        ...m,
                        startTime: m.kickoffTime,
                        utcDate: m.kickoffTime,
                        updatedAt: new Date(),
                        lastSyncAt: new Date(),
                        syncStatus: 'synced'
                    };
                    batch.set(ref, firestoreData, { merge: true });
                });
                await batch.commit();
                totalSynced += matches.length;
            }
        }
        
        console.log(`[SyncService] Total matches synced: ${totalSynced}. Regenerating cache...`);
        await generateAndWriteCacheFiles();
        return { success: true, count: totalSynced };
    } catch (error: any) {
        console.error("[SyncService] Sync failed:", error);
        return { success: false, error: error.message };
    }
}

// Keep existing exports if they were used, but they were mostly empty/placeholders
export async function syncSportsDataWithAI(target: 'MATCHES' = 'MATCHES') {
    // Placeholder implementation
}

export async function syncFromSource(source: any) {
    // Placeholder implementation
}
