import { WCMatch, StandingGroup, WCTeam, ScorerEntry } from './worldCupService';
import { openFootballService } from './openFootballService';

export interface WorldCupDataProvider {
  name: string;
  getMatches(year?: number): Promise<WCMatch[]>;
  getStandings(year?: number): Promise<StandingGroup[]>;
  getTeams(year?: number): Promise<WCTeam[]>;
  getScorers(year?: number): Promise<ScorerEntry[]>;
}

/**
 * Primary Robust Data Provider utilizing football-data.org via proxy API helper
 */
export class FootballDataOrgProvider implements WorldCupDataProvider {
  name = 'FootballDataOrg';

  private async fetchFromProxy<T>(endpoint: string): Promise<T> {
    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`Proxy error fetching ${endpoint}: status ${res.status}`);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
      throw new Error(`Proxy error fetching ${endpoint}: Response is not JSON`);
    }
    return res.json() as Promise<T>;
  }

  async getMatches(year?: number): Promise<WCMatch[]> {
    const targetYear = year || 2026;
    // Primary strategy: fetch from football-data proxy
    const data = await this.fetchFromProxy<any>(`/api/football-data/competitions/WC/matches?season=${targetYear}`);
    if (data && data.matches) {
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
          fullTime: { home: m.score.fullTime?.home ?? null, away: m.score.fullTime?.away ?? null },
          halfTime: { home: m.score.halfTime?.home ?? null, away: m.score.halfTime?.away ?? null }
        },
        referees: m.referees || [],
        venue: m.venue,
        elapsed: m.status === 'IN_PLAY' ? 45 : undefined
      }));
    }
    return [];
  }

  async getStandings(year?: number): Promise<StandingGroup[]> {
    const targetYear = year || 2026;
    const data = await this.fetchFromProxy<any>(`/api/football-data/competitions/WC/standings?season=${targetYear}`);
    if (data && data.standings) {
      return data.standings.map((s: any) => ({
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
    }
    // Fallback: calculate standings from matches
    const matches = await this.getMatches(targetYear);
    return openFootballService.calculateStandings(matches as any) as StandingGroup[];
  }

  async getTeams(year?: number): Promise<WCTeam[]> {
    const targetYear = year || 2026;
    const data = await this.fetchFromProxy<any>(`/api/football-data/competitions/WC/teams?season=${targetYear}`);
    if (data && data.teams) {
      return data.teams.map((t: any) => ({
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
    return [];
  }

  async getScorers(year?: number): Promise<ScorerEntry[]> {
    const targetYear = year || 2026;
    const data = await this.fetchFromProxy<any>(`/api/football-data/competitions/WC/scorers?season=${targetYear}`);
    if (data && data.scorers) {
      return data.scorers.map((s: any) => ({
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
    }
    return [];
  }
}

/**
 * Local Fallback Provider that can be activated as an alternate source if API keys are offline
 */
export class LocalBackupProvider implements WorldCupDataProvider {
  name = 'LocalBackup';

  async getMatches(year?: number): Promise<WCMatch[]> {
    const targetYear = year || 2026;
    const data = await openFootballService.getEditionData(targetYear);
    return data.matches as unknown as WCMatch[];
  }

  async getStandings(year?: number): Promise<StandingGroup[]> {
    const targetYear = year || 2026;
    const matches = await this.getMatches(targetYear);
    return openFootballService.calculateStandings(matches as any) as StandingGroup[];
  }

  async getTeams(year?: number): Promise<WCTeam[]> {
    const targetYear = year || 2026;
    const data = await openFootballService.getEditionData(targetYear);
    return data.teams as unknown as WCTeam[];
  }

  async getScorers(year?: number): Promise<ScorerEntry[]> {
    return [];
  }
}

// Instantiate active provider manager
class DataProviderManager {
  private activeProvider: WorldCupDataProvider = new FootballDataOrgProvider();
  private fallbackProvider: WorldCupDataProvider = new LocalBackupProvider();

  setProvider(providerName: 'FootballDataOrg' | 'LocalBackup') {
    if (providerName === 'FootballDataOrg') {
      this.activeProvider = new FootballDataOrgProvider();
    } else {
      this.activeProvider = new LocalBackupProvider();
    }
  }

  getProvider(): WorldCupDataProvider {
    return this.activeProvider;
  }

  getFallback(): WorldCupDataProvider {
    return this.fallbackProvider;
  }
}

export const dataProviderManager = new DataProviderManager();
