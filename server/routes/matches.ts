
import express from "express";
import { firestore, isFirebaseQuotaError, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded } from "../firestore/collections";
import { getDocWithFallback } from "../firestore/withFallback";
import { authMiddleware } from "../middleware/auth";
import { validateBody, MatchStatsSchema } from "../middleware/admin";
import { proxyCache } from "../firestore/cache";
import { serverCache } from "../utils/cache";
import { generateMatchContent, generateLineupAnalysis } from "../services/aiContentService";
import { normalizeMatch } from "../utils/normalizer";

const router = express.Router();

async function getEnabledLeaguesCached(): Promise<Record<string, any>> {
  const cacheKey = "enabled_leagues_settings";
  const cached = serverCache.get<Record<string, any>>(cacheKey);
  if (cached) return cached;

  // Try static file cache first (written by server/firestore/cache.ts)
  const staticLeagues = serverCache.readStaticFile<any[]>('channels.json');
  if (staticLeagues) {
    const map: Record<string, any> = {};
    staticLeagues.forEach((doc: any) => {
      map[doc.id] = doc;
    });
    serverCache.set(cacheKey, map, 60 * 60 * 1000); // 1 hour cache
    return map;
  }

  // Fallback to Firestore if static file is missing, but check quota
  if (!isFirestoreQuotaExceeded) {
    try {
      const snap = await firestore.collection('cms_leagues').get();
      const map: Record<string, any> = {};
      snap.docs.forEach((doc: any) => {
        const data = doc.data();
        map[doc.id] = data;
      });
      serverCache.set(cacheKey, map, 15 * 60 * 1000); // 15 mins
      return map;
    } catch (err) {
      if (isFirebaseQuotaError(err)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[Matches API] Failed to fetch cms_leagues from Firestore, using empty fallback:", err);
      return {};
    }
  }
  
  return {};
}

async function filterMatchesByEnabledLeagues(normalizedMatches: any[]): Promise<any[]> {
  try {
    const cmsMap = await getEnabledLeaguesCached();
    const CORE_DEFAULT_LEAGUE_IDS = ['307', '39', '140', '2', '135', '78', '61'];
    
    return normalizedMatches.filter(m => {
      const leagueId = String(m.league?.id || m.leagueId || '');
      
      // Look up in CMS
      const setting = cmsMap[leagueId];
      if (setting) {
        return setting.enabled !== false;
      }
      
      // Default to true for core defaults, false for others
      return CORE_DEFAULT_LEAGUE_IDS.includes(leagueId);
    });
  } catch (err) {
    console.error("[FilterMatches] Error during filtering:", err);
    return normalizedMatches; // Fallback to avoid complete empty state on error
  }
}

// Memory cache for AI content and lineups to minimize Firestore reads and mitigate Quota Exceeded errors (Rule 3, 20)
const aiContentCache: Record<string, { data: any; expiry: number }> = {};

const TIME_7_DAYS = 7 * 24 * 60 * 60 * 1000;
const TIME_30_DAYS = 30 * 24 * 60 * 60 * 1000;

// ----- CORE MATCHES ENDPOINTS TO PREVENT FIRESTORE FALLBACK SPAM ----- //

router.get("/", async (req, res) => {
  const { date, status, limit } = req.query;
  const cacheKey = `matches_aggregated_${date || 'all'}_${status || 'all'}_${limit || 'none'}`;
  
  // Try memory cache first to protect Firestore (Rule 3, 4, 11)
  const cachedData = serverCache.get<any[]>(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  let matches = serverCache.readStaticFile<any[]>('matches.json') || [];
  
  // Also try to fetch latest from Firestore if possible, but respect quota
  if (!isFirestoreQuotaExceeded) {
    try {
      // Limit to 20 to strictly respect Rule 4
      const snap = await firestore.collection('matches').orderBy('startTime', 'desc').limit(20).get();
      const firestoreMatches = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      // Merge: prefer Firestore matches if ID exists in both
      const matchesMap = new Map();
      matches.forEach((m: any) => matchesMap.set(String(m.id), m));
      firestoreMatches.forEach((m: any) => matchesMap.set(String(m.id), m));
      matches = Array.from(matchesMap.values());
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[Matches API] Failed to merge Firestore matches, using static only:", e);
    }
  }

  // Sort matches by start time ascending
  matches.sort((a, b) => {
    const aTime = new Date(a.startTime || a.utcDate || 0).getTime();
    const bTime = new Date(b.startTime || b.utcDate || 0).getTime();
    return aTime - bTime;
  });

  // Filter by date if provided
  if (date && typeof date === 'string') {
    matches = matches.filter(m => {
      const rawDate = m.utcDate || m.startTime;
      if (!rawDate) return false;
      
      let dateStr = '';
      if (typeof rawDate === 'string') {
        dateStr = rawDate.split('T')[0];
      } else if (rawDate && typeof rawDate === 'object') {
        if ('toDate' in rawDate) {
          dateStr = rawDate.toDate().toISOString().split('T')[0];
        } else if (rawDate instanceof Date) {
          dateStr = rawDate.toISOString().split('T')[0];
        }
      }
      
      return dateStr === date;
    });
  }

  // Filter by status if provided
  if (status && typeof status === 'string') {
    matches = matches.filter(m => m.status === status);
  }

  // Handle limit slicing
  if (limit) {
    const limNum = Number(limit);
    if (!isNaN(limNum)) {
      matches = matches.slice(0, limNum);
    }
  }

  const normalized = matches.map(normalizeMatch).filter(m => !m.isHidden);
  const filtered = await filterMatchesByEnabledLeagues(normalized);
  
  // Store in cache for 5 minutes (Rule 6)
  serverCache.set(cacheKey, filtered, 5 * 60 * 1000);
  
  return res.json(filtered);
});

router.get("/live", async (req, res) => {
  const { limit } = req.query;
  const cacheKey = `matches_live_aggregated_${limit || 'none'}`;
  
  // Cache check first (Rule 5 - Live data allowed but still cached for 30s)
  const cachedData = serverCache.get<any[]>(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  let matches = serverCache.readStaticFile<any[]>('matches.json') || [];
  let dataSource = "static-file";
  
  // Also try to fetch latest from Firestore if possible, but respect quota
  if (!isFirestoreQuotaExceeded) {
    try {
      // Find matches where status is live/in-play
      const snap = await firestore.collection('matches')
        .where('status', 'in', ['LIVE', 'IN_PLAY', '1H', '2H', 'HT', 'ET', 'P'])
        .limit(20) // Strict Rule 4
        .get();
        
      if (!snap.empty) {
        const firestoreMatches = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        console.log(`[Live API][${requestId}] Found ${firestoreMatches.length} live matches in Firestore.`);
        
        // Merge: prefer Firestore matches
        const matchesMap = new Map();
        matches.forEach((m: any) => matchesMap.set(String(m.id), m));
        firestoreMatches.forEach((m: any) => matchesMap.set(String(m.id), m));
        matches = Array.from(matchesMap.values());
        dataSource = "firestore-merged";
      }
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn(`[Live API][${requestId}] Firestore lookup failed, using static only:`, e);
    }
  }

  let liveMatches = matches.filter(m => {
    const match = normalizeMatch(m);
    return match.status === 'LIVE' || match.status === 'IN_PLAY' || match.isLive === true || 
           ['1H', '2H', 'HT', 'ET', 'P'].includes(match.status);
  });

  liveMatches.sort((a, b) => {
    const aTime = new Date(a.startTime || a.utcDate || 0).getTime();
    const bTime = new Date(b.startTime || b.utcDate || 0).getTime();
    return aTime - bTime;
  });

  if (limit) {
    const limNum = Number(limit);
    if (!isNaN(limNum)) {
      liveMatches = liveMatches.slice(0, limNum);
    }
  }

// ...
  const normalized = liveMatches.map(normalizeMatch).filter(m => !m.isHidden);
  const results = await filterMatchesByEnabledLeagues(normalized);
  
  // Cache for 30s as per Rule 5 (Live data)
  serverCache.set(cacheKey, results, 30 * 1000);
  
  const latency = Date.now() - startTime;

  // Shadow Validation
  import('../compositionRoot').then(({ shadowValidationService }) => {
    shadowValidationService.validateLiveMatches(liveMatches);
  }).catch(e => console.error('[Shadow Validation] Failed to import:', e));

  res.set('X-Data-Source', dataSource);
// ...
  res.set('X-Request-Id', requestId);
  res.set('X-Latency-Ms', latency.toString());
  res.set('X-Match-Count', results.length.toString());

  console.log(`[Live API][${requestId}] Returning ${results.length} matches. Source: ${dataSource}. Latency: ${latency}ms`);

  return res.json(results);
});

router.get("/fixtures", async (req, res) => {
  const { date, limit } = req.query;
  const matches = (serverCache.readStaticFile<any[]>('matches.json') || []).map(normalizeMatch).filter(m => !m.isHidden);
  
  let fixtures = matches.filter(m => 
    m.status === 'NS' || m.status === 'SCHEDULED' || m.status === 'TIMED'
  );

  fixtures.sort((a, b) => {
    const aTime = new Date(a.startTime || a.utcDate || 0).getTime();
    const bTime = new Date(b.startTime || b.utcDate || 0).getTime();
    return aTime - bTime;
  });

  if (date && typeof date === 'string') {
    fixtures = fixtures.filter(m => {
      const matchDateStr = m.utcDate.split('T')[0];
      return matchDateStr === date;
    });
  }

  if (limit) {
    const limNum = Number(limit);
    if (!isNaN(limNum)) {
      fixtures = fixtures.slice(0, limNum);
    }
  }

  const filtered = await filterMatchesByEnabledLeagues(fixtures);
  return res.json(filtered);
});

router.get("/results", async (req, res) => {
  const { date, limit } = req.query;
  const matches = (serverCache.readStaticFile<any[]>('matches.json') || []).map(normalizeMatch).filter(m => !m.isHidden);
  
  let results = matches.filter(m => 
    ['FT', 'AET', 'PEN', 'FINISHED', 'Finished'].includes(m.status)
  );

  // Results are sorted descending (most recent first)
  results.sort((a, b) => {
    const aTime = new Date(a.startTime || a.utcDate || 0).getTime();
    const bTime = new Date(b.startTime || b.utcDate || 0).getTime();
    return bTime - aTime;
  });

  if (date && typeof date === 'string') {
    results = results.filter(m => {
      const matchDateStr = m.utcDate.split('T')[0];
      return matchDateStr === date;
    });
  }

  if (limit) {
    const limNum = Number(limit);
    if (!isNaN(limNum)) {
      results = results.slice(0, limNum);
    }
  }

  const filtered = await filterMatchesByEnabledLeagues(results);
  return res.json(filtered);
});

// Memory Cache to completely protect Firestore Quotas
const lineupsCache: Record<string, { data: any; expiry: number }> = {};
const eventsCache: Record<string, { data: any; expiry: number }> = {};
const statsCache: Record<string, { data: any; expiry: number }> = {};
const standingsCache = { data: null as any, expiry: 0 };

router.get("/standings/all", async (req, res) => {
  if (standingsCache.data && standingsCache.expiry > Date.now()) {
    return res.json(standingsCache.data);
  }

  let standings: any[] = [];
  if (!isFirestoreQuotaExceeded) {
    try {
      const snap = await firestore.collection('standings').get();
      standings = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      standingsCache.data = standings;
      standingsCache.expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[Matches API] Failed to fetch standings from Firestore:", e);
    }
  }
  return res.json(standings);
});

router.get("/:matchId", async (req, res) => {
  // Try static first to avoid Firestore lookups if possible
  const { matchId } = req.params;
  const staticMatches = serverCache.readStaticFile<any[]>('matches.json') || [];
  const match = staticMatches.find(m => String(m.id) === matchId);
  
  if (match) {
    const normalized = normalizeMatch(match);
    if (normalized.isHidden) {
        return res.status(404).json({ error: "Match hidden/invalid" });
    }
    return res.json(normalized);
  }

  if (!isFirestoreQuotaExceeded) {
    try {
      const doc = await firestore.collection('matches').doc(matchId).get();
      if (doc.exists) {
        const normalized = normalizeMatch({ id: doc.id, ...doc.data() });
        if (normalized.isHidden) {
            return res.status(404).json({ error: "Match hidden/invalid" });
        }
        return res.json(normalized);
      }
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn(`[Matches API] Firestore lookup failed for match ${matchId}:`, e);
    }
  }
  
  // If we really need this endpoint to hit firestore, we could use getDocWithFallback, 
  // but to prevent quota issues it's better to return 404 or just an empty response if not in static matches.
  return res.status(404).json({ 
    error: "Match not found",
    isQuotaExceeded: isFirestoreQuotaExceeded 
  });
});

router.get("/:matchId/lineups", async (req, res) => {
  const { matchId } = req.params;
  const cacheKey = `lineups_${matchId}`;
  const cached = lineupsCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  let data: any = [];
  if (!isFirestoreQuotaExceeded) {
    try {
      const doc = await firestore.collection('lineups').doc(matchId).get();
      if (doc.exists) {
        data = doc.data()?.lineups || [];
      }
      lineupsCache[cacheKey] = { data, expiry: Date.now() + 10 * 60 * 1000 }; // 10 mins
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[Matches API] Failed to fetch lineups from Firestore:", e);
    }
  }
  return res.json(data);
});

router.get("/:matchId/events", async (req, res) => {
  const { matchId } = req.params;
  const cacheKey = `events_${matchId}`;
  const cached = eventsCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  let data: any = [];
  if (!isFirestoreQuotaExceeded) {
    try {
      const doc = await firestore.collection('events').doc(matchId).get();
      if (doc.exists) {
        data = doc.data()?.events || [];
      }
      eventsCache[cacheKey] = { data, expiry: Date.now() + 10 * 60 * 1000 }; // 10 mins
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[Matches API] Failed to fetch events from Firestore:", e);
    }
  }
  return res.json(data);
});

router.get("/:matchId/statistics", async (req, res) => {
  const { matchId } = req.params;
  const cacheKey = `statistics_${matchId}`;
  const cached = statsCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  let data: any = [];
  if (!isFirestoreQuotaExceeded) {
    try {
      const doc = await firestore.collection('statistics').doc(matchId).get();
      if (doc.exists) {
        data = doc.data()?.statistics || [];
      }
      statsCache[cacheKey] = { data, expiry: Date.now() + 10 * 60 * 1000 }; // 10 mins
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn("[Matches API] Failed to fetch statistics from Firestore:", e);
    }
  }
  return res.json(data);
});

// --------------------------------------------------------------------- //

function isCacheExpired(contentData: any, matchStartTimeStr?: string): boolean {
  if (!contentData || !contentData.generatedAt) {
    return true;
  }

  let generatedAtMs = 0;
  if (contentData.generatedAt && typeof contentData.generatedAt.toDate === 'function') {
    try {
      generatedAtMs = contentData.generatedAt.toDate().getTime();
    } catch (e) {
      generatedAtMs = new Date(contentData.generatedAt).getTime();
    }
  } else {
    generatedAtMs = new Date(contentData.generatedAt).getTime();
  }

  if (isNaN(generatedAtMs)) {
    return true;
  }

  const ageMs = Date.now() - generatedAtMs;

  const startTimeStr = matchStartTimeStr || contentData.matchStartTime;
  let isFinished = contentData.isMatchFinished || false;

  if (!isFinished && startTimeStr) {
    const startTimeMs = new Date(startTimeStr).getTime();
    if (!isNaN(startTimeMs) && (Date.now() - startTimeMs > 3 * 60 * 60 * 1000)) {
      isFinished = true;
    }
  }

  const expirationThreshold = isFinished ? TIME_30_DAYS : TIME_7_DAYS;
  return ageMs > expirationThreshold;
}

router.get("/:matchId/ai-content", async (req, res) => {
  const { matchId } = req.params;
  const docId = `match_${matchId}_content`;
  const cacheKey = `ai_content_${matchId}`;
  
  // 1. Check in-memory cache first to avoid ANY Firestore reads if we have a fresh copy
  const cached = aiContentCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  try {
    // If Firestore is known to be exhausted, fallback to memory cache even if expired, or return gracefully
    if (isFirestoreQuotaExceeded) {
      if (cached) {
        console.warn(`[Quota Exceeded Fallback] Returning expired memory cache for match ${matchId} due to Firestore Quota limit.`);
        return res.json(cached.data);
      }
      
      // Fallback to static cache
      const staticMatches = serverCache.readStaticFile<any[]>('matches.json');
      if (staticMatches) {
          const match = staticMatches.find(m => m.id === matchId);
          if (match) {
              return res.json(match);
          }
      }

      return res.status(503).json({ 
        error: "الخدمة غير متوفرة حالياً بسبب الضغط العالي على قاعدة البيانات. يرجى المحاولة لاحقاً.",
        isQuotaExceeded: true
      });
    }

    const docRef = firestore.collection('ai_match_predictions').doc(docId);
    const doc = await docRef.get();
    let existingContent: any = null;
    
    if (doc.exists) {
      existingContent = doc.data();
      
      // If currently generating, return status
      if (existingContent.status === 'generating') {
        const createdAtMs = new Date(existingContent.createdAt).getTime();
        if (Date.now() - createdAtMs < 60000) {
          return res.json({ status: "generating", message: "جاري توليد المحتوى بالذكاء الاصطناعي حالياً..." });
        }
        console.warn(`[Lock Timeout] AI generation lock timed out for match ${matchId}. Regenerating.`);
      } else if (!isCacheExpired(existingContent)) {
        // Cache in memory for 1 hour to reduce reads
        aiContentCache[cacheKey] = { data: existingContent, expiry: Date.now() + 60 * 60 * 1000 };
        return res.json(existingContent);
      }
    }

    // Set lock
    try {
      await docRef.set({
        status: "generating",
        createdAt: new Date().toISOString(),
        matchId,
        type: "content"
      });
    } catch (setLockErr: any) {
      if (isFirebaseQuotaError(setLockErr)) {
        setFirestoreQuotaExceeded(true);
        if (existingContent && existingContent.status === 'published') {
          return res.json(existingContent);
        }
      }
      throw setLockErr;
    }

    // Generate new content
    const matchData = await getDocWithFallback('matches', matchId, 'matches.json');
    if (!matchData) {
      try {
        await docRef.delete();
      } catch (delErr) {}
      if (existingContent && existingContent.status === 'published') {
        console.warn(`[Cache Recovery] Match ${matchId} doc not found in matches. Returning expired cache.`);
        return res.json(existingContent);
      }
      return res.status(404).json({ error: "Match not found" });
    }

    try {
      const content = await generateMatchContent({ ...matchData, id: matchId });
      // Cache in memory
      aiContentCache[cacheKey] = { data: content, expiry: Date.now() + 60 * 60 * 1000 };
      return res.json(content);
    } catch (regenError: any) {
      console.error(`[AI Regeneration Failure] Failed to automatically regenerate content for match ${matchId}:`, regenError);
      if (existingContent && existingContent.status === 'published') {
        try {
          await docRef.set(existingContent);
        } catch (setErr) {}
        console.warn(`[Cache Recovery] Returning existing expired AI content for match ${matchId} after generation failure.`);
        return res.json(existingContent);
      } else {
        try {
          await docRef.delete();
        } catch (delErr) {}
      }
      throw regenError;
    }
  } catch (error: any) {
    console.error('Error generating AI content GET:', error);
    if (isFirebaseQuotaError(error)) {
      setFirestoreQuotaExceeded(true);
      if (cached) {
        console.warn(`[Quota Exceeded Fallback Catch] Returning expired memory cache for match ${matchId}`);
        return res.json(cached.data);
      }
      return res.status(503).json({ 
        error: "الخدمة غير متوفرة حالياً بسبب الضغط العالي على قاعدة البيانات. يرجى المحاولة لاحقاً.",
        isQuotaExceeded: true
      });
    }
    res.status(500).json({ error: error?.message || String(error) });
  }
});

router.post("/:matchId/ai-content", async (req, res) => {
  const { matchId } = req.params;
  const { matchData } = req.body;
  const docId = `match_${matchId}_content`;
  const cacheKey = `ai_content_${matchId}`;
  
  // 1. Check in-memory cache first to avoid ANY Firestore reads if we have a fresh copy
  const cached = aiContentCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  try {
    // If Firestore is known to be exhausted, fallback to memory cache even if expired, or return gracefully
    if (isFirestoreQuotaExceeded) {
      if (cached) {
        console.warn(`[Quota Exceeded Fallback POST] Returning expired memory cache for match ${matchId} due to Firestore Quota limit.`);
        return res.json(cached.data);
      }
      return res.status(503).json({ 
        error: "الخدمة غير متوفرة حالياً بسبب الضغط العالي على قاعدة البيانات. يرجى المحاولة لاحقاً.",
        isQuotaExceeded: true
      });
    }

    const docRef = firestore.collection('ai_match_predictions').doc(docId);
    const doc = await docRef.get();
    let existingContent: any = null;
    
    if (doc.exists) {
      existingContent = doc.data();
      
      // If currently generating, return status
      if (existingContent.status === 'generating') {
        const createdAtMs = new Date(existingContent.createdAt).getTime();
        if (Date.now() - createdAtMs < 60000) {
          return res.json({ status: "generating", message: "جاري توليد المحتوى بالذكاء الاصطناعي حالياً..." });
        }
        console.warn(`[Lock Timeout] POST: AI generation lock timed out for match ${matchId}. Regenerating.`);
      } else if (!isCacheExpired(existingContent, matchData?.startTime || matchData?.utcDate)) {
        // Cache in memory
        aiContentCache[cacheKey] = { data: existingContent, expiry: Date.now() + 60 * 60 * 1000 };
        return res.json(existingContent);
      }
    }

    if (!matchData) {
      if (existingContent && existingContent.status === 'published') {
        return res.json(existingContent);
      }
      return res.status(400).json({ error: "Match data required" });
    }

    // Set lock
    try {
      await docRef.set({
        status: "generating",
        createdAt: new Date().toISOString(),
        matchId,
        type: "content"
      });
    } catch (setLockErr: any) {
      if (isFirebaseQuotaError(setLockErr)) {
        setFirestoreQuotaExceeded(true);
        if (existingContent && existingContent.status === 'published') {
          return res.json(existingContent);
        }
      }
      throw setLockErr;
    }

    try {
      const content = await generateMatchContent({ ...matchData, id: matchId });
      // Cache in memory
      aiContentCache[cacheKey] = { data: content, expiry: Date.now() + 60 * 60 * 1000 };
      return res.json(content);
    } catch (regenError: any) {
      console.error(`[AI POST Regeneration Failure] Failed to regenerate content for match ${matchId}:`, regenError);
      if (existingContent && existingContent.status === 'published') {
        try {
          await docRef.set(existingContent);
        } catch (setErr) {}
        console.warn(`[Cache Recovery] Returning existing expired AI content for match ${matchId} after POST generation failure.`);
        return res.json(existingContent);
      } else {
        try {
          await docRef.delete();
        } catch (delErr) {}
      }
      throw regenError;
    }
  } catch (error: any) {
    console.error('Error generating AI content POST:', error);
    if (isFirebaseQuotaError(error)) {
      setFirestoreQuotaExceeded(true);
      if (cached) {
        console.warn(`[Quota Exceeded Fallback Catch POST] Returning expired memory cache for match ${matchId}`);
        return res.json(cached.data);
      }
      return res.status(503).json({ 
        error: "الخدمة غير متوفرة حالياً بسبب الضغط العالي على قاعدة البيانات. يرجى المحاولة لاحقاً.",
        isQuotaExceeded: true
      });
    }
    res.status(500).json({ error: error?.message || String(error) });
  }
});

router.post("/:matchId/analyze-lineup", async (req, res) => {
  const { matchId } = req.params;
  const { matchData, homeRoster, awayRoster } = req.body;
  const docId = `match_${matchId}_lineup`;
  const cacheKey = `lineup_${matchId}`;

  // 1. Check in-memory cache first to avoid ANY Firestore reads if we have a fresh copy
  const cached = aiContentCache[cacheKey];
  if (cached && cached.expiry > Date.now()) {
    return res.json(cached.data);
  }

  try {
    // If Firestore is known to be exhausted, fallback to memory cache even if expired, or return gracefully
    if (isFirestoreQuotaExceeded) {
      if (cached) {
        console.warn(`[Quota Exceeded Fallback Lineup] Returning expired memory cache for lineup ${matchId} due to Firestore Quota limit.`);
        return res.json(cached.data);
      }
      return res.status(503).json({ 
        error: "الخدمة غير متوفرة حالياً بسبب الضغط العالي على قاعدة البيانات. يرجى المحاولة لاحقاً.",
        isQuotaExceeded: true
      });
    }

    const docRef = firestore.collection('ai_match_predictions').doc(docId);
    const snap = await docRef.get();
    let existingContent: any = null;

    if (snap.exists) {
      existingContent = snap.data();
      
      // If currently generating, return status
      if (existingContent.status === 'generating') {
        const createdAtMs = new Date(existingContent.createdAt).getTime();
        if (Date.now() - createdAtMs < 60000) {
          return res.json({ status: "generating", message: "جاري توليد تحليل التشكيلة بالذكاء الاصطناعي حالياً..." });
        }
        console.warn(`[Lock Timeout] Lineup generation lock timed out for match ${matchId}. Regenerating.`);
      } else {
        const generatedAt = existingContent.generatedAt ? new Date(existingContent.generatedAt).getTime() : 0;
        // 12 hours cache
        if (Date.now() - generatedAt < 12 * 60 * 60 * 1000) {
          // Cache in memory
          aiContentCache[cacheKey] = { data: existingContent, expiry: Date.now() + 60 * 60 * 1000 };
          return res.json(existingContent);
        }
      }
    }

    if (!matchData) {
      if (existingContent && existingContent.status === 'published') {
        return res.json(existingContent);
      }
      return res.status(400).json({ error: "Match data is required" });
    }

    // Set lock
    try {
      await docRef.set({
        status: "generating",
        createdAt: new Date().toISOString(),
        matchId,
        type: "lineup"
      });
    } catch (setLockErr: any) {
      if (isFirebaseQuotaError(setLockErr)) {
        setFirestoreQuotaExceeded(true);
        if (existingContent && existingContent.status === 'published') {
          return res.json(existingContent);
        }
      }
      throw setLockErr;
    }

    try {
      const analysis = await generateLineupAnalysis(matchId, matchData, homeRoster, awayRoster);
      // Cache in memory
      aiContentCache[cacheKey] = { data: analysis, expiry: Date.now() + 60 * 60 * 1000 };
      return res.json(analysis);
    } catch (error: any) {
      console.error('Error generating AI lineup analysis:', error);
      if (existingContent && existingContent.status === 'published') {
        try {
          await docRef.set(existingContent);
        } catch (setErr) {}
        return res.json(existingContent);
      } else {
        try {
          await docRef.delete();
        } catch (delErr) {}
      }
      res.status(500).json({ error: error?.message || String(error) });
    }
  } catch (error: any) {
    console.error('Error generating AI lineup analysis outer:', error);
    if (isFirebaseQuotaError(error)) {
      setFirestoreQuotaExceeded(true);
      if (cached) {
        console.warn(`[Quota Exceeded Fallback Catch Lineup] Returning expired memory cache for lineup ${matchId}`);
        return res.json(cached.data);
      }
      return res.status(503).json({ 
        error: "الخدمة غير متوفرة حالياً بسبب الضغط العالي على قاعدة البيانات. يرجى المحاولة لاحقاً.",
        isQuotaExceeded: true
      });
    }
    res.status(500).json({ error: error?.message || String(error) });
  }
});

router.post("/stats", authMiddleware('admin'), validateBody(MatchStatsSchema), async (req, res) => {
  try {
    const { homeTeam, awayTeam, status, league } = req.body;
    const matchId = `${league || 'match'}-${homeTeam}-${awayTeam}`.toLowerCase().replace(/\s+/g, '-');
    
    // Logic for updating stats...
    res.json({ success: true, message: "Stats updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { syncMatchesFromAPI } = await import("../services/syncService");
    const result = await syncMatchesFromAPI();
    res.json(result);
  } catch (error: any) {
    console.error("[Refresh API] Sync failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/proxy/:matchId", async (req, res) => {
    const { matchId } = req.params;
    const cacheKey = `match_${matchId}`;
    if (proxyCache[cacheKey] && proxyCache[cacheKey].expiry > Date.now()) {
        return res.json(proxyCache[cacheKey].data);
    }
    // Fetch from external API...
    res.status(404).json({ error: "Match not found in cache" });
});

export default router;
