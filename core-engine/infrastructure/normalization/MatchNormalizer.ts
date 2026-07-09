import { Match } from '../../domain/entities/Match';

export class MatchNormalizer {
  normalize(data: any): Match {
    try {
      if (!data) {
        throw new Error("MatchNormalizer received null or undefined data");
      }

      // Safe extraction helper variables
      const fixture = data.fixture ?? {};
      const league = data.league ?? {};
      const teams = data.teams ?? {};
      const goals = data.goals ?? {};
      const score = data.score ?? {};
      const status = fixture.status ?? {};

      // Handle ID & Provider ID
      let idStr = '';
      if (data.id !== undefined && data.id !== null) {
        idStr = data.id.toString();
      } else if (fixture.id !== undefined && fixture.id !== null) {
        idStr = fixture.id.toString();
      } else {
        idStr = 'unknown-' + Math.random().toString(36).substr(2, 9);
        console.warn(`[Forensic] Missing match ID, generated temporary ID: ${idStr}`);
      }

      // Safe parse Date / KickoffTime
      let kickoffTimeObj: Date;
      try {
        if (fixture.date) {
          kickoffTimeObj = new Date(fixture.date);
        } else if (data.startTime) {
          if (data.startTime._seconds !== undefined) {
            kickoffTimeObj = new Date(data.startTime._seconds * 1000);
          } else {
            kickoffTimeObj = new Date(data.startTime);
          }
        } else if (data.utcDate) {
          if (data.utcDate._seconds !== undefined) {
            kickoffTimeObj = new Date(data.utcDate._seconds * 1000);
          } else {
            kickoffTimeObj = new Date(data.utcDate);
          }
        } else {
          kickoffTimeObj = new Date();
        }
        
        if (isNaN(kickoffTimeObj.getTime())) {
          kickoffTimeObj = new Date();
        }
      } catch (e) {
        kickoffTimeObj = new Date();
        console.warn(`[Forensic] Failed to parse kickoff date, using current date.`, e);
      }

      // Safe Team mappings
      const rawHome = teams.home ?? data.homeTeam ?? {};
      const rawAway = teams.away ?? data.awayTeam ?? {};

      const homeTeam = {
        id: (rawHome.id ?? data.homeId ?? '').toString(),
        name: rawHome.name ?? data.homeName ?? 'Home Team',
        logo: rawHome.logo ?? data.homeLogo ?? ''
      };

      const awayTeam = {
        id: (rawAway.id ?? data.awayId ?? '').toString(),
        name: rawAway.name ?? data.awayName ?? 'Away Team',
        logo: rawAway.logo ?? data.awayLogo ?? ''
      };

      // Goals and Score Mapping
      const homeScoreNum = Number(goals.home ?? data.homeScore ?? score.home ?? 0);
      const awayScoreNum = Number(goals.away ?? data.awayScore ?? score.away ?? 0);

      const halftimeMap = {
        home: Number(score.halftime?.home ?? data.halftime?.home ?? 0),
        away: Number(score.halftime?.away ?? data.halftime?.away ?? 0)
      };

      const fulltimeMap = {
        home: Number(score.fulltime?.home ?? data.fulltime?.home ?? 0),
        away: Number(score.fulltime?.away ?? data.fulltime?.away ?? 0)
      };

      const penaltiesMap = (score.penalty || data.penalties) ? {
        home: Number(score.penalty?.home ?? data.penalties?.home ?? 0),
        away: Number(score.penalty?.away ?? data.penalties?.away ?? 0)
      } : null;

      // League handling
      let leagueName = 'Unknown League';
      if (typeof league === 'string') {
        leagueName = league;
      } else if (league.name) {
        leagueName = league.name;
      } else if (data.leagueName) {
        leagueName = data.leagueName;
      }

      const match: Match = {
        id: idStr,
        providerId: idStr,
        provider: data.provider ?? 'api-football',
        league: leagueName,
        season: (league.season ?? data.season ?? new Date().getFullYear()).toString(),
        round: league.round ?? data.round ?? data.stage ?? 'Regular Season',
        stage: league.round ?? data.stage ?? data.round ?? 'Regular Season',
        status: status.short ?? data.status ?? 'SCHEDULED',
        kickoffTime: kickoffTimeObj,
        timestamp: fixture.timestamp ?? data.timestamp ?? Math.floor(kickoffTimeObj.getTime() / 1000),
        timezone: fixture.timezone ?? data.timezone ?? 'UTC',
        elapsed: Number(status.elapsed ?? data.elapsed ?? 0),
        homeTeam,
        awayTeam,
        homeScore: homeScoreNum,
        awayScore: awayScoreNum,
        halftime: halftimeMap,
        fulltime: fulltimeMap,
        penalties: penaltiesMap,
        venue: fixture.venue?.name ?? data.venue ?? 'Unknown Venue',
        referee: fixture.referee ?? data.referee ?? '',
        events: data.events ?? [],
        statistics: data.statistics ?? [],
        lineups: data.lineups ?? [],
        coaches: { 
          home: data.coaches?.home ?? '', 
          away: data.coaches?.away ?? '' 
        },
        formations: { 
          home: data.formations?.home ?? '', 
          away: data.formations?.away ?? '' 
        },
        injuries: data.injuries ?? [],
        cards: data.cards ?? [],
        substitutions: data.substitutions ?? [],
        odds: data.odds ?? null,
        broadcasters: data.broadcasters ?? [],
        lastUpdated: new Date(),
        cacheUntil: new Date(Date.now() + 60000)
      };

      console.log(`[Forensic] MatchNormalizer normalized: ${match.id} (${match.homeTeam.name} vs ${match.awayTeam.name})`);
      return match;
    } catch (e: any) {
      console.warn(`[Forensic] MatchNormalizer caught an exception during normalization. Returning safe fallback match to prevent data loss. Error: ${e.message}`);
      
      const fallbackId = (data && (data.id || data.fixture?.id)) ? (data.id || data.fixture?.id).toString() : 'fallback-' + Math.random().toString(36).substr(2, 9);
      const fallbackMatch: Match = {
        id: fallbackId,
        providerId: fallbackId,
        provider: data?.provider ?? 'api-football',
        league: (typeof data?.league === 'string' ? data.league : data?.league?.name) ?? data?.leagueName ?? 'Unknown League',
        season: (data?.league?.season ?? data?.season ?? new Date().getFullYear()).toString(),
        round: data?.league?.round ?? data?.round ?? 'Regular Season',
        stage: data?.league?.round ?? data?.stage ?? 'Regular Season',
        status: data?.fixture?.status?.short ?? data?.status ?? 'SCHEDULED',
        kickoffTime: new Date(),
        timestamp: Math.floor(Date.now() / 1000),
        timezone: 'UTC',
        elapsed: 0,
        homeTeam: {
          id: (data?.teams?.home?.id ?? data?.homeTeam?.id ?? '').toString(),
          name: data?.teams?.home?.name ?? data?.homeTeam?.name ?? data?.homeName ?? 'Home Team',
          logo: data?.teams?.home?.logo ?? data?.homeTeam?.logo ?? ''
        },
        awayTeam: {
          id: (data?.teams?.away?.id ?? data?.awayTeam?.id ?? '').toString(),
          name: data?.teams?.away?.name ?? data?.awayTeam?.name ?? data?.awayName ?? 'Away Team',
          logo: data?.teams?.away?.logo ?? data?.awayTeam?.logo ?? ''
        },
        homeScore: Number(data?.goals?.home ?? data?.homeScore ?? 0),
        awayScore: Number(data?.goals?.away ?? data?.awayScore ?? 0),
        halftime: { home: 0, away: 0 },
        fulltime: { home: 0, away: 0 },
        penalties: null,
        venue: data?.fixture?.venue?.name ?? data?.venue ?? 'Unknown Venue',
        referee: data?.fixture?.referee ?? data?.referee ?? '',
        events: data?.events ?? [],
        statistics: data?.statistics ?? [],
        lineups: data?.lineups ?? [],
        coaches: { home: '', away: '' },
        formations: { home: '', away: '' },
        injuries: [],
        cards: [],
        substitutions: [],
        odds: null,
        broadcasters: [],
        lastUpdated: new Date(),
        cacheUntil: new Date(Date.now() + 60000)
      };
      
      return fallbackMatch;
    }
  }
}
