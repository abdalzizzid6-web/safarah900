import { Match, MatchEvent, MatchStat, TeamLineup } from '../../types';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { theSportsDBService } from '../../services/theSportsDBService';
import { dataSourceService } from '../../services/dataSourceService';
import { sportMonksService } from '../../services/sportMonksService';
import { mapRawEvents, mapRawStats, mapRawLineups, mapRawMatches } from '../../services/matchMapper';
import { getIdFromSlug } from '../../utils/slugify';
import * as matchRepository from '../../features/match-details/repositories/matchRepository';

// Debug Log System
export const logMatchAction = async (action: string, matchId: string, details: Record<string, unknown>) => {
  try {
    const sanitizedDetails = Object.entries(details).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    await addDoc(collection(db, 'match_logs'), {
      action,
      matchId,
      details: sanitizedDetails,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error('[matchService] Log error:', e);
  }
};

// Simplified Cache & Pending Tracker
interface CacheEntry<T> { data: T, timestamp: number }
const pending = new Map<string, Promise<unknown>>();

export const matchService = {
  subscribeToAllMatches(id: string, callback: (matches: Match[]) => void) {
    return matchRepository.subscribeToMatches(callback);
  },
  
  unsubscribeAll() {
      // Repositories handle subscriptions directly.
  },

  mapFirestoreMatch(id: string, data: any): Match {
    return matchRepository.mapFirestoreMatch(id, data);
  },

  async getRealFirestoreMatches(
    filters: { date?: string } = {},
    lastDoc: any = null,
    onCursor?: (doc: any | null) => void
  ): Promise<Match[]> {
    return matchRepository.getMatches(); 
  },

  async getManualFirestoreMatches(): Promise<Match[]> {
    return matchRepository.getMatches();
  },

  async getLiveMatches(): Promise<Match[]> {
    const matches = await matchRepository.getMatches();
    return matches.filter(m => m.isLive);
  },

  async getFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}): Promise<Match[]> {
    const matches = await matchRepository.getMatches();
    if (filters.date) {
      return matches.filter(m => {
        const d = String(m.startTime || m.utcDate || '');
        return d.includes(filters.date!);
      });
    }
    return matches;
  },

  clearManualCache() {
    // No-op in unified Firestore model
  },

  async getMatchDetails(id: string): Promise<Match | null> {
    return matchRepository.fetchMatch(id);
  },
  
  async getEvents(id: string): Promise<MatchEvent[]> {
    const settings = dataSourceService.getSettingsSync();
    if (settings.matchProvider === 'SportMonks') {
      try {
        const found = await sportMonksService.getMatchDetails(id);
        return found?.events || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  },
  
  // ... (need to implement/restore other API methods here, 
  // keeping them for now as they are API-based, but need to ensure the file builds)
  
  async getStatistics(id: string): Promise<MatchStat[]> {
    return [];
  },
  
  async getLineups(id: string): Promise<TeamLineup[]> {
    return [];
  },
  
  async getHeadToHead(homeId: string, awayId: string): Promise<Match[]> {
    return [];
  },
  
  async getResults(): Promise<Match[]> {
    const matches = await matchRepository.getMatches();
    return matches.filter(m => m.status === 'FT' || m.status === 'AET' || m.status === 'PEN' || (m.status as any)?.short === 'FT');
  },

  async getStandings(leagueId?: string): Promise<any[]> {
    return [];
  },

  async getLeagueMatches(leagueId: string): Promise<Match[]> {
    const matches = await matchRepository.getMatches();
    return matches.filter(m => (m as any).leagueId === leagueId || (typeof m.league === 'object' && (m.league as any)?.id === leagueId));
  },

  async getTeamMatches(teamId: string): Promise<Match[]> {
    const matches = await matchRepository.getMatches();
    return matches.filter(m => (m as any).homeTeamId === teamId || (m as any).awayTeamId === teamId);
  },
  
  async getAllMatches(): Promise<Match[]> {
    return matchRepository.getMatches();
  }
};

// Deprecated alias compatibility
export async function fetchFullMatchDetails(id: string | number) {
  try {
    const stringId = String(id);
    const [details, events, stats, lineups] = await Promise.all([
      matchService.getMatchDetails(stringId),
      matchService.getEvents(stringId),
      matchService.getStatistics(stringId),
      matchService.getLineups(stringId)
    ]);

    return {
      header: {
        homeTeam: details?.homeTeam || '',
        awayTeam: details?.awayTeam || '',
        homeLogo: details?.homeLogo || '',
        awayLogo: details?.awayLogo || '',
        homeGoals: details?.score?.home ?? null,
        awayGoals: details?.score?.away ?? null,
        league: typeof details?.league === 'object' ? details.league.name : details?.league,
        status: typeof details?.status === 'object' ? details.status.short : details?.status,
        elapsedTime: typeof details?.status === 'object' ? details.status.elapsed : null
      },
      timeline: events.map(e => ({
        minute: e.time.extra ? `${e.time.elapsed}+${e.time.extra}` : `${e.time.elapsed}`,
        type: e.type,
        player: e.player.name,
        team: e.team.name,
        detail: e.detail
      })),
      stats: stats.map(s => ({
        label: s.type,
        home: s.home,
        away: s.away
      })),
      lineups: lineups.map(l => ({
        team: l.team.name,
        logo: l.team.logo,
        formation: l.formation,
        startingXI: l.startXI.map(x => ({
          name: x.player.name,
          number: x.player.number,
          position: x.player.pos
        })),
        bench: l.substitutes.map(s => ({
          name: s.player.name,
          number: s.player.number,
          position: s.player.pos
        })),
        coach: l.coach.name
      }))
    };
  } catch (error) {
    console.error('fetchFullMatchDetails error:', error);
    throw error;
  }
}
