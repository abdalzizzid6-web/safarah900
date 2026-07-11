import { BaseRepository } from './BaseRepository';
import apiClient from '../api/apiClient';
import { telemetry } from '../monitoring/telemetry';
import errorHandler from '../api/errorHandler';
import retryManager from '../api/retryManager';
import cacheManager from '../api/cacheManager';
import { Match, MatchEvent, MatchStat, TeamLineup } from '../../types';
import { db } from '../../firebase';
import { 
  doc, 
  onSnapshot, 
  query, 
  collection, 
  where, 
  limit, 
  orderBy, 
  getDocs, 
  getDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp, 
  deleteDoc, 
  setDoc,
  updateDoc,
  arrayUnion,
  DocumentData
} from 'firebase/firestore';
import { translateTeamName, translateLeagueName } from '../../utils/arabicTeamNames';
import { worldCupService } from '../../services/worldCupService';
import { normalizeMatch } from '../utils/matchNormalization';
import { networkDiagnostic } from '../../utils/networkDiagnostic';

const mapWCMatchToMatch = (wcMatch: any): Match => {
  return normalizeMatch(wcMatch.id, {
    ...wcMatch,
    source: 'world-cup',
    provider: 'Football-Data/OpenFootball',
    approved: true
  }) as Match;
};

export enum MatchStatus {
  Scheduled = 'Scheduled',
  Confirmed = 'Confirmed',
  Live = 'Live',
  HalfTime = 'Half Time',
  SecondHalf = 'Second Half',
  ExtraTime = 'Extra Time',
  Penalties = 'Penalties',
  Finished = 'Finished',
  Postponed = 'Postponed',
  Cancelled = 'Cancelled',
  Abandoned = 'Abandoned',
  Draft = 'Draft',
  PendingReview = 'Pending Review',
  Approved = 'Approved',
  Published = 'Published',
  Archived = 'Archived'
}

export interface MatchVersion {
  id: string;
  matchId: string;
  editorId: string;
  editorName: string;
  timestamp: any;
  data: any;
  previousData?: any;
  changedFields: string[];
  note?: string;
}

export interface MatchAuditLog {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  action: 'Create' | 'Update' | 'Delete' | 'Publish' | 'Archive' | 'Restore' | 'Approve' | 'Reject' | 'Duplicate' | 'BulkAction' | 'ScoreUpdate' | 'LiveUpdate' | 'StatisticsUpdate' | 'QuickEdit' | 'EventAdded';
  details: string;
  timestamp: any;
}

export interface MatchLock {
  matchId: string;
  userId: string;
  userName: string;
  expiresAt: any;
  editingSince: any;
}

function isLeagueDisabled(leagueId: string | number): boolean {
  if (!leagueId) return false;
  try {
    const raw = localStorage.getItem('Safara 90_cms_cache_leagues');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && Array.isArray(parsed.data)) {
        const found = parsed.data.find((l: any) => String(l.id) === String(leagueId) || String(l.leagueId) === String(leagueId));
        if (found) {
          return found.enabled === false;
        }
      }
    }
  } catch (e) {
    console.error('[MatchesRepositoryV2] Error parsing leagues cache:', e);
  }
  return false;
}

export class MatchesRepositoryV2 extends BaseRepository<Match> {
  constructor() {
    super('matches');
  }

