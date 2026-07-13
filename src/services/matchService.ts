import { matchesRepositoryV2 } from '../core/repository/MatchesRepositoryV2';
import { Match, MatchEvent, MatchStat, TeamLineup } from '../types';

export const logMatchAction = async (action: string, matchId: string, details: Record<string, unknown>) => {
  return matchesRepositoryV2.logAction({
    action: action as any,
    matchId,
    details: JSON.stringify(details),
    userId: 'system',
    userName: 'System'
  });
};

export const matchService = {
  subscribeToAllMatches: (id: string, callback: (matches: Match[]) => void) => matchesRepositoryV2.subscribeToMatches(callback),
  unsubscribeAll: () => {}, 
  mapFirestoreMatch: (id: string, data: any) => matchesRepositoryV2.mapFirestoreMatch(id, data),
  getRealFirestoreMatches: (filters: { date?: string } = {}) => matchesRepositoryV2.getMatches(filters),
  getManualFirestoreMatches: () => matchesRepositoryV2.getMatches(),
  getLiveMatches: () => matchesRepositoryV2.getLiveMatches(),
  getFixtures: (filters: { date?: string; leagueId?: string; season?: string } = {}) => matchesRepositoryV2.getFixtures(filters),
  clearManualCache: () => {},
  getMatchDetails: (id: string) => matchesRepositoryV2.getMatch(id),
  getEvents: (id: string) => matchesRepositoryV2.getEvents(id),
  getStatistics: (id: string) => matchesRepositoryV2.getStatistics(id),
  getLineups: (id: string) => matchesRepositoryV2.getLineups(id),
  getHeadToHead: (homeId: string, awayId: string) => matchesRepositoryV2.getHeadToHead(homeId, awayId),
  getResults: () => matchesRepositoryV2.getResults(),
  getStandings: (leagueId?: string) => matchesRepositoryV2.getStandings(leagueId),
  getLeagueMatches: (leagueId: string) => matchesRepositoryV2.getLeagueMatches(leagueId),
  getTeamMatches: (teamId: string) => matchesRepositoryV2.getTeamMatches(teamId),
  getAllMatches: () => matchesRepositoryV2.getMatches(),

  // Keep complex business logic
  fetchFullMatchDetails: async (id: string | number) => {
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
};
