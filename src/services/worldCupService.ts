import { dataProviderManager } from './worldCupDataProvider';
import { ARABIC_TEAM_NAMES, STAGE_TRANSLATIONS, STATUS_TRANSLATIONS, FIFA_TO_ISO2 } from './worldCupConstants';
import { translationService } from './translationService';
import { mapApiFootballMatches } from './apiFootballMapper.js';
import { collection, getDocs, addDoc, serverTimestamp, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

import { openFootballService } from './openFootballService';

// Use dynamic import instead of static for openFootballService to break circular dependency
const getOpenFootballService = () => Promise.resolve(openFootballService);

// Smart Caching config (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const memoryCache = new Map<string, { data: any; timestamp: number }>();

const logSystemError = async (source: string, error: string, context: any = {}) => {
  try {
    await addDoc(collection(db, 'system_logs'), {
      type: 'API_FAILURE',
      source,
      error,
      context,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error('[worldCupService] Failed to log error to Firestore:', e);
  }
};

export interface ServiceHealthMetrics {
  totalRequests: number;
  failedRequests: number;
  lastLatencyMs: number;
  avgLatencyMs: number;
  currentStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  activeSource: 'PRIMARY_API' | 'BACKUP_FALLBACK';
  forceBackupMode: boolean;
  history: {
    timestamp: string;
    endpoint: string;
    latency: number;
    success: boolean;
    error?: string;
  }[];
}

export let serviceHealthMetrics: ServiceHealthMetrics = {
  totalRequests: 0,
  failedRequests: 0,
  lastLatencyMs: 0,
  avgLatencyMs: 0,
  currentStatus: 'HEALTHY',
  activeSource: 'BACKUP_FALLBACK',
  forceBackupMode: false,
  history: []
};

let onMetricsChangedCallback: ((metrics: ServiceHealthMetrics) => void) | null = null;

export const registerMetricsListener = (callback: (metrics: ServiceHealthMetrics) => void) => {
  onMetricsChangedCallback = callback;
  callback({ ...serviceHealthMetrics });
};

export const unregisterMetricsListener = () => {
  onMetricsChangedCallback = null;
};

export const setForceBackupMode = (force: boolean) => {
  serviceHealthMetrics.forceBackupMode = force;
  updateStatusAndNotify();
};

const updateStatusAndNotify = () => {
  const failureRate = serviceHealthMetrics.totalRequests > 0 
    ? serviceHealthMetrics.failedRequests / serviceHealthMetrics.totalRequests 
    : 0;

  if (serviceHealthMetrics.forceBackupMode) {
    serviceHealthMetrics.currentStatus = 'DEGRADED';
    serviceHealthMetrics.activeSource = 'BACKUP_FALLBACK';
  } else if (failureRate >= 0.5) {
    serviceHealthMetrics.currentStatus = 'DOWN';
    serviceHealthMetrics.activeSource = 'BACKUP_FALLBACK';
  } else if (failureRate > 0) {
    serviceHealthMetrics.currentStatus = 'DEGRADED';
    serviceHealthMetrics.activeSource = 'PRIMARY_API';
  } else {
    serviceHealthMetrics.currentStatus = 'HEALTHY';
    serviceHealthMetrics.activeSource = 'PRIMARY_API';
  }

  if (onMetricsChangedCallback) {
    onMetricsChangedCallback({ ...serviceHealthMetrics });
  }
};

const recordMetrics = (endpoint: string, startTime: number, success: boolean, errorMessage?: string) => {
  const duration = Date.now() - startTime;
  serviceHealthMetrics.totalRequests += 1;
  serviceHealthMetrics.lastLatencyMs = duration;
  
  if (!success) {
    serviceHealthMetrics.failedRequests += 1;
  } else {
    const successCount = serviceHealthMetrics.totalRequests - serviceHealthMetrics.failedRequests;
    if (serviceHealthMetrics.avgLatencyMs === 0) {
      serviceHealthMetrics.avgLatencyMs = duration;
    } else {
      serviceHealthMetrics.avgLatencyMs = Math.round(
        (serviceHealthMetrics.avgLatencyMs * (successCount - 1) + duration) / successCount
      );
    }
  }

  // Record history
  serviceHealthMetrics.history.unshift({
    timestamp: new Date().toLocaleTimeString('ar-EG'),
    endpoint: endpoint,
    latency: duration,
    success,
    error: errorMessage
  });

  if (serviceHealthMetrics.history.length > 10) {
    serviceHealthMetrics.history.pop();
  }

  updateStatusAndNotify();
};

// Helper function to translate team names to Arabic for perfect design craftsmanship
export const TEAM_TRANSLATIONS: Record<string, string> = ARABIC_TEAM_NAMES;

// Map stages to readable Arabic
export const STAGE_TRANSLATIONS_MAP: Record<string, string> = STAGE_TRANSLATIONS;

// Map match statuses to Arabic
export const STATUS_TRANSLATIONS_MAP: Record<string, string> = STATUS_TRANSLATIONS;

export interface WCMatch {
  id: string;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: string | null;
    duration: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  referees: {
    id: number;
    name: string;
    type: string;
    nationality: string;
  }[];
  venue?: string;
  elapsed?: number;
}

export interface TableEntry {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingGroup {
  stage: string;
  type: string;
  group: string;
  table: TableEntry[];
}

export interface WCTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  coach?: string;
  ranking?: number;
  history?: string;
  logo?: string;
}

export interface ScorerEntry {
  player: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    section: string;
    position: string | null;
    shirtNumber: number | null;
  };
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  goals: number;
  assists: number | null;
  playedGames: number | null;
}

export const worldCupService = {
  /**
   * Helper translator function for team names
   */
  translateTeam(name: string): string {
    return translationService.translateTeam(name);
  },

  /**
   * Helper translator function for match status
   */
  translateStatus(status: string): string {
    return STATUS_TRANSLATIONS_MAP[status] || status;
  },

  /**
   * Helper translator function for stages
   */
  translateStage(stage: string): string {
    return STAGE_TRANSLATIONS_MAP[stage] || stage;
  },

  /**
   * Get all World Cups editions catalog
   */
  getEditions() {
    return openFootballService.getEditions();
  },

  /**
   * Get derived stats for an edition
   */
  getEditionStats(matches: WCMatch[]) {
    return openFootballService.getEditionStats(matches as any);
  },

  /**
   * Safe getter with 5-minute smart caching, performance telemetry and automatic failure logging
   */
  async safeGet<T>(endpoint: string, fallbackAction: () => Promise<T> | T, ignoreCache = false): Promise<T> {
    const startTime = Date.now();
    
    // 1. Check memory cache first
    const cached = memoryCache.get(endpoint);
    if (!ignoreCache && cached && (startTime - cached.timestamp < CACHE_TTL)) {
      console.log(`[worldCupService] Serving cached data for ${endpoint}`);
      return cached.data as T;
    }

    if (serviceHealthMetrics.forceBackupMode) {
      recordMetrics(endpoint, startTime, false, "وضع البيانات الاحتياطية الثابتة نشط");
      return fallbackAction();
    }

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API response error: ${response.status}`);
      }
      const data = await response.json();
      
      // Update cache on success
      memoryCache.set(endpoint, { data, timestamp: Date.now() });
      
      recordMetrics(endpoint, startTime, true);
      return data;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.warn(`[worldCupService] safeGet failed for ${endpoint}:`, errorMsg);
      
      // If quota is exhausted, force backup mode to prevent further failed calls
      if (errorMsg.includes("quota") || errorMsg.includes("No healthy keys")) {
        console.error("[worldCupService] API quota exhausted, switching to backup mode");
        setForceBackupMode(true);
      }
      
      // Log failure to Firestore for production tracking
      logSystemError('WorldCupService', errorMsg, { endpoint });
      
      recordMetrics(endpoint, startTime, false, errorMsg);
      return fallbackAction();
    }
  },

  /**
   * Execute immediate connectivity diagnostic test
   */
  async runConnectionDiagnostic(): Promise<boolean> {
    if (serviceHealthMetrics.forceBackupMode) return true;
    
    try {
      const startTime = Date.now();
      const response = await fetch('/api/football-data/competitions/WC');
      const success = response.ok;
      recordMetrics('/api/football-data/competitions/WC', startTime, success, !success ? "Diagnostic failed" : undefined);
      return success;
    } catch (e: any) {
      return false;
    }
  },

  /**
   * Universal helper to merge manual override configurations from Firestore cms_match_overrides collection.
   * This retains manual edits for names, logos, stadiums, commentators, channels, description, timings, schedules and scores.
   */
  async mergeUniversalOverrides(matches: WCMatch[]): Promise<WCMatch[]> {
    try {
      const cacheKey = 'firestore_cms_match_overrides';
      let overridesSnap;
      const cached = memoryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        overridesSnap = cached.data;
      } else {
        const snap = await getDocs(query(collection(db, 'cms_match_overrides'), limit(100)));
        overridesSnap = snap.docs.map(doc => ({ id: String(doc.id), data: doc.data() }));
        memoryCache.set(cacheKey, { data: overridesSnap, timestamp: Date.now() });
      }

      const overridesMap = new Map<string, any>();
      overridesSnap.forEach((doc: any) => {
        overridesMap.set(doc.id, doc.data);
      });

      if (overridesMap.size > 0) {
        return matches.map(m => {
          const mIdStr = String(m.id);
          const override = overridesMap.get(mIdStr) || 
                           overridesMap.get(mIdStr.replace('2026-m-', '')) ||
                           overridesMap.get(mIdStr.replace('2022-m-', ''));
          if (override) {
            const merged = { ...m };

            // Overridable fields
            if (override.status) merged.status = override.status;
            if (override.elapsed !== undefined) merged.elapsed = override.elapsed;
            if (override.matchName) (merged as any).matchName = override.matchName;
            if (override.matchDescription) (merged as any).matchDescription = override.matchDescription;
            if (override.matchImage) (merged as any).matchImage = override.matchImage;
            if (override.commentator) (merged as any).commentator = override.commentator;
            if (override.broadcastingChannels) (merged as any).broadcastingChannels = override.broadcastingChannels;

            if (override.homeTeamName) {
              merged.homeTeam = {
                ...merged.homeTeam,
                name: override.homeTeamName,
                shortName: override.homeTeamName.substring(0, 3).toUpperCase()
              };
            }
            if (override.awayTeamName) {
              merged.awayTeam = {
                ...merged.awayTeam,
                name: override.awayTeamName,
                shortName: override.awayTeamName.substring(0, 3).toUpperCase()
              };
            }

            if (override.homeTeamCrest) {
              merged.homeTeam = {
                ...merged.homeTeam,
                crest: override.homeTeamCrest
              };
            }
            if (override.awayTeamCrest) {
              merged.awayTeam = {
                ...merged.awayTeam,
                crest: override.awayTeamCrest
              };
            }

            if (override.utcDate) {
              merged.utcDate = override.utcDate;
            }

            if (override.competitionName) {
              (merged as any).competition = {
                ...(merged as any).competition,
                name: override.competitionName
              };
              merged.stage = override.competitionName;
            }

            if (override.venue) {
              merged.venue = override.venue;
            }

            if (override.referee) {
              merged.referees = [{ name: override.referee, type: 'REFEREE', id: 9999, nationality: '' }];
            }

            if (override.homeScore !== undefined || override.awayScore !== undefined) {
              const hScore = override.homeScore !== undefined ? override.homeScore : (merged.score?.fullTime?.home ?? 0);
              const aScore = override.awayScore !== undefined ? override.awayScore : (merged.score?.fullTime?.away ?? 0);
              merged.score = {
                ...merged.score,
                winner: hScore > aScore ? 'HOME_TEAM' : (hScore < aScore ? 'AWAY_TEAM' : 'DRAW'),
                fullTime: {
                  home: hScore,
                  away: aScore
                },
                halfTime: merged.score?.halfTime || { home: null, away: null }
              };
            }

            return merged;
          }
          return m;
        });
      }
    } catch (e) {
      console.warn("Universal override merge bypassed or failed in worldCupService:", e);
    }
    return matches;
  },

  /**
   * Fetch all World Cup matches from Football-Data API or OpenFootball CDN
   */
  async getWorldCupMatches(year?: number, ignoreCache = false): Promise<WCMatch[]> {
    console.log("getWorldCupMatches called for year:", year);
    const targetYear = year || 2026;
    
    // Providers fallback chain
    const providers = [
      { name: 'API-Football', fetch: this.fetchApiFootballMatches.bind(this) },
      { name: 'Football-Data', fetch: this.fetchFootballDataMatches.bind(this) },
      { name: 'OpenFootball', fetch: this.fetchOpenFootballMatches.bind(this) }
    ];

    for (const provider of providers) {
      try {
        if (serviceHealthMetrics.forceBackupMode && provider.name === 'API-Football') continue;
        
        console.log(`[worldCupService] Trying to fetch matches from ${provider.name}...`);
        const matches = await provider.fetch(targetYear, ignoreCache);
        
        if (matches && matches.length > 0) {
          console.log(`[worldCupService] Successfully fetched ${matches.length} matches from ${provider.name}`);
          return await this.mergeUniversalOverrides(matches);
        }
      } catch (err: any) {
        console.warn(`[worldCupService] Failed to fetch matches from ${provider.name} for ${targetYear}:`, err.message);
        
        // Check for quota/key exhaustion issues
        const errorMsg = err.message || '';
        if (errorMsg.includes('quota') || errorMsg.includes('No healthy keys')) {
          serviceHealthMetrics.currentStatus = 'DEGRADED';
          await logSystemError('worldCupService', `Quota exceeded for ${provider.name}`, { error: errorMsg });
        }
      }
    }

    console.error(`[worldCupService] All providers failed to fetch matches for ${targetYear}`);
    return []; // Return empty instead of crashing
  },

  async fetchApiFootballMatches(year: number, ignoreCache: boolean): Promise<WCMatch[]> {
    const data = await this.safeGet<any>(`/api/football-api/fixtures?league=1&season=${year}`, async () => null, ignoreCache);
    if (!data || !data.response || data.response.length === 0) return [];
    
    const mapped = mapApiFootballMatches(data);
    return (mapped as any[]).map(m => {
        const rawRound = m.competition?.name || '';
        let stage = m.status;
        let group = null;
        let matchday = 1;

        if (rawRound.includes('Group')) {
          stage = 'GROUP_STAGE';
          const groupMatch = rawRound.match(/Group ([A-H])/);
          if (groupMatch) group = `GROUP_${groupMatch[1]}`;
          
          const dayMatch = rawRound.match(/- (\d+)/);
          if (dayMatch) matchday = parseInt(dayMatch[1], 10);
        } else if (rawRound.includes('Round of 16')) {
          stage = 'ROUND_OF_16';
        } else if (rawRound.includes('Quarter-finals')) {
          stage = 'QUARTER_FINALS';
        } else if (rawRound.includes('Semi-finals')) {
          stage = 'SEMI_FINALS';
        } else if (rawRound.includes('Final')) {
          stage = 'FINAL';
        }

        return {
          ...m,
          id: String(m.id),
          matchday,
          group,
          stage,
          score: {
            winner: m.score.home > m.score.away ? 'HOME_TEAM' : (m.score.home < m.score.away ? 'AWAY_TEAM' : 'DRAW'),
            duration: 'REGULAR',
            fullTime: { home: m.score.home, away: m.score.away },
            halfTime: { home: m.score.halfTimeHome || null, away: m.score.halfTimeAway || null }
          },
          referees: []
        };
    }) as unknown as WCMatch[];
  },

  async fetchFootballDataMatches(year: number, ignoreCache: boolean): Promise<WCMatch[]> {
    const data = await this.safeGet(`/api/football-data/competitions/WC/matches?season=${year}`, async () => ({ matches: [] }), ignoreCache);
    if (!data || !data.matches || data.matches.length === 0) return [];
    
    return data.matches.map((m: any) => ({
      id: String(m.id),
      utcDate: m.utcDate,
      status: m.status,
      matchday: m.matchday,
      stage: m.stage,
      group: m.group,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        shortName: m.homeTeam.shortName || m.homeTeam.tla,
        tla: m.homeTeam.tla,
        crest: m.homeTeam.crest
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        shortName: m.awayTeam.shortName || m.awayTeam.tla,
        tla: m.awayTeam.tla,
        crest: m.awayTeam.crest
      },
      score: {
        winner: m.score.winner,
        duration: m.score.duration || 'REGULAR',
        fullTime: { home: m.score.fullTime.home, away: m.score.fullTime.away },
        halfTime: { home: m.score.halfTime?.home || null, away: m.score.halfTime?.away || null }
      },
      referees: m.referees || [],
      venue: m.venue,
      elapsed: m.status === 'IN_PLAY' ? 45 : undefined
    }));
  },

  async fetchOpenFootballMatches(year: number, ignoreCache: boolean): Promise<WCMatch[]> {
    // Implement openFootball fallback
    const data = await openFootballService.getEditionData(year);
    if (!data || !data.matches) return [];

    return data.matches.map((m: any) => ({
      id: String(m.id),
      utcDate: m.utcDate,
      status: m.status,
      matchday: m.matchday,
      stage: m.stage,
      group: m.group,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        shortName: m.homeTeam.shortName || m.homeTeam.tla,
        tla: m.homeTeam.tla,
        crest: m.homeTeam.crest
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        shortName: m.awayTeam.shortName || m.awayTeam.tla,
        tla: m.awayTeam.tla,
        crest: m.awayTeam.crest
      },
      score: {
        winner: m.score.winner,
        duration: m.score.duration || 'REGULAR',
        fullTime: { home: m.score.fullTime.home, away: m.score.fullTime.away },
        halfTime: { home: m.score.halfTime?.home || null, away: m.score.halfTime?.away || null }
      },
      referees: m.referees || [],
      venue: m.venue,
      elapsed: m.status === 'IN_PLAY' ? 45 : undefined
    }));
  },

  /**
   * Fetch World Cup standings/tables from Football-Data API or OpenFootball CDN
   */
  async getWorldCupStandings(year?: number): Promise<StandingGroup[]> {
    const targetYear = year || 2026;

    if (!serviceHealthMetrics.forceBackupMode && (targetYear === 2026 || targetYear === 2022)) {
      try {
        // Try API-Football Standings
        const footballApiData = await this.safeGet<any>(`/api/football-api/standings?league=1&season=${targetYear}`, async () => {
          return null;
        });

        if (footballApiData && footballApiData.response && footballApiData.response.length > 0) {
          console.log(`[worldCupService] Successfully fetched real standings from API-Football for ${targetYear}`);
          const { mapLeagueStandings } = await import('./standingsMapper');
          const groups = mapLeagueStandings(footballApiData);
          
          return groups.map((g: any) => ({
            stage: 'GROUP_STAGE',
            type: 'TOTAL',
            group: g.group,
            table: g.table.map((entry: any) => ({
              position: entry.rank,
              team: {
                id: Number(entry.teamId),
                name: entry.team,
                shortName: entry.team.substring(0, 3).toUpperCase(),
                tla: entry.tla || entry.team.substring(0, 3).toUpperCase(),
                crest: entry.logo
              },
              playedGames: entry.played,
              won: entry.win,
              draw: entry.draw,
              lost: entry.lose,
              points: entry.points,
              goalsFor: entry.goalsFor,
              goalsAgainst: entry.goalsAgainst,
              goalDifference: entry.goalsDiff
            }))
          })) as StandingGroup[];
        }

        const data = await this.safeGet(`/api/football-data/competitions/WC/standings?season=${targetYear}`, async () => {
          return { standings: [] };
        });

        if (data && data.standings && data.standings.length > 0) {
          console.log(`[worldCupService] Successfully fetched real standings for ${targetYear}`);
          const mappedStandings: StandingGroup[] = data.standings.map((s: any) => ({
            stage: s.stage,
            type: s.type,
            group: s.group,
            table: s.table.map((entry: any) => ({
              position: entry.position,
              team: {
                id: entry.team.id,
                name: entry.team.name,
                shortName: entry.team.shortName || entry.team.tla,
                tla: entry.team.tla,
                crest: entry.team.crest
              },
              playedGames: entry.playedGames,
              won: entry.won,
              draw: entry.draw,
              lost: entry.lost,
              points: entry.points,
              goalsFor: entry.goalsFor,
              goalsAgainst: entry.goalsAgainst,
              goalDifference: entry.goalDifference
            }))
          }));
          return mappedStandings;
        }
      } catch (err) {
        console.warn(`[worldCupService] Failed to fetch real standings for ${targetYear}, falling back:`, err);
      }
    }

    const activeMatches = await this.getWorldCupMatches(targetYear);
    // Recalculate standings based on matches to keep live overrides perfectly synchronized
    const customStandings = openFootballService.calculateStandings(activeMatches as any);
    return customStandings as StandingGroup[];
  },

  /**
   * Fetch all participating teams from Football-Data API or OpenFootball CDN
   */
  async getWorldCupTeams(year?: number): Promise<WCTeam[]> {
    const targetYear = year || 2026;
    let baseTeams: WCTeam[] = [];

    if (!serviceHealthMetrics.forceBackupMode && (targetYear === 2026 || targetYear === 2022)) {
      try {
        // Try API-Football Teams
        const footballApiData = await this.safeGet<any>(`/api/football-api/teams?league=1&season=${targetYear}`, async () => {
          return null;
        });

        if (footballApiData && footballApiData.response && footballApiData.response.length > 0) {
          console.log(`[worldCupService] Successfully fetched real teams from API-Football for ${targetYear}`);
          const { mapRawTeams } = await import('./teamMapper');
          const mapped = mapRawTeams(footballApiData.response);
          baseTeams = mapped.map((t: any) => ({
            id: Number(t.id),
            name: t.name,
            shortName: t.code || t.name.substring(0, 3).toUpperCase(),
            tla: t.code || t.name.substring(0, 3).toUpperCase(),
            crest: t.logo,
            venue: t.venueName,
            founded: t.founded
          }));
        }

        const data = await this.safeGet(`/api/football-data/competitions/WC/teams?season=${targetYear}`, async () => {
            return { teams: [] };
          });

        if (data && data.teams && data.teams.length > 0) {
          console.log(`[worldCupService] Successfully fetched real teams for ${targetYear}`);
          baseTeams = data.teams.map((t: any) => ({
            id: t.id,
            name: t.name,
            shortName: t.shortName || t.tla,
            tla: t.tla,
            crest: t.crest,
            address: t.address,
            website: t.website,
            founded: t.founded,
            clubColors: t.clubColors,
            venue: t.venue
          }));
        }
      } catch (err) {
        console.warn(`[worldCupService] Failed to fetch real teams for ${targetYear}, falling back:`, err);
      }
    }

    if (baseTeams.length === 0) {
      if (targetYear === 2026) {
        const data = await openFootballService.getEditionData(2026);
        baseTeams = data.teams as unknown as WCTeam[];
      } else {
        const data = await openFootballService.getEditionData(targetYear);
        baseTeams = data.teams as unknown as WCTeam[];
      }
    }

    // Merge team overrides from Firestore
    try {
      const cacheKey = 'firestore_cms_teams';
      let overridesSnap;
      const cached = memoryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        overridesSnap = cached.data;
      } else {
        const snap = await getDocs(query(collection(db, 'cms_teams'), limit(100)));
        overridesSnap = snap.docs.map(doc => ({ id: String(doc.id), data: doc.data() }));
        memoryCache.set(cacheKey, { data: overridesSnap, timestamp: Date.now() });
      }

      const overridesMap = new Map<string, any>();
      overridesSnap.forEach((doc: any) => {
        overridesMap.set(doc.id, doc.data);
      });

      if (overridesMap.size > 0) {
        baseTeams = baseTeams.map(t => {
          const tIdStr = String(t.id);
          const override = overridesMap.get(tIdStr) || overridesMap.get(`wc-${tIdStr}`) || overridesMap.get(tIdStr.replace('wc-', ''));
          if (override) {
            return {
              ...t,
              name: override.name || t.name,
              coach: override.coach || t.coach,
              ranking: override.ranking !== undefined ? override.ranking : t.ranking,
              history: override.history || t.history
            } as any;
          }
          return t;
        });
      }
    } catch (e) {
      console.warn("Firestore team overrides merge bypassed:", e);
    }

    return baseTeams;
  },

  /**
   * Fetch top scorers of the World Cup from Football-Data API
   */
  async getWorldCupScorers(year?: number): Promise<ScorerEntry[]> {
    const targetYear = year || 2026;

    if (!serviceHealthMetrics.forceBackupMode && (targetYear === 2026 || targetYear === 2022)) {
      try {
        // Try API-Football Scorers
        const footballApiData = await this.safeGet<any>(`/api/football-api/players/topscorers?league=1&season=${targetYear}`, async () => {
          return null;
        });

        if (footballApiData && footballApiData.response && footballApiData.response.length > 0) {
          console.log(`[worldCupService] Successfully fetched real scorers from API-Football for ${targetYear}`);
          const mappedScorers: ScorerEntry[] = footballApiData.response.map((s: any) => ({
            player: {
              id: s.player.id,
              name: s.player.name,
              firstName: s.player.firstname,
              lastName: s.player.lastname,
              dateOfBirth: s.player.birth?.date || '',
              nationality: s.player.nationality,
              section: 'World Cup',
              position: s.statistics?.[0]?.games?.position || null,
              shirtNumber: null
            },
            team: {
              id: s.statistics?.[0]?.team?.id || 0,
              name: s.statistics?.[0]?.team?.name || '',
              shortName: s.statistics?.[0]?.team?.name?.substring(0, 3).toUpperCase() || '',
              tla: s.statistics?.[0]?.team?.name?.substring(0, 3).toUpperCase() || '',
              crest: s.statistics?.[0]?.team?.logo || ''
            },
            goals: s.statistics?.[0]?.goals?.total || 0,
            assists: s.statistics?.[0]?.goals?.assists || null,
            playedGames: s.statistics?.[0]?.games?.appearences || null
          }));
          return mappedScorers;
        }

        const data = await this.safeGet(`/api/football-data/competitions/WC/scorers?season=${targetYear}`, async () => {
          return { scorers: [] };
        });

        if (data && data.scorers && data.scorers.length > 0) {
          console.log(`[worldCupService] Successfully fetched real scorers for ${targetYear}`);
          const mappedScorers: ScorerEntry[] = data.scorers.map((s: any) => ({
            player: {
              id: s.player.id,
              name: s.player.name,
              firstName: s.player.firstName,
              lastName: s.player.lastName,
              dateOfBirth: s.player.dateOfBirth,
              nationality: s.player.nationality,
              section: s.player.section,
              position: s.player.position,
              shirtNumber: s.player.shirtNumber
            },
            team: {
              id: s.team.id,
              name: s.team.name,
              shortName: s.team.shortName || s.team.tla,
              tla: s.team.tla,
              crest: s.team.crest
            },
            goals: s.goals,
            assists: s.assists,
            playedGames: s.playedGames
          }));
          return mappedScorers;
        }
      } catch (err) {
        console.warn(`[worldCupService] Failed to fetch real scorers for ${targetYear}, falling back:`, err);
      }
    }

    // Default return empty if no API data or historical
    return [];
  },

  /**
   * Get single match detail from Football-Data API or search loaded openfootball models
   */
  async getMatchDetails(matchId: string | number): Promise<WCMatch> {
    let idStr = String(matchId);
    
    // Strip wc- prefix if present for API-based matches
    const cleanId = idStr.startsWith('wc-') ? idStr.replace('wc-', '') : idStr;
    
    // 1. Try 2026 first (Primary)
    const matches2026 = await this.getWorldCupMatches(2026);
    let matched = matches2026.find(m => String(m.id) === idStr || String(m.id) === cleanId);
    if (matched) return matched;

    // 2. Try 2022 (Secondary)
    const matches2022 = await this.getWorldCupMatches(2022);
    matched = matches2022.find(m => String(m.id) === idStr || String(m.id) === cleanId);
    if (matched) return matched;

    // 3. Fallback for openFootball slug patterns (year-match-ID)
    if (idStr.includes('-match-') || idStr.includes('-fallback-')) {
      const yearPart = parseInt(idStr.split('-')[0], 10);
      if (!isNaN(yearPart)) {
        const data = await openFootballService.getEditionData(yearPart);
        const match = data.matches.find(m => String(m.id) === idStr || String(m.id) === cleanId);
        if (match) return match as WCMatch;
      }
    }

    // 4. Scan all historical editions if still not found (only if NOT purely numeric ID)
    const isPurelyNumeric = /^\d+$/.test(cleanId);
    if (!isPurelyNumeric) {
      const editions = openFootballService.getEditions();
      for (const edition of editions) {
        if (edition.year === 2026 || edition.year === 2022) continue; // Already checked
        try {
          const matches = await this.getWorldCupMatches(edition.year);
          matched = matches.find(m => String(m.id) === idStr || String(m.id) === cleanId);
          if (matched) return matched;
        } catch (e) {
          console.warn(`Failed to scan matches for year ${edition.year}:`, e);
        }
      }
    }
    
    console.warn(`[worldCupService] Match ${matchId} not found in historical data.`);
    return null as any;
  }
};