  /**
   * Automatically calculates live or finished status of a match based on the scheduled start time.
   * If a match startTime has arrived and is within 115 minutes, it is automatically returned as LIVE with current minute.
   * If it has been more than 115 minutes since startTime, it is marked as FINISHED.
   */
  public adjustMatchStatus(match: Match): Match {
    if (!match) return match;
    let dateStr = match.startTime || match.utcDate || (match as any).date;
    
    // Handle Firestore Timestamp
    if (dateStr && typeof dateStr === 'object' && 'toDate' in dateStr) {
      dateStr = (dateStr as any).toDate().toISOString();
    }

    if (!dateStr) return match;

    try {
      const matchTime = new Date(dateStr).getTime();
      if (isNaN(matchTime)) {
        console.warn(`[AdjustStatus] Match ${match.id} has invalid startTime: ${dateStr}`);
        return match;
      }

      const now = Date.now();
      const durationMinutes = 115; // 90 mins match + 15 mins HT + 10 mins added/extra prep time
      const durationMs = durationMinutes * 60 * 1000;

      // If current time is after match start but before match end
      if (now >= matchTime && now < matchTime + durationMs) {
        const elapsedMs = now - matchTime;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        
        // Determine match minute and status
        let currentMinute = elapsedMinutes;
        let statusText = 'LIVE';
        
        if (elapsedMinutes >= 45 && elapsedMinutes < 60) {
          currentMinute = 45;
          statusText = 'HT'; // Halftime
        } else if (elapsedMinutes >= 60) {
          currentMinute = Math.min(90, elapsedMinutes - 15);
          statusText = 'LIVE';
        }

        return {
          ...match,
          status: statusText,
          isLive: true,
          minute: currentMinute,
          elapsed: currentMinute,
          homeScore: match.homeScore ?? 0,
          awayScore: match.awayScore ?? 0,
          score: {
            home: match.homeScore ?? 0,
            away: match.awayScore ?? 0,
            fullTime: {
              home: match.homeScore ?? 0,
              away: match.awayScore ?? 0
            }
          }
        } as unknown as Match;
      } 
      // If current time is after match end
      else if (now >= matchTime + durationMs) {
        return {
          ...match,
          status: 'FINISHED',
          isLive: false,
          minute: 90,
          elapsed: 90,
          homeScore: match.homeScore ?? 0,
          awayScore: match.awayScore ?? 0,
          score: {
            home: match.homeScore ?? 0,
            away: match.awayScore ?? 0,
            fullTime: {
              home: match.homeScore ?? 0,
              away: match.awayScore ?? 0
            }
          }
        } as unknown as Match;
      }
    } catch (e) {
      console.warn('[adjustMatchStatus] Failed to calculate dynamic status:', e);
    }
    return match;
  }

  /**
   * Helper to apply adjustMatchStatus on lists of matches or single match data returned by cache or API
   */
  public adjustMatchesData<T>(data: T): T {
    if (!data) return data;
    const stage = Array.isArray(data) ? 'LIST' : 'SINGLE';
    console.log(`[RepositoryV2] Processing ${stage} data. Initial count: ${Array.isArray(data) ? data.length : 1}`);

    if (Array.isArray(data)) {
      const processed = (data as any[]).map(item => {
        if (item && typeof item === 'object') {
          // Normalize if it's a match-like object
          if ('homeTeam' in item || 'utcDate' in item || 'fixture' in item || 'teams' in item) {
            const id = (item as any).id || (item as any).fixture?.id || (item as any)._id || 'unknown';
            const normalized = this.mapFirestoreMatch(String(id), item as DocumentData);
            if (!normalized) return null;
            return this.adjustMatchStatus(normalized);
          }
        }
        return item;
      });

      const filtered = processed.filter(m => {
        if (!m) return false;
        if (m.isHidden) return false;
        
        const lId = m.league?.id || m.leagueDetails?.id || (m as any).leagueId;
        if (lId && isLeagueDisabled(lId)) {
          return false;
        }
        return true;
      });
      console.log(`[RepositoryV2] LIST Stage: Input=${data.length}, Output=${filtered.length}. Rejected=${data.length - filtered.length}`);
      return filtered as unknown as T;
    }

    if (typeof data === 'object') {
      const obj = data as any;
      if ('homeTeam' in obj || 'utcDate' in obj || 'fixture' in obj || 'teams' in obj) {
        const id = obj.id || obj.fixture?.id || obj._id || 'unknown';
        const normalized = this.mapFirestoreMatch(String(id), obj as DocumentData);
        if (!normalized) return null as unknown as T;
        const adjusted = this.adjustMatchStatus(normalized);
        
        if (adjusted.isHidden) {
          console.warn(`[RepositoryV2] SINGLE Stage: Match ${id} is hidden. Reason: ${adjusted.metadata?.hiddenReason}`);
          return null as unknown as T;
        }

        const lId = adjusted.league?.id || adjusted.leagueDetails?.id || (adjusted as any).leagueId;
        if (lId && isLeagueDisabled(lId)) {
          console.log(`[RepositoryV2] SINGLE Stage: Match ${id} belongs to disabled league ${lId}. Filtering out.`);
          return null as unknown as T;
        }
        
        return adjusted as unknown as T;
      }
    }
    return data;
  }

