import { IProvider } from '../../contracts/providers/IProvider';
import { Match } from '../../domain/entities/Match';
import { MatchNormalizer } from '../normalization/MatchNormalizer';
import { IApiConfigProvider } from '../../contracts/infrastructure/IApiConfigProvider';

export class ApiManagerAdapter implements IProvider {
  name = 'ApiManagerAdapter';
  private normalizer = new MatchNormalizer();

  constructor(private configProvider: IApiConfigProvider) {}

  private async request(endpoint: string) {
    await this.configProvider.loadConfig();
    
    const { providerDoc, targetProviderName } = await this.configProvider.getActiveKeyForCategory('matches', 'API-Football');
    const selected = providerDoc;

    console.log(`[ApiManagerAdapter] Using provider: ${selected.provider} (${selected.id})`);

    let targetUrl = '';
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    const key = selected.key;
    const isApiSports = key.length === 32;
    const isRapidApiFootball = key.length === 50;
    
    let cleanPath = endpoint;
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
    if (cleanPath.startsWith("v3/")) cleanPath = cleanPath.slice(3);

    if (selected.provider === 'API-Football') {
      if (isApiSports) {
        targetUrl = `https://v3.football.api-sports.io/${cleanPath}`;
        headers['x-apisports-key'] = key;
      } else if (isRapidApiFootball) {
        targetUrl = `https://api-football-v1.p.rapidapi.com/v3/${cleanPath}`;
        headers['X-RapidAPI-Key'] = key;
        headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
      } else { 
         targetUrl = `https://free-api-live-football-data.p.rapidapi.com/${cleanPath}`;
         headers['X-RapidAPI-Key'] = key;
         headers['X-RapidAPI-Host'] = 'free-api-live-football-data.p.rapidapi.com';
      }
        } else if (selected.provider === 'TheSportsDB') {
        if (cleanPath.includes('date=')) {
            const date = cleanPath.split('date=')[1].split('&')[0];
            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${date}`;
        } else if (cleanPath.includes('live=all')) {
            const todayStr = new Date().toISOString().split('T')[0];
            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${todayStr}`;
        } else if (cleanPath.startsWith('fixtures?id=')) {
            const id = cleanPath.split('id=')[1].split('&')[0];
            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/lookupevent.php?id=${id}`;
        } else if (cleanPath.startsWith('standings')) {
            // e.g. standings?league=123&season=2025
            const urlParams = new URLSearchParams(cleanPath.split('?')[1] || '');
            const league = urlParams.get('league') || '';
            const season = urlParams.get('season') || '';
            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/lookuptable.php?l=${league}&s=${season}`;
        } else if (cleanPath.startsWith('fixtures/lineups')) {
            const fixture = cleanPath.split('fixture=')[1].split('&')[0];
            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/lookuplineup.php?id=${fixture}`;
        } else if (cleanPath.startsWith('fixtures/statistics') || cleanPath.startsWith('fixtures/events')) {
            // Not well supported by TheSportsDB free tier, mock an empty response JSON structure
            targetUrl = ''; // We will handle this by returning empty response directly
            return { data: { response: [] }, targetProviderName: selected.provider };
        } else {
            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/${cleanPath}`;
        }
    } else if (selected.provider === 'SportMonks') {
        // Basic mapping for SportMonks
        targetUrl = `https://api.sportmonks.com/v3/football/${cleanPath}`;
        headers['Authorization'] = key;
    } else if (selected.provider === 'Custom') {
        // For custom providers, we assume the 'key' field might actually contain the base URL or it's configured elsewhere.
        // For now, treat 'key' as the base URL if it starts with http, else prepend https://
        const baseUrl = key.startsWith('http') ? key : `https://${key}`;
        targetUrl = `${baseUrl}/${cleanPath}`;
    } else {
        targetUrl = `https://v3.football.api-sports.io/${cleanPath}`;
        headers['x-apisports-key'] = key;
    }

    console.log(`[ApiManagerAdapter] Fetching: ${targetUrl}`);
    const response = await fetch(targetUrl, { headers });
    const text = await response.text();
    
    try {
        const data = JSON.parse(text);
        if (selected.provider === 'TheSportsDB') {
            return { data: { response: data.events || data.results || [] }, targetProviderName: selected.provider };
        }
        return { data, targetProviderName: selected.provider };
    } catch (e) {
        console.error(`[ApiManagerAdapter] JSON Parse Error. Start of response: ${text.substring(0, 100)}`);
        // Instead of throwing, let's gracefully return empty to not crash shadow validation
        return { data: { response: [] }, targetProviderName: selected.provider };
    }
  }

  async fetchLiveMatches(): Promise<Match[]> {
    const { data, targetProviderName } = await this.request('/fixtures?live=all');
    if (!data.response) return [];
    return data.response.map((m: any) => this.normalizer.normalize({ ...m, provider: targetProviderName }));
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
