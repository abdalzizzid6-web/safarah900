import { matchesRepositoryV2 } from '../core/repository/MatchesRepositoryV2';
import { Match, MatchEvent, MatchStat, TeamLineup } from '../types';

export const logMatchAction = async (action: string, matchId: string, details: Record<string, unknown>) => {
  return matchesRepositoryV2.logAction({
    action: action as any,
    matchId,
    details: JSON.stringify(details),
    userId: 'system', // Default if not provided
    userName: 'System'
  });
};

export const matchService = {
  subscribeToAllMatches(id: string, callback: (matches: Match[]) => void) {
    return matchesRepositoryV2.subscribeToMatches(callback);
  },
  
  unsubscribeAll() {
    // Repository V2 handles subscriptions via individual listeners if needed, 
    // or through React Query which manages its own lifecycle.
    return;
  },

  mapFirestoreMatch(id: string, data: any): Match {
    return matchesRepositoryV2.mapFirestoreMatch(id, data) as Match;
  },

  async getRealFirestoreMatches(
    filters: { date?: string } = {}
  ): Promise<Match[]> {
    return matchesRepositoryV2.getMatches(filters);
  },

  async getManualFirestoreMatches(): Promise<Match[]> {
    return matchesRepositoryV2.getMatches();
  },

  async getLiveMatches(): Promise<Match[]> {
    return matchesRepositoryV2.getLiveMatches();
  },

  async getFixtures(filters: { date?: string; leagueId?: string; season?: string } = {}): Promise<Match[]> {
    return matchesRepositoryV2.getFixtures(filters);
  },

  clearManualCache() {
    // Cache management is handled by React Query
  },

  async getMatchDetails(id: string): Promise<Match | null> {
    return matchesRepositoryV2.getMatch(id);
  },
  
  async getEvents(id: string): Promise<MatchEvent[]> {
    return matchesRepositoryV2.getEvents(id);
  },
  
  async getStatistics(id: string): Promise<MatchStat[]> {
    return matchesRepositoryV2.getStatistics(id);
  },
  
  async getLineups(id: string): Promise<TeamLineup[]> {
    return matchesRepositoryV2.getLineups(id);
  },
  
  async getHeadToHead(homeId: string, awayId: string): Promise<Match[]> {
    return matchesRepositoryV2.getHeadToHead(homeId, awayId);
  },
  
  async getResults(): Promise<Match[]> {
    return matchesRepositoryV2.getResults();
  },

  async getStandings(leagueId?: string): Promise<any[]> {
    return matchesRepositoryV2.getStandings(leagueId);
  },

  async getLeagueMatches(leagueId: string): Promise<Match[]> {
    return matchesRepositoryV2.getLeagueMatches(leagueId);
  },

  async getTeamMatches(teamId: string): Promise<Match[]> {
    return matchesRepositoryV2.getTeamMatches(teamId);
  },
  
  async getAllMatches(): Promise<Match[]> {
    return matchesRepositoryV2.getMatches();
  }
};

export async function fetchFullMatchDetails(id: string | number) {
  try {
    const stringId = String(id);
    const [details, events, stats, lineups] = await Promise.all([
      matchesRepositoryV2.getMatch(stringId),
      matchesRepositoryV2.getEvents(stringId),
      matchesRepositoryV2.getStatistics(stringId),
      matchesRepositoryV2.getLineups(stringId)
    ]);

    return {
      header: {
        homeTeam: typeof details?.homeTeam === 'object' ? details.homeTeam.name : (details?.homeTeam || ''),
        awayTeam: typeof details?.awayTeam === 'object' ? details.awayTeam.name : (details?.awayTeam || ''),
        homeLogo: typeof details?.homeTeam === 'object' ? details.homeTeam.logo : (details?.homeLogo || ''),
        awayLogo: typeof details?.awayTeam === 'object' ? details.awayTeam.logo : (details?.awayLogo || ''),
        homeGoals: details?.score?.home ?? null,
        awayGoals: details?.score?.away ?? null,
        league: typeof details?.league === 'object' ? details.league.name : details?.league,
        status: typeof details?.status === 'object' ? details.status.short : details?.status,
        elapsedTime: typeof details?.status === 'object' ? details.status.elapsed : null
      },
      timeline: events.map(e => ({
        minute: e.time?.extra ? `${e.time.elapsed}+${e.time.extra}` : `${e.time?.elapsed || ''}`,
        type: e.type,
        player: e.player?.name || '',
        team: e.team?.name || '',
        detail: e.detail
      })),
      stats: stats.map(s => ({
        label: s.type,
        home: s.home,
        away: s.away
      })),
      lineups: lineups.map(l => ({
        team: l.team?.name || '',
        logo: l.team?.logo || '',
        formation: l.formation,
        startingXI: (l.startXI || []).map(x => ({
          name: x.player?.name || '',
          number: x.player?.number || 0,
          position: x.player?.pos || ''
        })),
        bench: (l.substitutes || []).map(s => ({
          name: s.player?.name || '',
          number: s.player?.number || 0,
          position: s.player?.pos || ''
        })),
        coach: l.coach?.name || ''
      }))
    };
  } catch (error) {
    console.error('[MatchesRepositoryV2] fetchFullMatchDetails error:', error);
    throw error;
  }
}
