import { firestore, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from "../firestore/collections";
import crypto from "crypto";

export const knownGuids = new Set<string>();
export const knownUrls = new Set<string>();
export const knownTitles = new Set<string>();
export const recentArticlesCache: Array<{ id: string; title: string }> = [];
export let isRssCacheInitialized = false;

export let cachedTeams: { id: string; name: string; arabicName: string }[] | null = null;
export let cachedPlayers: { id: string; name: string; arabicName: string }[] | null = null;
export let cachedLeagues: { id: string; name: string; arabicName: string }[] | null = null;
export let cachedLiveMatches: any[] | null = null;
export let lastLiveMatchesFetch = 0;
export let cacheTimestamp = 0;
export let leaguesCacheTimestamp = 0;

export const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (Increased from 5 minutes)
export const LIVE_MATCHES_TTL = 10 * 60 * 1000; // 10 minutes

export async function ensureRssCache() {
  if (isRssCacheInitialized || isFirestoreQuotaExceeded) return;
  try {
    if (!firestore) return;
    console.log("[RSS Service Cache] Warming up in-memory GUIDs, URLs, and titles from last 500 imports...");
    const snapshot = await firestore.collection("rss_imports")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();
    
    knownGuids.clear();
    knownUrls.clear();
    knownTitles.clear();
    recentArticlesCache.length = 0;

    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.guid) {
        knownGuids.add(data.guid);
        const guidHash = crypto.createHash("md5").update(data.guid).digest("hex");
        knownGuids.add(guidHash);
      }
      if (data.originalUrl) {
        knownUrls.add(data.originalUrl);
        const urlHash = crypto.createHash("md5").update(data.originalUrl).digest("hex");
        knownUrls.add(urlHash);
      }
      if (data.title) {
        const titleLower = data.title.trim().toLowerCase();
        knownTitles.add(titleLower);
        recentArticlesCache.push({ id: d.id, title: data.title });
      }
      knownGuids.add(d.id);
    }
    isRssCacheInitialized = true;
    console.log(`[RSS Service Cache] Warm-up complete. Cached ${knownGuids.size} GUIDs, ${knownUrls.size} URLs, ${knownTitles.size} titles, and ${recentArticlesCache.length} recent articles.`);
  } catch (err: any) {
    if (isFirebaseQuotaError(err)) {
      setFirestoreQuotaExceeded(true);
    } else {
      console.error("[RSS Service Cache] Failed to initialize:", err.message);
    }
  }
}

export async function getCachedTeamsAndPlayers() {
  if (isFirestoreQuotaExceeded) {
    return { teams: cachedTeams || [], players: cachedPlayers || [] };
  }
  const now = Date.now();
  if (!cachedTeams || !cachedPlayers || now - cacheTimestamp > CACHE_TTL) {
    try {
      console.log("[Smart Linking Cache] Fetching teams and players for local memory cache...");
      if (firestore) {
        const teamsSnap = await firestore.collection('teams').limit(150).get();
        (global as any).cachedTeams = teamsSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "", arabicName: d.arabicName || "" };
        });
        cachedTeams = (global as any).cachedTeams;

        const playersSnap = await firestore.collection('players').limit(150).get();
        (global as any).cachedPlayers = playersSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "", arabicName: d.arabicName || "" };
        });
        cachedPlayers = (global as any).cachedPlayers;
        
        cacheTimestamp = now;
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("[Smart Linking Cache] Failed to populate cache:", err);
      }
      cachedTeams = cachedTeams || [];
      cachedPlayers = cachedPlayers || [];
    }
  }
  return { teams: cachedTeams || [], players: cachedPlayers || [] };
}

export async function getCachedLeagues() {
  if (isFirestoreQuotaExceeded) {
    return cachedLeagues || [];
  }
  const now = Date.now();
  if (!cachedLeagues || now - leaguesCacheTimestamp > CACHE_TTL) {
    try {
      if (firestore) {
        console.log("[Smart Linking Cache] Fetching leagues for local memory cache...");
        const leaguesSnap = await firestore.collection('leagues').limit(50).get();
        (global as any).cachedLeagues = leaguesSnap.docs.map(doc => {
          const d = doc.data();
          return { id: doc.id, name: d.name || "", arabicName: d.arabicName || "" };
        });
        cachedLeagues = (global as any).cachedLeagues;
        leaguesCacheTimestamp = now;
      }
    } catch (err: any) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      } else {
        console.error("[Leagues Cache] Failed to populate cache:", err);
      }
      cachedLeagues = cachedLeagues || [];
    }
  }
  return cachedLeagues || [];
}

export function setCachedLiveMatches(matches: any[], timestamp: number) {
  cachedLiveMatches = matches;
  lastLiveMatchesFetch = timestamp;
}