  /**
   * Mapping logic for Firestore match data to unified Match type
   */
  public mapFirestoreMatch(id: string, data: DocumentData): Match | null {
    const normalized = normalizeMatch(id, data);
    if (!normalized) {
        console.warn(`[MatchesRepositoryV2] Match ${id} failed normalization.`);
        return null;
    }
    return normalized;
  }


  /**
   * Helper to execute a standard network-first, cache-fallback API request
   */
  private async executeWithFallback<T>(
    cacheKey: string,
    apiEndpoint: string,
    apiParams: Record<string, any> = {},
    firestoreFallbackFn: () => Promise<T>,
    ttlMs: number = 300000 // Default 5 minutes
  ): Promise<T> {
    const startTime = performance.now();
    const requestId = networkDiagnostic.logRequest(apiEndpoint, { params: apiParams });

    // Check memory/local cache first
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      telemetry.logCacheHit(cacheKey);
      try {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        telemetry.logResponseTime(performance.now() - startTime);
        
        if (requestId) {
          networkDiagnostic.logResponse(requestId, { 
            status: 200, 
            statusText: 'OK (Cache)', 
            headers: { 'x-cache-status': 'HIT' },
            data: parsed 
          }, true);
        }
        
        return this.adjustMatchesData(parsed) as T;
      } catch (e) {
        console.warn(`[MatchesRepositoryV2] Failed to parse cache for ${cacheKey}`, e);
      }
    }

    telemetry.logCacheMiss(cacheKey);

