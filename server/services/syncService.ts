
import { firestore, isFirebaseAdminReady } from "../firestore/collections";
import { getAi, generateContentWithRetry } from "./aiService";

let isSyncingAI = false;
let deletedMatchesCache: Set<string> | null = null;
let lastCacheFetch = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function syncSportsDataWithAI(target: 'MATCHES' = 'MATCHES') {
  if (!isFirebaseAdminReady || !process.env.GEMINI_API_KEY) return;
  if (isSyncingAI) return;
  isSyncingAI = true;
  try {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const matchPrompt = `Today is ${todayStr}. Search for major football matches...`;
    
    // Pattern using robust retry helper
    const matchResult = await generateContentWithRetry({
      model: "gemini-1.5-flash", // Updated to valid model
      contents: matchPrompt,
    });
    // ... logic for parsing and batch writing to Firestore (matches)
  } catch (e: any) {
    console.error("AI Sync Error:", e);
  } finally {
    isSyncingAI = false;
  }
}

export async function syncFromSource(source: any) {
  if (!source.enabled) return;
  try {
    const now = Date.now();
    if (!deletedMatchesCache || now - lastCacheFetch > CACHE_TTL) {
      const deletedSnapshot = await firestore.collection('deleted_matches').get();
      deletedMatchesCache = new Set(deletedSnapshot.docs.map(doc => doc.id));
      lastCacheFetch = now;
    }
    const deletedMatchIds = deletedMatchesCache;

    // Provider specific logic (FOOTBALL_API, THESPORTSDB, FOOTBALL_DATA, GEMINI)
    // ... logic from server.ts 4501-4770
  } catch (error: any) {
    console.error(`[Source Engine] Sync failed for ${source.name}:`, error.message);
  }
}
