import { IProvider } from '../../contracts/providers/IProvider';
import { Match } from '../../domain/entities/Match';
import { apiManager } from '../../../server/services/apiManager';
import { MatchNormalizer } from '../normalization/MatchNormalizer';

export class ApiManagerAdapter implements IProvider {
  name = 'ApiManagerAdapter';
  private normalizer = new MatchNormalizer();

  private async request(endpoint: string) {
    const { key, targetProviderName } = await apiManager.getActiveKeyForCategory('matches');
    const baseUrl = 'https://v3.football.api-sports.io';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'x-apisports-key': key }
    });
    const data = await response.json();
    return { data, targetProviderName };
  }

  async fetchLiveMatches(): Promise<Match[]> {
    const { data, targetProviderName } = await this.request('/fixtures?live=all');
    if (!data.response) return [];
    console.log(`[Forensic] Provider returned ${data.response.length} raw matches.`);
    const matches = data.response.map((m: any) => this.normalizer.normalize({ ...m, provider: targetProviderName }));
    console.log(`[Forensic] Adapter normalized ${matches.length} matches.`);
    return matches;
  }

  async fetchMatchesByDate(date: Date): Promise<Match[]> {
    const dateStr = date.toISOString().split('T')[0];
    const { data, targetProviderName } = await this.request(`/fixtures?date=${dateStr}`);
    if (!data.response) return [];
    return data.response.map((m: any) => this.normalizer.normalize({ ...m, provider: targetProviderName }));
  }

  async fetchMatch(id: string): Promise<Match | null> {
    const { data, targetProviderName } = await this.request(`/fixtures?id=${id}`);
    if (!data.response || data.response.length === 0) return null;
    return this.normalizer.normalize({ ...data.response[0], provider: targetProviderName });
  }

  async fetchStandings(leagueId: string): Promise<any[]> {
    const { data } = await this.request(`/standings?league=${leagueId}&season=2025`);
    return data.response || [];
  }

  async fetchStatistics(matchId: string): Promise<any[]> {
    const { data } = await this.request(`/fixtures/statistics?fixture=${matchId}`);
    return data.response || [];
  }

  async fetchEvents(matchId: string): Promise<any[]> {
    const { data } = await this.request(`/fixtures/events?fixture=${matchId}`);
    return data.response || [];
  }

  async fetchLineups(matchId: string): Promise<any[]> {
    const { data } = await this.request(`/fixtures/lineups?fixture=${matchId}`);
    return data.response || [];
  }
}