    // Network Request via apiClient
    try {
      telemetry.logApiCall(apiEndpoint);
      const fetchFn = () => apiClient.get<T>(apiEndpoint, { params: apiParams });
      // Call with 2 retries (total 3 attempts)
      const response = await retryManager.withRetry(fetchFn, 2);
      
      const responseData = response.data;
      cacheManager.set(cacheKey, responseData, ttlMs, true); // save with TTL and persistence
      
      telemetry.logResponseTime(performance.now() - startTime);
      
      if (requestId) {
        networkDiagnostic.logResponse(requestId, response, true);
      }
      
      return this.adjustMatchesData(responseData);
    } catch (apiError: any) {
      telemetry.logError('API_CALL_FAILURE', apiError);
      
      if (requestId) {
        networkDiagnostic.logError(requestId, apiError);
      }
      
      // If API fails, try Firestore fallback ONLY if quota is not already known to be exceeded
      if (!telemetry.isFirestoreQuotaExceeded()) {
        try {
          console.log(`[MatchesRepositoryV2] API failed for ${apiEndpoint}, attempting Firestore fallback...`);
          const firestoreData = await firestoreFallbackFn();
          if (firestoreData) {
            return this.adjustMatchesData(firestoreData);
          }
        } catch (fError: any) {
          telemetry.logError('FIRESTORE_FALLBACK_FAILURE', fError);
          // Check if this error itself is a quota error
          if (fError.message?.includes('quota') || fError.code === 'resource-exhausted') {
            telemetry.setFirestoreQuotaExceeded(true);
          }
        }
      }

      console.warn(`[MatchesRepositoryV2] Both API and Firestore failed for ${apiEndpoint}. Returning empty/null.`);
      return (cacheKey.includes('matches') || cacheKey.includes('fixtures') || cacheKey.includes('results')) ? ([] as unknown as T) : (null as unknown as T);
    }
  }

  // 1. Get matches
  async getMatches(filters: { date?: string; status?: string; limit?: number } = {}): Promise<Match[]> {
    const cacheKey = `matches_${filters.date || 'all'}_${filters.status || 'all'}_${filters.limit || '100'}`;
    return this.executeWithFallback<Match[]>(
      cacheKey,
      '/api/matches',
      filters,
      async () => {
        telemetry.logFirestoreRead(this.collectionName);
        let constraints: any[] = [orderBy('startTime', 'desc'), limit(filters.limit || 100)];
        
        if (filters.date) {
          console.log("[RepositoryV2] Querying matches for date:", filters.date);
          
          // Ensure we handle both string comparison and Timestamp comparison if possible
          // But Firestore doesn't support OR between different types easily.
          // Most of our data should be Timestamps, but let's be safe.
          const dateStr = filters.date; // YYYY-MM-DD
          const startOfDay = new Date(`${dateStr}T00:00:00Z`);
          const endOfDay = new Date(`${dateStr}T23:59:59Z`);
          
          constraints = [
            where('startTime', '>=', Timestamp.fromDate(startOfDay)),
            where('startTime', '<=', Timestamp.fromDate(endOfDay)),
            orderBy('startTime', 'desc'),
            limit(filters.limit || 100)
          ];
        }

        if (filters.status) {
          constraints.push(where('status', '==', filters.status));
        }

        const q = query(collection(db, this.collectionName), ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => this.mapFirestoreMatch(docSnap.id, docSnap.data())).filter(Boolean) as Match[];
      }
    );
  }

  // 2. Get Live Matches
  async getLiveMatches(): Promise<Match[]> {
    try {
      // Fetch some general recent/upcoming matches to check if any of them should dynamically be live
      const allMatches = await this.getMatches({ limit: 50 });
      
      const cacheKey = 'matches_live';
      const standardLive = await this.executeWithFallback<Match[]>(
        cacheKey,
        '/api/matches/live',
        {},
        async () => {
          telemetry.logFirestoreRead(this.collectionName);
          const q = query(
            collection(db, this.collectionName),
            where('isLive', '==', true),
            limit(50)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(docSnap => this.mapFirestoreMatch(docSnap.id, docSnap.data())).filter(Boolean) as Match[];
        },
        30000 // 30 seconds TTL for live matches
      );

      // Merge and align using a Map
      const mergedMap = new Map<string, Match>();

      // 1. Add standard live matches (already adjusted by executeWithFallback)
      if (Array.isArray(standardLive)) {
        standardLive.forEach(m => {
          if (m && m.id) {
            mergedMap.set(String(m.id), m);
          }
        });
      }

      // 2. Scan general matches list and add if they became live dynamically
      if (Array.isArray(allMatches)) {
        allMatches.forEach(m => {
          if (m && m.id) {
            const adjusted = this.adjustMatchStatus(m);
            if (adjusted.isLive) {
              mergedMap.set(String(m.id), adjusted);
            }
          }
        });
      }

      return Array.from(mergedMap.values());
    } catch (e) {
      console.error('[MatchesRepositoryV2] getLiveMatches dynamic computation error:', e);
      return [];
    }
  }

  subscribeToMatches(callback: (matches: Match[]) => void) {
    if (telemetry.isFirestoreQuotaExceeded()) {
      console.warn('[MatchesRepositoryV2] subscribeToMatches skipped due to quota.');
      callback([]);
      return () => {};
    }
    telemetry.logFirestoreRead('matches_admin_subscription');
    const q = query(collection(db, this.collectionName), orderBy('startTime', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(docSnap => this.mapFirestoreMatch(docSnap.id, docSnap.data())).filter(Boolean) as Match[];
      callback(matches);
    }, (error: any) => {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.error('[MatchesRepositoryV2] Error in admin matches snapshot:', error);
      callback([]);
    });
  }

  subscribeLiveMatch(id: string, callback: (match: Match | null) => void) {
    if (telemetry.isFirestoreQuotaExceeded()) {
      callback(null);
      return () => {};
    }
    telemetry.logFirestoreRead(`${this.collectionName}/${id}_subscription`);
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const match = this.mapFirestoreMatch(docSnap.id, docSnap.data());
        callback(match);
      } else {
        callback(null);
      }
    }, (error: any) => {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.error(`[MatchesRepositoryV2] Error in live match snapshot for ${id}:`, error);
      callback(null);
    });
  }

  async getMatch(id: string): Promise<Match | null> {
    const cacheKey = `match_detail_${id}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      try {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      } catch {
        return cached;
      }
    }

    try {
      telemetry.logApiCall(`/api/matches/${id}`);
      const response = await apiClient.get<Match>(`/api/matches/${id}`);
      if (response.data) {
        // MUST Normalize the API response to ensure it fits the Match interface
        const normalized = this.mapFirestoreMatch(id, response.data as DocumentData);
        if (!normalized) {
          throw new Error('Failed to normalize API match data');
        }
        const adjusted = this.adjustMatchStatus(normalized);
        cacheManager.set(cacheKey, adjusted, 300000, true);
        return adjusted;
      }
    } catch (apiError) {
      console.warn(`[MatchesRepositoryV2] API getMatch failed for ${id}, trying direct Firestore query.`, apiError);
    }

    // Direct Firestore backup
    if (!telemetry.isFirestoreQuotaExceeded()) {
      try {
        telemetry.logFirestoreRead(`${this.collectionName}/${id}`);
        const docRef = doc(db, this.collectionName, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const match = this.mapFirestoreMatch(snapshot.id, snapshot.data());
          cacheManager.set(cacheKey, match, 300000, true);
          return match;
        }
      } catch (e: any) {
        if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
          telemetry.setFirestoreQuotaExceeded(true);
        }
        console.error(`[MatchesRepositoryV2] Firestore getMatch failed for ${id}:`, e);
      }
    }
    return null;
  }

  async getFixtures(filters: { date?: string } = {}): Promise<Match[]> {
    const cacheKey = `fixtures_${filters.date || 'all'}`;
    return this.executeWithFallback<Match[]>(
      cacheKey,
      '/api/matches/fixtures',
      filters,
      async () => {
        telemetry.logFirestoreRead('fixtures');
        const q = query(
          collection(db, this.collectionName),
          where('status', '==', 'NS'),
          orderBy('startTime', 'asc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => this.mapFirestoreMatch(docSnap.id, docSnap.data())).filter(Boolean) as Match[];
      }
    );
  }

  async getResults(): Promise<Match[]> {
    const cacheKey = 'results_all';
    return this.executeWithFallback<Match[]>(
      cacheKey,
      '/api/matches/results',
      {},
      async () => {
        telemetry.logFirestoreRead('results');
        const q = query(
          collection(db, this.collectionName),
          where('status', 'in', ['FT', 'AET', 'PEN', 'Archived']),
          orderBy('startTime', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => this.mapFirestoreMatch(docSnap.id, docSnap.data())).filter(Boolean) as Match[];
      }
    );
  }

  async getEvents(matchId: string): Promise<MatchEvent[]> {
    const cacheKey = `match_events_${matchId}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      try {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      } catch {
        return cached;
      }
    }

    try {
      const response = await apiClient.get<MatchEvent[]>(`/api/matches/${matchId}/events`);
      if (response.data) {
        cacheManager.set(cacheKey, response.data, 300000, true);
        return response.data;
      }
    } catch (apiError) {
      console.warn(`[MatchesRepositoryV2] API getEvents failed, trying direct Firestore.`, apiError);
    }

    if (!telemetry.isFirestoreQuotaExceeded()) {
      try {
        telemetry.logFirestoreRead(`events/${matchId}`);
        const snapshot = await getDoc(doc(db, 'events', matchId));
        if (snapshot.exists()) {
          const events = (snapshot.data().events || []) as MatchEvent[];
          cacheManager.set(cacheKey, events, 300000, true);
          return events;
        }
      } catch (e: any) {
        if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
          telemetry.setFirestoreQuotaExceeded(true);
        }
        console.error(`[MatchesRepositoryV2] Firestore getEvents failed for ${matchId}:`, e);
      }
    }
    return [];
  }

  async getStatistics(matchId: string): Promise<MatchStat[]> {
    const cacheKey = `match_stats_${matchId}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      try {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      } catch {
        return cached;
      }
    }

    try {
      const response = await apiClient.get<MatchStat[]>(`/api/matches/${matchId}/statistics`);
      if (response.data) {
        cacheManager.set(cacheKey, response.data, 300000, true);
        return response.data;
      }
    } catch (apiError) {
      console.warn(`[MatchesRepositoryV2] API getStatistics failed, trying direct Firestore.`, apiError);
    }

    if (!telemetry.isFirestoreQuotaExceeded()) {
      try {
        telemetry.logFirestoreRead(`statistics/${matchId}`);
        const snapshot = await getDoc(doc(db, 'statistics', matchId));
        if (snapshot.exists()) {
          const stats = (snapshot.data().statistics || []) as MatchStat[];
          cacheManager.set(cacheKey, stats, 300000, true);
          return stats;
        }
      } catch (e: any) {
        if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
          telemetry.setFirestoreQuotaExceeded(true);
        }
        console.error(`[MatchesRepositoryV2] Firestore getStatistics failed for ${matchId}:`, e);
      }
    }
    return [];
  }

  async getLineups(matchId: string): Promise<TeamLineup[]> {
    const cacheKey = `match_lineups_${matchId}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      try {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      } catch {
        return cached;
      }
    }

    try {
      const response = await apiClient.get<TeamLineup[]>(`/api/matches/${matchId}/lineups`);
      if (response.data) {
        cacheManager.set(cacheKey, response.data, 300000, true);
        return response.data;
      }
    } catch (apiError) {
      console.warn(`[MatchesRepositoryV2] API getLineups failed, trying direct Firestore.`, apiError);
    }

    if (!telemetry.isFirestoreQuotaExceeded()) {
      try {
        telemetry.logFirestoreRead(`lineups/${matchId}`);
        const snapshot = await getDoc(doc(db, 'lineups', matchId));
        if (snapshot.exists()) {
          const lineups = (snapshot.data().lineups || []) as TeamLineup[];
          cacheManager.set(cacheKey, lineups, 300000, true);
          return lineups;
        }
      } catch (e: any) {
        if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
          telemetry.setFirestoreQuotaExceeded(true);
        }
        console.error(`[MatchesRepositoryV2] Firestore getLineups failed for ${matchId}:`, e);
      }
    }
    return [];
  }

  async getStandings(leagueId?: string | number): Promise<any[]> {
    const cacheKey = `standings_${leagueId || 'all'}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      try {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      } catch {
        return cached;
      }
    }

    try {
      const response = await apiClient.get<any[]>(`/api/matches/standings/all`);
      if (response.data) {
        let filtered = response.data;
        if (leagueId) {
          filtered = response.data.filter((s: any) => String(s.leagueId || s.id) === String(leagueId));
        }
        cacheManager.set(cacheKey, filtered, 300000, true);
        return filtered;
      }
    } catch (apiError) {
      console.warn(`[MatchesRepositoryV2] API getStandings failed, trying direct Firestore.`, apiError);
    }

    if (!telemetry.isFirestoreQuotaExceeded()) {
      try {
        telemetry.logFirestoreRead('standings');
        let snapshot;
        if (leagueId) {
          const docRef = doc(db, 'standings', String(leagueId));
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            cacheManager.set(cacheKey, [data], 300000, true);
            return [data];
          }
          const q = query(
            collection(db, 'standings'),
            where('leagueId', '==', String(leagueId)),
            limit(10)
          );
          snapshot = await getDocs(q);
          if (snapshot.empty) {
            const qNumeric = query(
              collection(db, 'standings'),
              where('leagueId', '==', Number(leagueId)),
              limit(10)
            );
            snapshot = await getDocs(qNumeric);
          }
        }
        if (!snapshot || snapshot.empty) {
          const q = query(collection(db, 'standings'), limit(50));
          snapshot = await getDocs(q);
        }
        const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        let filtered = list;
        if (leagueId) {
          filtered = list.filter((s: any) => String(s.leagueId || s.id) === String(leagueId));
        }
        cacheManager.set(cacheKey, filtered, 300000, true);
        return filtered;
      } catch (e: any) {
        if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
          telemetry.setFirestoreQuotaExceeded(true);
        }
        console.error(`[MatchesRepositoryV2] Firestore getStandings failed:`, e);
      }
    }
    return [];
  }

  async logAction(log: Omit<MatchAuditLog, 'id' | 'timestamp'>) {
    const logRef = collection(db, 'match_audit_logs');
    await addDoc(logRef, { ...log, timestamp: serverTimestamp() });
  }

  async createVersion(matchId: string, data: any, editorId: string, editorName: string, previousData?: any, note?: string) {
    const versionRef = collection(db, 'match_versions');
    await addDoc(versionRef, {
      matchId, editorId, editorName, timestamp: serverTimestamp(), data,
      previousData: previousData || null, note: note || ''
    });
  }

  async getVersions(matchId: string): Promise<MatchVersion[]> {
    const q = query(collection(db, 'match_versions'), where('matchId', '==', matchId), orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MatchVersion));
  }

  async getAuditLogs(matchId: string): Promise<MatchAuditLog[]> {
    const q = query(collection(db, 'match_audit_logs'), where('matchId', '==', matchId), orderBy('timestamp', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as MatchAuditLog));
  }

  async acquireLock(matchId: string, userId: string, userName: string): Promise<{ success: boolean; lock?: any }> {
    const lockRef = doc(db, 'match_locks', matchId);
    await setDoc(lockRef, { userId, userName, expiresAt: Timestamp.fromDate(new Date(Date.now() + 300000)) });
    return { success: true };
  }

  async releaseLock(matchId: string, userId: string) {
    await deleteDoc(doc(db, 'match_locks', matchId));
  }

  async forceUnlock(matchId: string) {
    await deleteDoc(doc(db, 'match_locks', matchId));
  }

  async softDelete(matchId: string, userId: string, userName: string) {
    await this.update(matchId, { isDeleted: true, status: MatchStatus.Archived as any });
    await this.logAction({ matchId, userId, userName, action: 'Delete', details: 'Soft delete' });
  }

  async restoreMatch(matchId: string, userId: string, userName: string) {
    await this.update(matchId, { isDeleted: false, status: MatchStatus.Draft as any });
    await this.logAction({ matchId, userId, userName, action: 'Restore', details: 'Restore' });
  }

  async addMatchEvent(matchId: string, event: MatchEvent, userId: string, userName: string) {
    await updateDoc(doc(db, this.collectionName, matchId), { events: arrayUnion(event) });
    await this.logAction({ matchId, userId, userName, action: 'EventAdded', details: 'Added event' });
  }

  async getMatchesByLeague(leagueId: string, count: number = 20): Promise<Match[]> {
    const all = await this.getMatches();
    const filtered = all.filter(m => {
      const matchLeagueId = (m as any).leagueId || (m.league && typeof m.league === 'object' ? (m.league as any).id : '');
      return String(matchLeagueId) === String(leagueId);
    });
    return filtered.slice(0, count);
  }

  async getHeadToHead(homeId: string, awayId: string): Promise<Match[]> {
    const all = await this.getMatches();
    const getTeamId = (team: any): string => {
      if (!team) return '';
      if (typeof team === 'object') return String(team.id || '');
      return String(team);
    };
    const filtered = all.filter(m => {
      const hId = getTeamId(m.homeTeam);
      const aId = getTeamId(m.awayTeam);
      return (hId === String(homeId) && aId === String(awayId)) ||
             (hId === String(awayId) && aId === String(homeId));
    });
    return filtered.slice(0, 10);
  }

  async getLeagueMatches(leagueId: string): Promise<Match[]> {
    const all = await this.getMatches();
    return all.filter(m => {
      const matchLeagueId = (m as any).leagueId || (m.league && typeof m.league === 'object' ? (m.league as any).id : '');
      return String(matchLeagueId) === String(leagueId);
    });
  }

  async getTeamMatches(teamId: string): Promise<Match[]> {
    const all = await this.getMatches();
    const getTeamId = (team: any): string => {
      if (!team) return '';
      if (typeof team === 'object') return String(team.id || '');
      return String(team);
    };
    return all.filter(m => {
      const hId = getTeamId(m.homeTeam);
      const aId = getTeamId(m.awayTeam);
      return hId === String(teamId) || aId === String(teamId);
    });
  }

  async getTeamsFromMatches(limitCount: number = 100): Promise<Map<string, { id: string; name: string; logo: string }>> {
    const matches = await this.getMatches({ limit: limitCount });
    const teamsMap = new Map<string, { id: string; name: string; logo: string }>();
    
    matches.forEach(m => {
      if (m.homeTeam && typeof m.homeTeam === 'object') {
        const home = m.homeTeam as any;
        if (home.id && home.name) {
          teamsMap.set(String(home.id), { id: String(home.id), name: home.name, logo: home.logo || '' });
        }
      }
      if (m.awayTeam && typeof m.awayTeam === 'object') {
        const away = m.awayTeam as any;
        if (away.id && away.name) {
          teamsMap.set(String(away.id), { id: String(away.id), name: away.name, logo: away.logo || '' });
        }
      }
    });
    
    return teamsMap;
  }
}

export const matchesRepositoryV2 = new MatchesRepositoryV2();
