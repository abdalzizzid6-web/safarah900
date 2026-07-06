
import fs from "fs";
import path from "path";
import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "./collections";
import { normalizeMatch } from "../utils/normalizer";

export const proxyCache: Record<string, { data: any; expiry: number }> = {};

export async function generateAndWriteCacheFiles() {
  if (isFirestoreQuotaExceeded) {
    return;
  }

  const CACHE_DIR = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(CACHE_DIR)) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (e) {}
  }

  // 1. Matches Cache
  let matchesData: any[] = [];
  if (firestore) {
    try {
      const today = new Date();
      const threeDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Use Timestamp for query to match new sync engine format
      const snapshot = await firestore.collection('matches')
        .where('utcDate', '>=', threeDaysAgo)
        .where('utcDate', '<=', weekLater)
        .limit(500)
        .get();
      
      matchesData = snapshot.docs
        .map((doc: any) => {
          const raw = { id: doc.id, ...doc.data() };
          return normalizeMatch(raw);
        })
        .filter((m: any) => m !== null); // NEVER filter out matches.json records anymore, just remove nulls
    } catch (e: any) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
        return; // Early exit to prevent writing empty data
      }
      if (!e?.message?.includes('Quota') && e?.code !== 8) {
        console.error("[Cache Gen] Failed to fetch matches:", e.message);
      }
    }
  }
  
  try {
    fs.writeFileSync(path.join(CACHE_DIR, 'matches.json'), JSON.stringify(matchesData, null, 2), 'utf8');
  } catch (err: any) {
    console.error("[Cache Gen] Failed to write matches.json:", err.message);
  }

  // 2. Channels Cache
  let channelsData: any[] = [];
  if (firestore) {
    try {
      const snapshot = await firestore.collection('cms_leagues').get();
      channelsData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e: any) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
        return;
      }
    }
  }
  
  try {
    fs.writeFileSync(path.join(CACHE_DIR, 'channels.json'), JSON.stringify(channelsData, null, 2), 'utf8');
  } catch (err: any) {}

  // 3. Servers Cache
  let serversData: any[] = [];
  if (firestore) {
    try {
      const snapshot = await firestore.collection('cms_channels_servers').get();
      serversData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e: any) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
        return;
      }
    }
  }
  
  try {
    fs.writeFileSync(path.join(CACHE_DIR, 'servers.json'), JSON.stringify(serversData, null, 2), 'utf8');
  } catch (err: any) {}

  // 4. Leagues Cache
  let leaguesData: any[] = [];
  if (firestore) {
    try {
      const snapshot = await firestore.collection('leagues').get();
      leaguesData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (e: any) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
        return;
      }
    }
  }
  
  try {
    fs.writeFileSync(path.join(CACHE_DIR, 'leagues.json'), JSON.stringify(leaguesData, null, 2), 'utf8');
  } catch (err: any) {}
}
