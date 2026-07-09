import { Match } from '../../domain/entities/Match';

export class MatchNormalizer {
  normalize(data: any): Match {
    try {
      const match = {
        id: data.fixture.id.toString(),
        providerId: data.fixture.id.toString(),
        provider: data.provider || 'api-football',
        league: data.league.name,
        season: data.league.season.toString(),
        round: data.league.round,
        stage: data.league.round,
        status: data.fixture.status.short,
        kickoffTime: new Date(data.fixture.date),
        timestamp: data.fixture.timestamp,
        timezone: data.fixture.timezone,
        elapsed: data.fixture.status.elapsed || 0,
        homeTeam: { 
          id: data.teams.home.id.toString(), 
          name: data.teams.home.name, 
          logo: data.teams.home.logo 
        },
        awayTeam: { 
          id: data.teams.away.id.toString(), 
          name: data.teams.away.name, 
          logo: data.teams.away.logo 
        },
        homeScore: data.goals.home,
        awayScore: data.goals.away,
        halftime: { home: data.score.halftime.home, away: data.score.halftime.away },
        fulltime: { home: data.score.fulltime.home, away: data.score.fulltime.away },
        penalties: data.score.penalty ? { home: data.score.penalty.home, away: data.score.penalty.away } : null,
        venue: data.fixture.venue.name,
        referee: data.fixture.referee,
        events: data.events || [],
        statistics: data.statistics || [],
        lineups: data.lineups || [],
        coaches: { home: '', away: '' }, // Need data mapping
        formations: { home: '', away: '' }, // Need data mapping
        injuries: [], // Need data mapping
        cards: [], // Need data mapping
        substitutions: [], // Need data mapping
        odds: null,
        broadcasters: [],
        lastUpdated: new Date(),
        cacheUntil: new Date(Date.now() + 60000)
      } as Match;
      console.log(`[Forensic] MatchNormalizer normalized: ${match.id} (${match.homeTeam.name} vs ${match.awayTeam.name})`);
      return match;
    } catch (e) {
      console.error(`[Forensic] MatchNormalizer failed for match: ${JSON.stringify(data.fixture.id)}`);
      throw e;
    }
  }
}
