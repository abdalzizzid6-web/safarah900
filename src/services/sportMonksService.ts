import axios from 'axios';
import { League, Match } from '../types';
import { TeamDetail } from './teamMapper';
import { PlayerDetail } from './playerMapper';
import { dataSourceService } from './dataSourceService';

const BASE_URL = 'https://api.sportmonks.com/v3';

function getApiKey(): string {
  const settings = dataSourceService.getSettingsSync();
  const key = settings.sportMonksKey;
  if (!key) {
    throw new Error('NO_API_KEY: الرجاء إدخال مفتاح API لـ SportMonks للاتصال.');
  }
  return key.trim();
}

/**
 * Standard utility for SportMonks V3 requests
 */
async function fetchSportMonks(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const token = getApiKey();
  const queryParams = new URLSearchParams({
    api_token: token,
    ...params
  });
  const url = `${BASE_URL}/${endpoint}?${queryParams.toString()}`;
  const response = await axios.get(url);
  return response.data;
}

export const sportMonksService = {
  /**
   * Fetch Active Leagues from SportMonks
   */
  async getLeagues(): Promise<League[]> {
    try {
      const data = await fetchSportMonks('football/leagues', { include: 'country' });
      const rawLeagues = data?.data || [];
      return rawLeagues.map((item: any) => ({
        id: String(item.id || ''),
        name: item.name || '',
        logo: item.image_path || '',
        country: item.country?.name || 'العالم',
        apiLeagueId: item.id,
        apiSeason: item.active_season_id
      }));
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load leagues:', err);
      throw new Error(`SportMonks Leagues Error: ${err.message || err}`);
    }
  },

  /**
   * Get Matches (fixtures) for date
   */
  async getLeagueMatchesByDate(dateStr: string): Promise<Match[]> {
    try {
      // dateStr format: YYYY-MM-DD
      const data = await fetchSportMonks(`football/fixtures/date/${dateStr}`, {
        include: 'participants;scores;state;league'
      });
      const rawFixtures = data?.data || [];
      return rawFixtures.map((item: any) => this.mapFixtureToMatch(item));
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load fixtures for date:', err);
      throw new Error(`SportMonks Fixtures Error: ${err.message || err}`);
    }
  },

  /**
   * Get Live Matches
   */
  async getLiveMatches(): Promise<Match[]> {
    try {
      const data = await fetchSportMonks('football/livescores', {
        include: 'participants;scores;state;league'
      });
      const rawFixtures = data?.data || [];
      return rawFixtures.map((item: any) => this.mapFixtureToMatch(item));
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load live matches:', err);
      throw new Error(`SportMonks Live Error: ${err.message || err}`);
    }
  },

  /**
   * Get Specific Match Details
   */
  async getMatchDetails(matchId: string): Promise<Match | null> {
    try {
      const data = await fetchSportMonks(`football/fixtures/${matchId}`, {
        include: 'participants;scores;state;league;events;statistics;lineups.player'
      });
      const rawFixture = data?.data;
      if (!rawFixture) return null;
      return this.mapFixtureToMatch(rawFixture);
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load fixture details:', err);
      throw new Error(`SportMonks Fixture Detail Error: ${err.message || err}`);
    }
  },

  /**
   * Fetch Team Details
   */
  async getTeamDetails(teamId: string): Promise<TeamDetail> {
    try {
      const data = await fetchSportMonks(`football/teams/${teamId}`, {
        include: 'venue'
      });
      const rawTeam = data?.data;
      if (!rawTeam) {
        throw new Error('لم يتم العثور على الفريق المطلوب.');
      }
      return {
        id: String(rawTeam.id || ''),
        name: rawTeam.name || '',
        logo: rawTeam.image_path || '',
        founded: rawTeam.founded || undefined,
        venueName: rawTeam.venue?.name || undefined,
        venueCity: rawTeam.venue?.city || undefined,
        venueCapacity: rawTeam.venue?.capacity || undefined,
        venueImage: rawTeam.venue?.image_path || undefined,
        country: 'العالم'
      };
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load team detail:', err);
      throw new Error(`SportMonks Team Detail Error: ${err.message || err}`);
    }
  },

  /**
   * Fetch Team Players
   */
  async getTeamPlayers(teamId: string): Promise<any[]> {
    try {
      const data = await fetchSportMonks(`football/teams/${teamId}`, {
        include: 'squad.player'
      });
      const rawSquad = data?.data?.squad || [];
      return rawSquad.map((item: any) => ({
        id: String(item.player?.id || ''),
        name: item.player?.display_name || item.player?.common_name || 'لاعب',
        number: item.jersey_number || undefined,
        position: item.position_id === 1 ? 'חارس مرمى' : 'لاعب',
        photo: item.player?.image_path || '',
        age: item.player?.date_of_birth ? new Date().getFullYear() - new Date(item.player.date_of_birth).getFullYear() : undefined
      }));
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load team squads:', err);
      return [];
    }
  },

  /**
   * Fetch Player Details
   */
  async getPlayerDetails(playerId: string): Promise<PlayerDetail> {
    try {
      const data = await fetchSportMonks(`football/players/${playerId}`, {
        include: 'teams'
      });
      const rawPlayer = data?.data;
      if (!rawPlayer) {
        throw new Error('لم يتم العثور على اللاعب المطلوبة.');
      }
      return {
        id: String(rawPlayer.id || ''),
        name: rawPlayer.display_name || rawPlayer.common_name || '',
        firstName: rawPlayer.firstname || '',
        lastName: rawPlayer.lastname || '',
        age: rawPlayer.date_of_birth ? new Date().getFullYear() - new Date(rawPlayer.date_of_birth).getFullYear() : 0,
        nationality: rawPlayer.nationality?.name || 'العالم',
        height: rawPlayer.height || '',
        weight: rawPlayer.weight || '',
        photo: rawPlayer.image_path || '',
        teamName: rawPlayer.teams?.[0]?.name || 'غير معروف',
        teamLogo: rawPlayer.teams?.[0]?.image_path || '',
        position: 'لاعب'
      };
    } catch (err: any) {
      console.error('[sportMonksService] Failed to load player details:', err);
      throw new Error(`SportMonks Player Detail Error: ${err.message || err}`);
    }
  },

  /**
   * Get Standings
   */
  async getStandings(leagueId: string): Promise<any[]> {
    try {
      // Fetch standings for specific active league
      const data = await fetchSportMonks(`football/standings/leagues/${leagueId}`);
      const rawStandings = data?.data || [];
      // Flatten or map
      return rawStandings.map((row: any) => ({
        rank: row.position,
        teamId: String(row.participant_id),
        teamName: row.team?.name || '',
        teamLogo: row.team?.image_path || '',
        points: row.points,
        played: row.overall?.played || 0,
        goalsFor: row.overall?.goals_for || 0,
        goalsAgainst: row.overall?.goals_against || 0,
        goalsDiff: (row.overall?.goals_for || 0) - (row.overall?.goals_against || 0)
      }));
    } catch (err) {
      console.error('[sportMonksService] Failed to fetch standings:', err);
      return [];
    }
  },

  /**
   * Helper: Mapper parser to match standards
   */
  mapFixtureToMatch(item: any): Match {
    const rawParticipants = item.participants || [];
    const homeRaw = rawParticipants.find((p: any) => p.meta?.location === 'home') || rawParticipants[0] || {};
    const awayRaw = rawParticipants.find((p: any) => p.meta?.location === 'away') || rawParticipants[1] || {};

    const rawScores = item.scores || [];
    const homeScoreRaw = rawScores.find((s: any) => s.participant_id === homeRaw.id && s.description === 'CURRENT');
    const awayScoreRaw = rawScores.find((s: any) => s.participant_id === awayRaw.id && s.description === 'CURRENT');

    const homeScore = homeScoreRaw ? parseInt(homeScoreRaw.score?.goals || '0') : 0;
    const awayScore = awayScoreRaw ? parseInt(awayScoreRaw.score?.goals || '0') : 0;

    const isLive = item.state?.state === 'LIVE' || item.state?.key === 'LIVE' || item.state?.id === 3;
    const isFinished = item.state?.key === 'FT' || item.state?.key === 'FINISHED' || item.state?.id === 5;

    let statusString = 'UPCOMING';
    if (isLive) statusString = 'LIVE';
    if (isFinished) statusString = 'FINISHED';

    const matchDate = item.starting_at || item.starting_at_timestamp;

    const mapped: Match = {
      id: `smc-${item.id}`,
      homeTeam: {
        id: String(homeRaw.id || ''),
        name: homeRaw.name || '',
        logo: homeRaw.image_path || ''
      },
      awayTeam: {
        id: String(awayRaw.id || ''),
        name: awayRaw.name || '',
        logo: awayRaw.image_path || ''
      },
      score: {
        home: homeScore,
        away: awayScore
      },
      status: {
        long: item.state?.name || '',
        short: item.state?.short_name || '',
        elapsed: item.state?.elapsed || null,
        extra: null
      },
      league: {
        id: String(item.league?.id || ''),
        name: item.league?.name || '',
        country: 'العالم',
        logo: item.league?.image_path || ''
      },
      utcDate: matchDate ? new Date(matchDate).toISOString() : new Date().toISOString(),
      isLive,
      minute: item.state?.elapsed || undefined,

      // Fallbacks
      homeLogo: homeRaw.image_path || '',
      awayLogo: awayRaw.image_path || '',
      homeScore,
      awayScore,
      leagueLogo: item.league?.image_path || '',
      startTime: matchDate ? new Date(matchDate).toISOString() : new Date().toISOString()
    };

    return mapped;
  }
};
