import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";
import { syncRssProvider } from "../services/rssService";

let pollingInterval: NodeJS.Timeout | null = null;
let rssSourcesCache: any[] | null = null;
let lastSourcesFetch = 0;
const SOURCES_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export function startRssJobs() {

  // Check and run RSS syncing immediately, then repeat every 5 minutes
  runActiveRssSyncCycle().catch(err => {
    console.error("[Job Manager] Initial RSS cycle failed:", err);
  });

  pollingInterval = setInterval(async () => {
    try {
      if (isFirestoreQuotaExceeded) {
        return;
      }
      await runActiveRssSyncCycle();
    } catch (err) {
      console.error("[Job Manager] Background RSS cycle failed:", err);
    }
  }, 15 * 60 * 1000); // 15 minutes interval
}

async function runActiveRssSyncCycle() {
  if (!firestore) return;
  if (isFirestoreQuotaExceeded) {
    return;
  }

  try {
    const now = Date.now();
    let sources: any[] = [];
    
    if (rssSourcesCache && now - lastSourcesFetch < SOURCES_CACHE_TTL) {
      sources = rssSourcesCache;
    } else {
      const snapshot = await firestore.collection("rss_sources")
        .where("enabled", "==", true)
        .get();
      sources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      rssSourcesCache = sources;
      lastSourcesFetch = now;
    }

    for (const provider of sources) {
      if (isFirestoreQuotaExceeded) break;
      const intervalMinutes = Number(provider.updateInterval || 30);
      const lastSync = provider.lastSync;

      let isDue = false;

      if (!lastSync) {
        isDue = true;
      } else {
        const lastSyncTime = new Date(lastSync).getTime();
        const differenceMinutes = (now - lastSyncTime) / (60 * 1000);
        if (differenceMinutes >= intervalMinutes) {
          isDue = true;
        }
      }

      if (isDue) {
        const stats = await syncRssProvider(provider.id);
      }
    }
  } catch (err: any) {
    const isQuota = isFirebaseQuotaError(err);
    if (isQuota) {
      setFirestoreQuotaExceeded(true);
      console.warn("[Job Manager] Firestore Quota limit exceeded during runActiveRssSyncCycle. Gracefully bypassing background RSS sync.");
    } else {
      console.error("[Job Manager] Error in runActiveRssSyncCycle:", err.message);
    }
  }
}
