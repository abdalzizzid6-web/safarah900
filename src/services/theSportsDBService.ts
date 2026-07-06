import axios from 'axios';
import { League, Match } from '../types';
import { TeamDetail } from './teamMapper';
import { dataSourceService } from './dataSourceService';

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

// Get active API provider settings
export type ApiProvider = 'API-Football' | 'TheSportsDB';

export function getActiveApiProvider(): ApiProvider {
  if (typeof window !== 'undefined') {
    const provider = localStorage.getItem('Safara 90_api_provider');
    if (provider === 'TheSportsDB' || provider === 'API-Football') {
      return provider as ApiProvider;
    }
  }
  return 'API-Football';
}

export function setActiveApiProvider(provider: ApiProvider) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('Safara 90_api_provider', provider);
  }
}

export function getTheSportsDBApiKey(): string {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('Safara 90_thesportsdb_user_api_key');
    if (userKey) return userKey.trim();
  }
  return '123'; // Default key as requested
}

export function setTheSportsDBApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('Safara 90_thesportsdb_user_api_key', key);
  }
}

// In-memory cache for TheSportsDB to prevent redundant fetches
const theSportsDBCache = new Map<string, { data: any; expiry: number }>();

async function fetchWithCache(url: string, params: any = {}): Promise<any> {
  const settings = dataSourceService.getSettingsSync();
  const cacheEnabled = settings.cacheEnabled !== false;
  const cacheKey = `${url}_${JSON.stringify(params)}`;
  const now = Date.now();
  const cached = theSportsDBCache.get(cacheKey);
  
  if (cacheEnabled) {
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    // Also check localStorage
    try {
      const lsItem = localStorage.getItem(`sportsdb_cache_${cacheKey}`);
      if (lsItem) {
        const parsed = JSON.parse(lsItem);
        if (parsed && parsed.expiry > now) {
          theSportsDBCache.set(cacheKey, { data: parsed.data, expiry: parsed.expiry });
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('[TheSportsDB] Error reading localStorage cache:', e);
    }
  }

  try {
    const response = await axios.get(url, { params, timeout: 12000 });
    const data = response.data;
    
    // Cache the response
    if (cacheEnabled) {
      const customTtl = (settings.cacheTtlMinutes || 10) * 60 * 1000;
      const expiry = now + customTtl;
      theSportsDBCache.set(cacheKey, { data, expiry });
      try {
        localStorage.setItem(`sportsdb_cache_${cacheKey}`, JSON.stringify({ data, expiry }));
      } catch (e) {}
    }
    
    return data;
  } catch (error) {
    console.error(`[TheSportsDB] Error fetching API of url: ${url}`, error);
    // If request fails and we have a stale cache, return it
    if (cached) {
      console.warn('[TheSportsDB] Returning stale in-memory cache as fallback.');
      return cached.data;
    }
    try {
      const lsItem = localStorage.getItem(`sportsdb_cache_${cacheKey}`);
      if (lsItem) {
        const parsed = JSON.parse(lsItem);
        console.warn('[TheSportsDB] Returning stale localStorage cache as fallback.');
        return parsed.data;
      }
    } catch (e) {}
    throw error;
  }
}

export const theSportsDBService = {
  /**
   * 1. Get List of Leagues
   */
  async getLeagues(): Promise<League[]> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/all_leagues.php`;
    try {
      const data = await fetchWithCache(url);
      const rawLeagues = data.leagues || [];
      
      // Filter only soccer leagues
      const soccerLeagues = rawLeagues.filter((l: any) => 
        l.strSport?.toLowerCase() === 'soccer' || l.strSport?.toLowerCase() === 'football'
      );

      return soccerLeagues.map((l: any) => ({
        id: String(l.idLeague),
        name: l.strLeague || '',
        logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(l.strLeague || '')}&backgroundColor=0284c7`,
        country: l.strCountry || 'International',
        apiLeagueId: String(l.idLeague),
        apiSeason: new Date().getFullYear().toString()
      }));
    } catch (error) {
      console.error('[TheSportsDBService] Failed to fetch leagues:', error);
      return [];
    }
  },

  /**
   * 2. Get Matches of a League
   */
  async getLeagueMatches(leagueId: string, seasonYear?: string): Promise<Match[]> {
    const apiKey = getTheSportsDBApiKey();
    const season = seasonYear || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
    const url = `${BASE_URL}/${apiKey}/eventsseason.php`;
    
    try {
      // Fetch for current continuous/split seasons
      // Examples: 2024-2025, 2025-2026, or single year 2025
      const data = await fetchWithCache(url, { id: leagueId, s: season });
      const events = data.events || [];
      
      return events.map((e: any) => {
        const homeScore = e.intHomeScore !== null && e.intHomeScore !== undefined ? Number(e.intHomeScore) : undefined;
        const awayScore = e.intAwayScore !== null && e.intAwayScore !== undefined ? Number(e.intAwayScore) : undefined;
        const status = e.strStatus || 'FT';
        const isLive = ['Active', 'In Play', 'LIVE', '1H', '2H', 'HT'].includes(status);
        const startTimeStr = `${e.dateEvent || ''}T${e.strTime || '00:00:00'}`;

        const homeLogoUrl = `https://www.thesportsdb.com/images/media/team/badge/small/${e.idHomeTeam}.png`;
        const awayLogoUrl = `https://www.thesportsdb.com/images/media/team/badge/small/${e.idAwayTeam}.png`;

        return {
          id: String(e.idEvent),
          homeTeam: {
            id: String(e.idHomeTeam),
            name: e.strHomeTeam || '',
            logo: homeLogoUrl
          },
          awayTeam: {
            id: String(e.idAwayTeam),
            name: e.strAwayTeam || '',
            logo: awayLogoUrl
          },
          homeLogo: homeLogoUrl,
          awayLogo: awayLogoUrl,
          homeScore,
          awayScore,
          score: {
            home: homeScore !== undefined ? homeScore : null,
            away: awayScore !== undefined ? awayScore : null
          },
          status: status,
          isLive,
          minute: e.intTimeElapsed ? Number(e.intTimeElapsed) : undefined,
          league: e.strLeague || '',
          leagueLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.strLeague || '')}&backgroundColor=ea580c`,
          startTime: startTimeStr,
          utcDate: e.dateEvent ? `${e.dateEvent}T${e.strTime || '00:00:00'}Z` : undefined,
          stadium: e.strVenue || undefined,
          videoLink: e.strVideo || undefined,
          youtubeLink: e.strVideo || undefined,
          approved: true
        } as Match;
      });
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to fetch events for league: ${leagueId}`, error);
      return [];
    }
  },

  /**
   * 2b. Get Matches of Soccer by Date
   */
  async getLeagueMatchesByDate(date: string): Promise<Match[]> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/eventsday.php`;
    try {
      const data = await fetchWithCache(url, { d: date });
      const events = data.events || [];
      const soccerEvents = events.filter((e: any) => 
        e.strSport?.toLowerCase() === 'soccer' || e.strSport?.toLowerCase() === 'football'
      );
      
      return soccerEvents.map((e: any) => {
        const homeScore = e.intHomeScore !== null && e.intHomeScore !== undefined ? Number(e.intHomeScore) : undefined;
        const awayScore = e.intAwayScore !== null && e.intAwayScore !== undefined ? Number(e.intAwayScore) : undefined;
        const status = e.strStatus || 'FT';
        const isLive = ['Active', 'In Play', 'LIVE', '1H', '2H', 'HT'].includes(status);
        const startTimeStr = `${e.dateEvent || ''}T${e.strTime || '00:00:00'}`;

        const homeLogoUrl = `https://www.thesportsdb.com/images/media/team/badge/small/${e.idHomeTeam}.png`;
        const awayLogoUrl = `https://www.thesportsdb.com/images/media/team/badge/small/${e.idAwayTeam}.png`;

        return {
          id: String(e.idEvent),
          homeTeam: {
            id: String(e.idHomeTeam),
            name: e.strHomeTeam || '',
            logo: homeLogoUrl
          },
          awayTeam: {
            id: String(e.idAwayTeam),
            name: e.strAwayTeam || '',
            logo: awayLogoUrl
          },
          homeLogo: homeLogoUrl,
          awayLogo: awayLogoUrl,
          homeScore,
          awayScore,
          score: {
            home: homeScore !== undefined ? homeScore : null,
            away: awayScore !== undefined ? awayScore : null
          },
          status: status,
          isLive,
          minute: e.intTimeElapsed ? Number(e.intTimeElapsed) : undefined,
          league: e.strLeague || '',
          leagueLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.strLeague || '')}&backgroundColor=ea580c`,
          startTime: startTimeStr,
          utcDate: e.dateEvent ? `${e.dateEvent}T${e.strTime || '00:00:00'}Z` : undefined,
          stadium: e.strVenue || undefined,
          videoLink: e.strVideo || undefined,
          youtubeLink: e.strVideo || undefined,
          approved: true
        } as Match;
      });
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to fetch events by date: ${date}`, error);
      return [];
    }
  },

  /**
   * 3. Get Team Details
   */
  async getTeamDetails(teamId: string | number): Promise<TeamDetail> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/lookupteam.php`;
    
    try {
      const data = await fetchWithCache(url, { id: String(teamId) });
      const team = data.teams?.[0];
      if (!team) {
        throw new Error('Team not found in TheSportsDB');
      }

      return {
        id: String(team.idTeam),
        name: team.strTeam || '',
        logo: team.strTeamBadge || team.strTeamLogo || '',
        code: team.strTeamShort || undefined,
        country: team.strCountry || undefined,
        founded: team.intFormedYear ? Number(team.intFormedYear) : undefined,
        venueName: team.strStadium || undefined,
        venueCity: team.strStadiumLocation || undefined,
        venueCapacity: team.intStadiumCapacity ? Number(team.intStadiumCapacity) : undefined,
        venueImage: team.strStadiumThumb || undefined
      };
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to get team details for team: ${teamId}`, error);
      throw error;
    }
  },

  /**
   * 4. Get Team Players
   */
  async getTeamPlayers(teamId: string | number): Promise<any[]> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/lookup_all_players.php`;
    
    try {
      const data = await fetchWithCache(url, { id: String(teamId) });
      const rawPlayers = data.player || data.players || [];
      
      return rawPlayers.map((p: any) => ({
        id: String(p.idPlayer),
        name: p.strPlayer || '',
        number: p.strNumber ? Number(p.strNumber) : undefined,
        position: p.strPosition || 'لاعب',
        photo: p.strCutout || p.strThumb || '',
        age: p.dateBorn ? (new Date().getFullYear() - new Date(p.dateBorn).getFullYear()) : undefined
      }));
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to fetch players for teamId: ${teamId}`, error);
      return [];
    }
  },

  /**
   * 5. Search Teams
   */
  async searchTeams(query: string): Promise<TeamDetail[]> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/searchteams.php`;
    
    try {
      const data = await fetchWithCache(url, { t: query });
      const rawTeams = data.teams || [];
      
      return rawTeams.map((team: any) => ({
        id: String(team.idTeam),
        name: team.strTeam || '',
        logo: team.strTeamBadge || team.strTeamLogo || '',
        code: team.strTeamShort || undefined,
        country: team.strCountry || undefined,
        founded: team.intFormedYear ? Number(team.intFormedYear) : undefined,
        venueName: team.strStadium || undefined,
        venueCity: team.strStadiumLocation || undefined,
        venueCapacity: team.intStadiumCapacity ? Number(team.intStadiumCapacity) : undefined,
        venueImage: team.strStadiumThumb || undefined
      }));
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to search teams with query: ${query}`, error);
      return [];
    }
  },

  /**
   * 6. Lookup Player Details
   */
  async getPlayerDetails(playerId: string | number): Promise<any> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/lookupplayer.php`;
    try {
      const data = await fetchWithCache(url, { id: String(playerId) });
      const p = data.players?.[0] || data.player?.[0];
      if (!p) {
        throw new Error('Player not found in TheSportsDB');
      }
      return {
        id: String(p.idPlayer),
        name: p.strPlayer || '',
        firstName: p.strPlayer ? p.strPlayer.split(' ')[0] : undefined,
        lastName: p.strPlayer ? p.strPlayer.split(' ').slice(1).join(' ') : undefined,
        age: p.dateBorn ? (new Date().getFullYear() - new Date(p.dateBorn).getFullYear()) : undefined,
        nationality: p.strNationality || undefined,
        height: p.strHeight || undefined,
        weight: p.strWeight || undefined,
        photo: p.strCutout || p.strThumb || undefined,
        injured: p.strCondition === 'Injured',
        teamId: p.idTeam ? String(p.idTeam) : undefined,
        teamName: p.strTeam || undefined,
        position: p.strPosition || undefined,
        goals: 0,
        assists: 0
      };
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to lookup player: ${playerId}`, error);
      throw error;
    }
  },

  /**
   * 7. Lookup Match Details
   */
  async getMatchDetails(id: string): Promise<Match | null> {
    const apiKey = getTheSportsDBApiKey();
    const url = `${BASE_URL}/${apiKey}/lookupevent.php`;
    try {
      const data = await fetchWithCache(url, { id: String(id) });
      const e = data.events?.[0];
      if (!e) return null;

      const homeScore = e.intHomeScore !== null && e.intHomeScore !== undefined ? Number(e.intHomeScore) : undefined;
      const awayScore = e.intAwayScore !== null && e.intAwayScore !== undefined ? Number(e.intAwayScore) : undefined;
      const status = e.strStatus || 'FT';
      const isLive = ['Active', 'In Play', 'LIVE', '1H', '2H', 'HT'].includes(status);
      const startTimeStr = `${e.dateEvent || ''}T${e.strTime || '00:00:00'}`;

      const homeLogoUrl = `https://www.thesportsdb.com/images/media/team/badge/small/${e.idHomeTeam}.png`;
      const awayLogoUrl = `https://www.thesportsdb.com/images/media/team/badge/small/${e.idAwayTeam}.png`;

      return {
        id: String(e.idEvent),
        homeTeam: {
          id: String(e.idHomeTeam),
          name: e.strHomeTeam || '',
          logo: homeLogoUrl
        },
        awayTeam: {
          id: String(e.idAwayTeam),
          name: e.strAwayTeam || '',
          logo: awayLogoUrl
        },
        homeLogo: homeLogoUrl,
        awayLogo: awayLogoUrl,
        homeScore,
        awayScore,
        score: {
          home: homeScore !== undefined ? homeScore : null,
          away: awayScore !== undefined ? awayScore : null
        },
        status: status,
        isLive,
        minute: e.intTimeElapsed ? Number(e.intTimeElapsed) : undefined,
        league: e.strLeague || '',
        leagueLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(e.strLeague || '')}&backgroundColor=ea580c`,
        startTime: startTimeStr,
        utcDate: e.dateEvent ? `${e.dateEvent}T${e.strTime || '00:00:00'}Z` : undefined,
        stadium: e.strVenue || undefined,
        videoLink: e.strVideo || undefined,
        youtubeLink: e.strVideo || undefined,
        approved: true
      } as Match;
    } catch (error) {
      console.error(`[TheSportsDBService] Failed to lookup event: ${id}`, error);
      return null;
    }
  }
};
