import { IProvider } from '../../contracts/providers/IProvider';
import { Match } from '../../domain/entities/Match';
import { ConfigManager } from '../configuration/ConfigManager';

export class ApiFootballRealProvider implements IProvider {
  name = 'ApiFootball';
  private apiKey: string;
  private baseUrl: string;

  constructor(private configManager: ConfigManager) {
    this.apiKey = this.configManager.get('VITE_API_FOOTBALL_KEY') || '';
    this.baseUrl = this.configManager.get('VITE_API_FOOTBALL_BASE') || 'https://v3.football.api-sports.io';
  }

  async fetchLiveMatches(): Promise<Match[]> {
    if (!this.apiKey) throw new Error('API Key missing');
    const response = await fetch(`${this.baseUrl}/fixtures?live=all`, {
      headers: { 'x-apisports-key': this.apiKey }
    });
    const data = await response.json();
    if (!data.response) return [];
    
    return data.response.map((m: any) => ({
      id: m.fixture.id.toString(),
      providerId: m.fixture.id.toString(),
      provider: this.name,
      status: m.fixture.status.short,
      homeTeam: m.teams.home.name,
      awayTeam: m.teams.away.name,
      homeScore: m.goals.home,
      awayScore: m.goals.away,
      kickoffTime: new Date(m.fixture.date),
      lastUpdated: new Date()
    } as Match));
  }

  async fetchMatchesByDate(date: Date): Promise<Match[]> { return []; }
  async fetchMatch(id: string): Promise<Match | null> { return null; }
  async fetchStandings(leagueId: string): Promise<any[]> { return []; }
  async fetchStatistics(matchId: string): Promise<any[]> { return []; }
  async fetchEvents(matchId: string): Promise<any[]> { return []; }
  async fetchLineups(matchId: string): Promise<any[]> { return []; }
}
