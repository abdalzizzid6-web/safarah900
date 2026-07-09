import { IProvider } from '../../contracts/providers/IProvider';
import { Match } from '../../domain/entities/Match';

export class MockApiFootballProvider implements IProvider {
  name = 'MockApiFootball';

  async fetchLiveMatches(): Promise<Match[]> {
    return [
      { id: '1', providerId: 'api-1', provider: this.name, status: 'LIVE' } as Match
    ];
  }

  async fetchMatchesByDate(date: Date): Promise<Match[]> { return []; }
  async fetchMatch(id: string): Promise<Match | null> { return null; }
  async fetchStandings(leagueId: string): Promise<any[]> { return []; }
  async fetchStatistics(matchId: string): Promise<any[]> { return []; }
  async fetchEvents(matchId: string): Promise<any[]> { return []; }
  async fetchLineups(matchId: string): Promise<any[]> { return []; }
}
